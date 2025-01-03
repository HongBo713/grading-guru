import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader } from 'lucide-react';
import type { Exam, Question, ExamLevel, GradingHarshness } from '../types/exam';

interface ExamEditorProps {
  exam: Exam;
  onSave: (exam: Exam) => Promise<void>;
  onChange: () => void;
  isLoading?: boolean;
}

const ExamEditor: React.FC<ExamEditorProps> = ({ 
  exam, 
  onSave, 
  onChange,
  isLoading = false 
}) => {
  const [currentExam, setCurrentExam] = useState<Exam>(exam);

  useEffect(() => {
    setCurrentExam(exam);
  }, [exam]);

  const handleExamChange = (updatedExam: Partial<Exam>) => {
    setCurrentExam({
      ...currentExam,
      ...updatedExam,
      title: updatedExam.title || currentExam.title,
      id: currentExam.id,
      date: currentExam.date,
      questions: updatedExam.questions || currentExam.questions
    });
    onChange();
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question: '',
      exampleAnswer: '',
      markingSchema: ''
    };

    handleExamChange({
      ...currentExam,
      questions: [...currentExam.questions, newQuestion]
    });
  };

  const updateQuestion = (questionId: string, field: keyof Question, value: string) => {
    handleExamChange({
      ...currentExam,
      questions: currentExam.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    });
  };

  const deleteQuestion = (questionId: string) => {
    handleExamChange({
      ...currentExam,
      questions: currentExam.questions.filter(q => q.id !== questionId)
    });
  };

  const levels: ExamLevel[] = ['undergraduate', 'graduate', 'phd', 'professional'];
  const harshnessLevels: GradingHarshness[] = ['lenient', 'moderate', 'strict', 'very-strict'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Exam Settings Section */}
          <div className="bg-[#2D2D2D] rounded-lg p-6 space-y-4">
            {/* Title */}
            <input
              type="text"
              value={currentExam.title}
              onChange={e => handleExamChange({ ...currentExam, title: e.target.value })}
              className="text-2xl font-bold bg-transparent border-b border-gray-600 w-full focus:outline-none focus:border-blue-500 mb-6"
              placeholder="Exam Title"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Subject */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Subject/Topic</label>
                <input
                  type="text"
                  value={currentExam.subject || ''}
                  onChange={e => handleExamChange({ ...currentExam, subject: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-gray-600 rounded p-2 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Mathematics, Physics"
                />
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Level</label>
                <select
                  value={currentExam.level || ''}
                  onChange={e => handleExamChange({ ...currentExam, level: e.target.value as ExamLevel })}
                  className="w-full bg-[#1E1E1E] border border-gray-600 rounded p-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Level</option>
                  {levels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grading Harshness */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Grading Harshness</label>
                <select
                  value={currentExam.harshness || ''}
                  onChange={e => handleExamChange({ ...currentExam, harshness: e.target.value as GradingHarshness })}
                  className="w-full bg-[#1E1E1E] border border-gray-600 rounded p-2 focus:outline-none focus:border-blue-500"
                >
                  {harshnessLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-300">Questions</h3>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <Plus size={20} />
                Add Question
              </button>
            </div>

            {currentExam.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Question {index + 1}</h3>
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="p-2 hover:bg-red-500 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Question</label>
                    <textarea
                      value={question.question}
                      onChange={e => updateQuestion(question.id, 'question', e.target.value)}
                      className="w-full bg-[#1E1E1E] border border-gray-600 rounded p-2 focus:outline-none focus:border-blue-500"
                      placeholder="Enter question..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Example Answer</label>
                    <textarea
                      value={question.exampleAnswer}
                      onChange={e => updateQuestion(question.id, 'exampleAnswer', e.target.value)}
                      className="w-full bg-[#1E1E1E] border border-gray-600 rounded p-2 focus:outline-none focus:border-blue-500"
                      placeholder="Enter example answer..."
                      rows={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Marking Schema</label>
                    <textarea
                      value={question.markingSchema}
                      onChange={e => updateQuestion(question.id, 'markingSchema', e.target.value)}
                      className="w-full bg-[#1E1E1E] border border-gray-600 rounded p-2 focus:outline-none focus:border-blue-500"
                      placeholder="Enter marking schema..."
                      rows={10}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="border-t border-gray-700 bg-[#1E1E1E] p-4">
        <button
          onClick={() => onSave(currentExam)}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          {isLoading ? 'Saving...' : 'Save Exam'}
        </button>
      </div>
    </div>
  );
};

export default ExamEditor;