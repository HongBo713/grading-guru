import React, { useState } from 'react';
import { PlusCircle, MonitorUp, Settings, X, Maximize2, Minus, Send, Loader, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import ExamEditor from './ExamEditor';
import type { Exam, ExamLevel, GradingHarshness } from '../types/exam';
import GradingReview from './GradingReview';
import AIModelSettings from './AIModelSetting';


const AppLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<'capture' | 'exam' | 'review'>('capture');
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedExamForGrading, setSelectedExamForGrading] = useState<Exam | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gradingResults, setGradingResults] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);


  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close' | 'restore') => {
    window.electron?.windowControl[action]?.();
  };

  const handleCreateExam = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to create a new exam?')) {
      return;
    }
    const newExam: Exam = {
      id: crypto.randomUUID(),
      title: 'New Exam',
      date: new Date().toISOString(),
      questions: [],
      subject: '',
      level: 'undergraduate' as ExamLevel,
      harshness: 'moderate' as GradingHarshness
    };
    setCurrentExam(newExam);
    setActiveView('exam');
    setHasUnsavedChanges(false);
  };

  const handleCapture = async () => {
    try {
      setIsCapturing(true);
      console.log('Starting screen capture...');

      // First minimize the main window
      await window.electron.windowControl.minimize();

      // Wait a brief moment for the window to minimize
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await window.electron.captureScreen();

      if (!dataUrl) {
        throw new Error('No image data received from screen capture');
      }

      console.log('Screen captured successfully');
      setCapturedImage(dataUrl);

      // Restore the window after capture
      await window.electron.windowControl.restore();

    } catch (error) {
      console.error('Error capturing screen:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      if (!['Selection cancelled',
        'Selection window closed unexpectedly',
        'No screen sources found'].includes(errorMessage)) {
        alert('Failed to capture screen. Please try again.');
      }

      await window.electron.windowControl.restore();
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExamSelect = (exam: Exam) => {
    setSelectedExamForGrading(exam);
  };

  const handleGrade = async () => {
    if (!selectedExamForGrading) {
      alert('Please select an exam first');
      return;
    }
    if (!capturedImage) {
      alert('Please capture a screenshot first');
      return;
    }

    // Directly move to review view without OCR processing
    setActiveView('review');
  };

  const handleGradingComplete = (results: any[]) => {
    setGradingResults(results);
    // TODO: Save results or navigate to results view
    setActiveView('capture');
  };

  const renderGradeButton = () => (
    <button
      onClick={handleGrade}
      disabled={isProcessing}
      className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isProcessing ? (
        <>
          <Loader className="animate-spin" size={20} />
          Processing...
        </>
      ) : (
        <>
          <Send size={20} />
          Grade
        </>
      )}
    </button>
  );

  const handleSaveExam = async (exam: Exam) => {
    setIsLoading(true);
    try {
      if (!exam.title.trim()) {
        throw new Error('Exam title is required');
      }
      if (!exams.find(e => e.id === exam.id)) {
        setExams([...exams, exam]);
      } else {
        setExams(exams.map(e => e.id === exam.id ? exam : e));
      }
      setCurrentExam(null);
      setActiveView('capture');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save exam:', error);
      alert(error instanceof Error ? error.message : 'Failed to save exam');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExam = (exam: Exam) => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to switch exams?')) {
      return;
    }
    setCurrentExam(exam);
    setActiveView('exam');
    setHasUnsavedChanges(false);
  };

  const handleExamChange = () => {
    setHasUnsavedChanges(true);
  };

  return (
    <div className="h-screen flex flex-col bg-[#1E1E1E] text-white">
      {/* Title Bar */}
      <div className="h-12 flex items-center justify-between draggable select-none border-b border-[#2D2D2D]">
        <div className="flex items-center h-full non-draggable">
          <button
            className="px-4 h-full hover:bg-[#2D2D2D] flex items-center gap-2"
          // onClick={handleCreateExam}
          >
            
            Grading-guru
          </button>

          <div className="flex h-full">
            <button
              className="px-3 h-full hover:bg-[#2D2D2D] flex items-center"
              onClick={() => setActiveView('capture')}
            >
              <MonitorUp size={16} />
            </button>
          </div>
        </div>

        <div className="flex h-full non-draggable">
          <button
            onClick={() => handleWindowControl('minimize')}
            className="px-4 h-full hover:bg-[#2D2D2D] flex items-center"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => handleWindowControl('maximize')}
            className="px-4 h-full hover:bg-[#2D2D2D] flex items-center"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={() => handleWindowControl('close')}
            className="px-4 h-full hover:bg-[#FF4444] flex items-center"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Sidebar */}
        <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0'
          } border-r border-[#2D2D2D] flex flex-col bg-[#252526] overflow-hidden`}>
          {/* Sidebar Content */}
          <div className={`${isSidebarOpen ? 'opacity-100 w-64' : 'opacity-0 w-0'} transition-all duration-300`}>
            <div className="p-4 border-b border-[#2D2D2D]">
              <button
                onClick={handleCreateExam}
                className="w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <PlusCircle size={18} />
                New Exam
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {exams.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">
                  No exams yet
                </div>
              ) : (
                exams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => handleSelectExam(exam)}
                    className={`p-3 hover:bg-[#2D2D2D] cursor-pointer border-b border-[#363636]
                      ${currentExam?.id === exam.id ? 'bg-[#2D2D2D]' : ''}`}
                  >
                    <div className="text-sm font-medium text-gray-200">{exam.title}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(exam.date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#2D2D2D]">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-2 text-gray-400 hover:text-white p-2 rounded hover:bg-[#2D2D2D]"
              >
                <Settings size={16} />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Button - Outside sidebar */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 bg-[#2D2D2D] rounded-full p-1 hover:bg-[#363636] z-10 transition-all duration-300 ${isSidebarOpen ? 'left-60' : 'left-0'
            }`}
        >
          {isSidebarOpen ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#1E1E1E]">
          {activeView === 'capture' ? (
            <>
              {/* Exam Selection Dropdown */}
              <div className="p-4 border-b border-[#2D2D2D]">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-1">
                        Select Exam for Grading
                      </label>
                      <div className="relative">
                        <select
                          value={selectedExamForGrading?.id || ''}
                          onChange={(e) => {
                            const exam = exams.find(ex => ex.id === e.target.value);
                            if (exam) handleExamSelect(exam);
                          }}
                          className="w-full bg-[#2D2D2D] text-white rounded px-4 py-2 appearance-none cursor-pointer pr-10"
                        >
                          <option value="">Choose an exam...</option>
                          {exams.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                              {exam.title}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      </div>
                    </div>
                    {selectedExamForGrading && (
                      <div className="text-sm text-gray-400">
                        <div>Subject: {selectedExamForGrading.subject}</div>
                        <div>Level: {selectedExamForGrading.level}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                {capturedImage ? (
                  <div className="relative max-w-2xl w-full">
                    <div className="relative w-full bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                      <img
                        src={capturedImage}
                        alt="Captured screen"
                        className="w-full h-full object-contain max-h-[60vh]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    No screenshot captured yet
                  </div>
                )}
              </div>

              {/* Bottom Controls */}
              <div className="border-t border-[#2D2D2D] p-4">
                <div className="max-w-2xl mx-auto flex justify-center gap-4">
                  <button
                    onClick={handleCapture}
                    disabled={isCapturing}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCapturing ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Capturing...
                      </>
                    ) : (
                      <>
                        <MonitorUp size={20} />
                        Capture Screen
                      </>
                    )}
                  </button>

                  {capturedImage && selectedExamForGrading && renderGradeButton()}
                </div>
              </div>
            </>
          ) : activeView === 'exam' ? (
            currentExam && (
              <div className="flex-1 min-h-0">
                <ExamEditor
                  exam={currentExam}
                  onSave={handleSaveExam}
                  onChange={handleExamChange}
                  isLoading={isLoading}
                />
              </div>
            )
          ) : (
            <GradingReview
              examQuestions={selectedExamForGrading?.questions || []}
              selectedExam={selectedExamForGrading}
              imageData={capturedImage} // Changed from recognizedText to imageData
              onBack={() => setActiveView('capture')}
              onComplete={handleGradingComplete}
            />
          )}
        </div>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1E1E1E] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-4 border-b border-[#2D2D2D]">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="hover:bg-[#2D2D2D] p-2 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <AIModelSettings />
            </div>
          </div>
        )}
      </div>
    </div>


  );
};

export default AppLayout;