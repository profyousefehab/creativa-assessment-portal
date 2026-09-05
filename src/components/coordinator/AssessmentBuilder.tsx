import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  FileText,
  Clock,
  Eye,
  Save,
  Send,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  getAssessmentById,
  getCourseById,
  updateAssessment,
  setAssessmentStatus,
} from '../../services/db';
import { Assessment, Question, Choice, QuestionType } from '../../types';
import { showToast } from '../common/Toast';
import { getTextDirection, containsArabic } from '../../utils/rtl';

interface AssessmentBuilderProps {
  assessmentId: string;
  onBack: () => void;
  onPreview: (assessmentId: string) => void;
}

export const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({
  assessmentId,
  onBack,
  onPreview,
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [courseName, setCourseName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const asm = getAssessmentById(assessmentId);
    if (asm) {
      setAssessment(asm);
      setDurationMinutes(asm.durationMinutes);
      // Deep clone questions for local draft editing
      setQuestions(JSON.parse(JSON.stringify(asm.questions)));

      const course = getCourseById(asm.courseId);
      setCourseName(course?.name || '');
    }
  }, [assessmentId]);

  if (!assessment) {
    return <div className="p-8 text-center text-slate-500">Assessment not found.</div>;
  }

  const handleAddQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      text: '',
      type,
      points: type === 'ESSAY' ? 10 : 5,
      choices:
        type !== 'ESSAY'
          ? [
              { id: 'c_' + Date.now() + '_1', text: '', isCorrect: true },
              { id: 'c_' + Date.now() + '_2', text: '', isCorrect: false },
            ]
          : undefined,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].text = text;
    setQuestions(updated);
  };

  const handleQuestionPointsChange = (index: number, points: number) => {
    const updated = [...questions];
    updated[index].points = Math.max(1, points);
    setQuestions(updated);
  };

  const handleAddChoice = (qIndex: number) => {
    const updated = [...questions];
    const q = updated[qIndex];
    if (!q.choices) q.choices = [];
    q.choices.push({
      id: 'c_' + Date.now() + '_' + (q.choices.length + 1),
      text: '',
      isCorrect: false,
    });
    setQuestions(updated);
  };

  const handleRemoveChoice = (qIndex: number, cIndex: number) => {
    const updated = [...questions];
    const q = updated[qIndex];
    if (!q.choices || q.choices.length <= 2) {
      showToast('A choice question must have at least 2 choices.', 'error');
      return;
    }
    q.choices = q.choices.filter((_, i) => i !== cIndex);
    // Ensure at least one is correct for single choice
    if (q.type === 'SINGLE_CHOICE' && !q.choices.some((c) => c.isCorrect)) {
      q.choices[0].isCorrect = true;
    }
    setQuestions(updated);
  };

  const handleChoiceTextChange = (qIndex: number, cIndex: number, text: string) => {
    const updated = [...questions];
    if (updated[qIndex].choices) {
      updated[qIndex].choices![cIndex].text = text;
      setQuestions(updated);
    }
  };

  const handleToggleCorrectChoice = (qIndex: number, cIndex: number) => {
    const updated = [...questions];
    const q = updated[qIndex];
    if (!q.choices) return;

    if (q.type === 'SINGLE_CHOICE') {
      q.choices.forEach((c, idx) => {
        c.isCorrect = idx === cIndex;
      });
    } else {
      q.choices[cIndex].isCorrect = !q.choices[cIndex].isCorrect;
    }
    setQuestions(updated);
  };

  const validateQuestions = (): boolean => {
    if (questions.length === 0) {
      showToast('Assessment must have at least 1 question.', 'error');
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        showToast(`Question ${i + 1} is missing question text.`, 'error');
        return false;
      }
      if (q.type !== 'ESSAY') {
        if (!q.choices || q.choices.length < 2) {
          showToast(`Question ${i + 1} must have at least 2 choices.`, 'error');
          return false;
        }
        for (let j = 0; j < q.choices.length; j++) {
          if (!q.choices[j].text.trim()) {
            showToast(`Question ${i + 1}, Choice ${j + 1} is empty.`, 'error');
            return false;
          }
        }
        if (!q.choices.some((c) => c.isCorrect)) {
          showToast(`Question ${i + 1} must have at least one correct answer.`, 'error');
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveDraft = () => {
    updateAssessment(assessment.id, {
      durationMinutes,
      questions,
    });
    showToast('Assessment draft saved successfully.', 'success');
  };

  const handleSaveAndPublish = () => {
    if (!validateQuestions()) return;

    updateAssessment(assessment.id, {
      durationMinutes,
      questions,
    });
    setAssessmentStatus(assessment.id, 'PUBLISHED');
    showToast('Assessment published successfully.', 'success');
    onBack();
  };

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const isPreTest = assessment.type === 'PRE_TEST';

  return (
    <div id="assessment-builder-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#e5e5e5]">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 text-[#616161] hover:text-[#004e9e] rounded-full hover:bg-[#e6eff8] transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full ${
                  isPreTest
                    ? 'bg-[#e6eff8] text-[#004e9e] border border-[#004e9e]/20'
                    : 'bg-[#fef3e2] text-[#b45309] border border-[#f8af43]/30'
                }`}
              >
                {isPreTest ? 'Pre-Test' : 'Post-Test'} Builder
              </span>
              <span className="text-xs text-[#9e9e9e] font-mono">v{assessment.currentVersion}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#222222] tracking-tight mt-0.5 break-words">
              {courseName}
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onPreview(assessment.id)}
            className="btn-pill-secondary py-2 px-4 text-xs font-bold w-full sm:w-auto"
          >
            <Eye className="w-4 h-4 text-[#616161]" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="btn-pill-secondary py-2 px-4 text-xs font-bold w-full sm:w-auto"
          >
            <Save className="w-4 h-4 text-[#616161]" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndPublish}
            className="btn-pill-primary py-2 px-5 text-xs font-bold w-full sm:w-auto"
          >
            <Send className="w-4 h-4" />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#e5e5e5]">
        <h2 className="text-xs font-bold text-[#222222] uppercase tracking-wider mb-4">
          Assessment Settings
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#616161] mb-1">
              Assessment Type
            </label>
            <input
              type="text"
              readOnly
              value={isPreTest ? 'Pre-Test' : 'Post-Test'}
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-sm font-semibold text-[#616161] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#616161] mb-1">
              Duration (Minutes) *
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(5, parseInt(e.target.value) || 30))}
                className="w-full px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-sm font-bold text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white"
              />
              <Clock className="w-4 h-4 text-[#9e9e9e] absolute right-4 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#616161] mb-1">
              Summary Info
            </label>
            <div className="px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-sm font-medium text-[#616161] flex items-center justify-between">
              <span>{questions.length} Questions</span>
              <span className="font-bold text-[#222222]">{totalPoints} Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#222222] tracking-tight">Questions</h2>
            <p className="text-xs text-[#616161]">
              English and Arabic content supported. Arabic questions and choices automatically render RTL with Thmanyah Sans.
            </p>
          </div>

          {/* Add Question Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddQuestion('SINGLE_CHOICE')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#fafafa] border border-[#e5e5e5] hover:bg-[#e6eff8] hover:text-[#004e9e] text-[#222222] text-xs font-bold rounded-full transition-all"
            >
              <Circle className="w-3.5 h-3.5 text-[#004e9e]" />
              <span>+ Single Choice</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#fafafa] border border-[#e5e5e5] hover:bg-[#e6eff8] hover:text-[#004e9e] text-[#222222] text-xs font-bold rounded-full transition-all"
            >
              <CheckSquare className="w-3.5 h-3.5 text-teal-700" />
              <span>+ Multiple Choice</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuestion('ESSAY')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#fafafa] border border-[#e5e5e5] hover:bg-[#fef3e2] hover:text-[#b45309] text-[#222222] text-xs font-bold rounded-full transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-[#f8af43]" />
              <span>+ Essay</span>
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-[#e5e5e5] p-12 text-center">
            <AlertCircle className="w-10 h-10 text-[#9e9e9e] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#222222]">No questions added yet</p>
            <p className="text-xs text-[#616161] mt-1">
              Add Single Choice, Multiple Choice, or Essay questions using the buttons above.
            </p>
          </div>
        ) : (
          questions.map((q, qIndex) => {
            const isArabicQ = containsArabic(q.text);
            return (
              <div
                key={q.id}
                id={`question-card-${qIndex}`}
                className="bg-white rounded-3xl border border-[#e5e5e5] p-6 space-y-4 hover:border-[#004e9e]/30 transition-all"
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5e5e5]">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[#004e9e] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {qIndex + 1}
                    </span>
                    <span
                      className={`px-3 py-0.5 text-xs font-semibold rounded-full ${
                        q.type === 'SINGLE_CHOICE'
                          ? 'bg-[#e6eff8] text-[#004e9e] border border-[#004e9e]/20'
                          : q.type === 'MULTIPLE_CHOICE'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-[#fef3e2] text-[#b45309] border border-[#f8af43]/30'
                      }`}
                    >
                      {q.type.replace('_', ' ')}
                    </span>
                    {isArabicQ && (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Arabic RTL Detected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-[#616161]">
                      <span className="font-semibold">Points:</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={q.points}
                        onChange={(e) =>
                          handleQuestionPointsChange(qIndex, parseInt(e.target.value) || 1)
                        }
                        className="w-14 sm:w-16 px-2 py-1 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-center font-bold text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      title="Delete Question"
                      className="p-1.5 text-[#9e9e9e] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text Area with Auto RTL */}
                <div>
                  <label className="block text-xs font-semibold text-[#616161] mb-1">
                    Question Text *
                  </label>
                  <textarea
                    rows={2}
                    dir="auto"
                    placeholder="Enter question text (English or Arabic)..."
                    value={q.text}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                    className={`w-full p-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white transition-all ${
                      isArabicQ ? "font-arabic text-right leading-relaxed" : "text-left"
                    }`}
                  />
                </div>

                {/* Choice Editor for Choice questions */}
                {q.type !== 'ESSAY' && q.choices && (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#616161]">
                      <span>
                        Choices (
                        {q.type === 'SINGLE_CHOICE'
                          ? 'Select 1 correct answer'
                          : 'Check all correct answers for partial credit'}
                        )
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddChoice(qIndex)}
                        className="text-[#004e9e] hover:text-[#003b78] font-bold"
                      >
                        + Add Choice
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.choices.map((c, cIndex) => {
                        const isArabicChoice = containsArabic(c.text);
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center gap-3 p-2 rounded-full border transition-all ${
                              c.isCorrect
                                ? 'bg-emerald-50/70 border-emerald-300'
                                : 'bg-[#fafafa] border-[#e5e5e5]'
                            }`}
                          >
                            {/* Correct Indicator button */}
                            <button
                              type="button"
                              onClick={() => handleToggleCorrectChoice(qIndex, cIndex)}
                              title={c.isCorrect ? 'Marked Correct' : 'Mark as Correct'}
                              className={`p-1.5 rounded-full transition-colors shrink-0 ${
                                c.isCorrect ? 'text-emerald-600' : 'text-[#9e9e9e] hover:text-[#616161]'
                              }`}
                            >
                              {q.type === 'SINGLE_CHOICE' ? (
                                c.isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )
                              ) : c.isCorrect ? (
                                <CheckSquare className="w-5 h-5 fill-emerald-600 text-white" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>

                            {/* Choice input with auto RTL */}
                            <input
                              type="text"
                              dir="auto"
                              placeholder={`Option ${cIndex + 1} (English or Arabic)...`}
                              value={c.text}
                              onChange={(e) =>
                                handleChoiceTextChange(qIndex, cIndex, e.target.value)
                              }
                              className={`flex-1 px-4 py-1.5 bg-white border border-[#e5e5e5] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#004e9e] ${
                                isArabicChoice ? "font-arabic text-right leading-relaxed" : "text-left"
                              }`}
                            />

                            {/* Delete Choice */}
                            <button
                              type="button"
                              onClick={() => handleRemoveChoice(qIndex, cIndex)}
                              className="p-1.5 text-[#9e9e9e] hover:text-rose-600 hover:bg-rose-50 rounded-full shrink-0 mr-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Essay Note */}
                {q.type === 'ESSAY' && (
                  <div className="p-4 bg-[#fef3e2] border border-[#f8af43]/30 rounded-2xl text-xs text-[#b45309] space-y-1">
                    <p className="font-bold">Text-only Essay Question:</p>
                    <p>
                      Students will write their answer in a large textarea. Coordinator manually grades this answer (0 to {q.points} points) in the Essay Reviews module.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
