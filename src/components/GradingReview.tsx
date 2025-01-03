import React, { useState, useCallback } from 'react';
import { Loader, ArrowLeft, Send, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import type { Question, Exam, GradingResult } from '../types/exam';
import { createAIService, loadAIConfig } from '../service/aiService';

interface GradingReviewProps {
  examQuestions: Question[];
  selectedExam: Exam | null;
  imageData: string | null;
  onBack: () => void;
  onComplete: (results: GradingResult[]) => void;
}

interface GradingState {
  isProcessing: boolean;
  error: string | null;
  feedback: GradingResult | null;
}

const initialGradingState: GradingState = {
  isProcessing: false,
  error: null,
  feedback: null
};

const MAX_ZOOM = 2;
const MIN_ZOOM = 0.5;
const ZOOM_STEP = 0.25;

const GradingReview: React.FC<GradingReviewProps> = ({
  examQuestions,
  selectedExam,
  imageData,
  onBack,
  onComplete
}) => {
  const [gradingState, setGradingState] = useState<GradingState>(initialGradingState);
  const [imageZoom, setImageZoom] = useState(1);

  const { isProcessing, error, feedback } = gradingState;

  const validateInputs = useCallback(() => {
    if (!selectedExam) {
      throw new Error('No exam selected');
    }
    if (!imageData) {
      throw new Error('No image data provided');
    }
    if (!examQuestions.length) {
      throw new Error('No exam questions provided');
    }
  }, [selectedExam, imageData, examQuestions]);

  const handleGradeWithAI = async () => {
    try {
      validateInputs();
      
      setGradingState({
        ...initialGradingState,
        isProcessing: true
      });

      const aiConfig = loadAIConfig();
      if (!aiConfig) {
        throw new Error('No AI provider configured. Please configure an AI provider in settings.');
      }

      const aiService = createAIService(aiConfig);
      const response = await aiService.gradeWithImage({
        exam: selectedExam!,
        questions: examQuestions,
        imageData: imageData!
      });

      setGradingState({
        isProcessing: false,
        error: null,
        feedback: response
      });

    } catch (error) {
      setGradingState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        feedback: null
      });
    }
  };

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setImageZoom(prev => {
      if (direction === 'in' && prev < MAX_ZOOM) return prev + ZOOM_STEP;
      if (direction === 'out' && prev > MIN_ZOOM) return prev - ZOOM_STEP;
      return prev;
    });
  }, []);

  const renderScoreSection = () => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Score</span>
        {isProcessing ? (
          <div className="animate-pulse bg-gray-700 h-8 w-20 rounded"></div>
        ) : (
          <span className="text-2xl font-bold text-blue-400">
            {feedback?.grading.final_score ?? 0}/
            {feedback?.grading.total_points_possible ?? 0}
          </span>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-400">
        Confidence: {(feedback?.grading?.confidence ?? 0) * 100}%
      </div>
    </div>
  );

  const renderDetailedFeedback = () => (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h4 className="font-medium">Detailed Feedback</h4>
      <p className="text-gray-300 whitespace-pre-wrap">
        {feedback?.feedback.detailed_comments || 
         (isProcessing ? 'Analyzing...' : '')}
      </p>
    </div>
  );

  const renderCriteria = () => (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h4 className="font-medium">Grading Criteria</h4>
      <div className="space-y-2">
        {feedback?.grading.schema_criteria.map((criterion, index) => (
          <div key={index} className="p-2 bg-gray-700 rounded">
            <div className="flex justify-between">
              <span>{criterion.criterion}</span>
              <span className="text-blue-400">
                {criterion.points_awarded}/{criterion.points_possible}
              </span>
            </div>
            {criterion.deduction_reason && (
              <p className="text-sm text-gray-400 mt-1">
                {criterion.deduction_reason}
              </p>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="p-2 bg-gray-700 rounded animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStrengthsAndImprovements = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-2">Strong Points</h4>
        {feedback?.feedback.criteria_met ? (
          <ul className="list-disc pl-4 space-y-1 text-green-400">
            {feedback.feedback.criteria_met.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        ) : (
          isProcessing && (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          )
        )}
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-2">Areas to Improve</h4>
        {feedback?.feedback.criteria_unmet ? (
          <ul className="list-disc pl-4 space-y-1 text-yellow-400">
            {feedback.feedback.criteria_unmet.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        ) : (
          isProcessing && (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          )
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            disabled={isProcessing}
          >
            <ArrowLeft size={16} />
            Back to Capture
          </button>
          <div className="text-sm text-gray-400">
            {selectedExam?.title} - {selectedExam?.subject}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 m-4 p-4 rounded-lg flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-6 p-6 h-full">
          {/* Left Panel - Student Answer */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Student's Answer</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom('out')}
                  className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
                  disabled={imageZoom <= MIN_ZOOM || isProcessing}
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-sm text-gray-400">
                  {Math.round(imageZoom * 100)}%
                </span>
                <button
                  onClick={() => handleZoom('in')}
                  className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
                  disabled={imageZoom >= MAX_ZOOM || isProcessing}
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg overflow-auto">
              <div 
                className="relative min-h-96 transition-transform"
                style={{ transform: `scale(${imageZoom})` }}
              >
                {imageData && (
                  <img
                    src={imageData}
                    alt="Student's answer"
                    className="max-w-full h-auto object-contain"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - AI Feedback */}
          <div className="space-y-4 overflow-auto">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">AI Feedback</h3>
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <Loader className="animate-spin" size={14} />
                  Analyzing...
                </div>
              )}
            </div>

            {!feedback && !isProcessing ? (
              <div className="bg-gray-800 rounded-lg p-6 h-96 flex flex-col items-center justify-center">
                <button
                  onClick={handleGradeWithAI}
                  disabled={isProcessing}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-3 
                           flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <Send size={20} />
                  Grade with AI
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {renderScoreSection()}
                {renderDetailedFeedback()}
                {renderCriteria()}
                {renderStrengthsAndImprovements()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {feedback && !isProcessing && (
        <div className="border-t border-gray-800 p-4">
          <div className="flex justify-end">
            <button
              onClick={() => onComplete([feedback])}
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-6 py-2
                       transition-colors"
            >
              Complete Grading
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingReview;