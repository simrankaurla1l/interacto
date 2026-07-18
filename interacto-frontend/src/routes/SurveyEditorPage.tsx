import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ChatBubbleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cross2Icon,
  DotsHorizontalIcon,
  Link2Icon,
  Pencil1Icon,
  RowsIcon,
  Share1Icon,
  TrashIcon
} from '@radix-ui/react-icons';
import { api } from '../lib/api.js';
import type { QuestionType, Survey } from '../types/survey.d.ts';

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short answer',
  long_text: 'Long answer',
  multiple_choice: 'Multiple choice',
  rating: 'Rating (1-5)'
};

export default function SurveyEditorPage() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editedText, setEditedText] = useState('');
  const [editedType, setEditedType] = useState<QuestionType>('short_text');
  const [editedOptions, setEditedOptions] = useState<string[]>([]);
  const [editedRequired, setEditedRequired] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches);
  const [editPanelOpen, setEditPanelOpen] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches);
  const [view, setView] = useState<'create' | 'results'>('create');
  const autosaveTimerRef = useRef<number | null>(null);

  const selectedQuestion = survey?.questions[selectedIndex];

  useEffect(() => {
    if (!surveyId) return;

    const fetchSurvey = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/surveys/${surveyId}`);
        setSurvey(response.data.survey);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load survey.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  useEffect(() => {
    if (selectedQuestion) {
      setEditedText(selectedQuestion.text);
      setEditedType(selectedQuestion.type);
      setEditedOptions(selectedQuestion.options.length ? selectedQuestion.options : ['', '']);
      setEditedRequired(selectedQuestion.required);
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, survey?._id]);

  const saveQuestion = async (payload: { text: string; type: QuestionType; options: string[]; required: boolean }) => {
    if (!surveyId || selectedQuestion == null) return;
    try {
      const response = await api.patch(`/api/surveys/${surveyId}/questions/${selectedIndex}`, payload);
      setSurvey(response.data.survey);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save question.');
    }
  };

  useEffect(() => {
    if (!selectedQuestion || !dirty) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      saveQuestion({
        text: editedText.trim(),
        type: editedType,
        options: editedType === 'multiple_choice' ? editedOptions.map((option) => option.trim()).filter(Boolean) : [],
        required: editedRequired
      });
      setDirty(false);
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedText, editedType, editedOptions, editedRequired, dirty]);

  const addQuestion = async () => {
    if (!surveyId) return;
    try {
      const response = await api.post(`/api/surveys/${surveyId}/questions`);
      setSurvey(response.data.survey);
      setSelectedIndex(response.data.survey.questions.length - 1);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add question.');
    }
  };

  const deleteQuestion = async (index: number) => {
    if (!surveyId) return;
    if (!window.confirm('Delete this question?')) return;
    try {
      const response = await api.delete(`/api/surveys/${surveyId}/questions/${index}`);
      setSurvey(response.data.survey);
      setSelectedIndex((prev) => Math.max(0, Math.min(prev, response.data.survey.questions.length - 1)));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete question.');
    }
  };

  const respondUrl = () => `${window.location.origin}/survey/${surveyId}/respond`;

  const handleSaveNow = () => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    if (selectedQuestion) {
      saveQuestion({
        text: editedText.trim(),
        type: editedType,
        options: editedType === 'multiple_choice' ? editedOptions.map((option) => option.trim()).filter(Boolean) : [],
        required: editedRequired
      });
    }
    setDirty(false);
    setSaveFeedback(true);
    window.setTimeout(() => setSaveFeedback(false), 1500);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(respondUrl());
      setCopyFeedback(true);
      window.setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      setError('Could not copy link.');
    }
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${survey?.title || 'Take this survey'}: ${respondUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };

  const shareViaSystem = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: survey?.title || 'Survey', url: respondUrl() });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      setShareOpen(false);
    } else {
      await copyShareLink();
      setShareOpen(false);
    }
  };

  const moveQuestion = async (direction: 'up' | 'down') => {
    if (!surveyId || selectedQuestion == null) return;
    const targetIndex = direction === 'up' ? selectedIndex - 1 : selectedIndex + 1;
    if (targetIndex < 0 || !survey?.questions[targetIndex]) return;
    try {
      const response = await api.patch(`/api/surveys/${surveyId}/questions/${selectedIndex}`, { move: direction });
      setSurvey(response.data.survey);
      setSelectedIndex(targetIndex);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to move question.');
    }
  };

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background:
          'radial-gradient(circle at 8% 0%, rgba(251,146,60,0.08) 0%, transparent 40%), radial-gradient(circle at 92% 0%, rgba(251,191,36,0.08) 0%, transparent 40%), #f8fafc'
      }}
    >
      <header className="flex h-16 items-center gap-1 border-b border-orange-300 bg-gradient-to-r from-orange-200 via-orange-100 to-amber-100 px-2 sm:gap-4 sm:px-4">
        <Link to="/dashboard" className="rounded-full p-2 text-slate-900 transition hover:bg-orange-50 hover:text-orange-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <button
          onClick={() => setQuestionsOpen(true)}
          className="rounded-full p-2 text-slate-900 transition hover:bg-orange-50 hover:text-orange-600 lg:hidden"
          title="Questions"
        >
          <RowsIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => setEditPanelOpen(true)}
          className="rounded-full p-2 text-slate-900 transition hover:bg-orange-50 hover:text-orange-600 lg:hidden"
          title="Edit question"
        >
          <Pencil1Icon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">{survey?.title || 'Untitled survey'}</h1>
          <p className="hidden text-xs text-slate-400 sm:block">My surveys</p>
        </div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          <button
            onClick={handleSaveNow}
            className="flex items-center gap-1.5 rounded-full border border-orange-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-700 sm:px-4 sm:py-2 sm:text-sm"
          >
            {saveFeedback ? <CheckIcon className="h-4 w-4 text-emerald-500" /> : null}
            {saveFeedback ? 'Saved' : 'Save'}
          </button>

          {shareOpen ? (
            <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
          ) : null}
          <div className="relative">
            <button
              onClick={() => setShareOpen(!shareOpen)}
              className="relative z-20 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
            >
              <Share1Icon className="h-4 w-4" /> Share
            </button>
            {shareOpen ? (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <p className="px-3 py-1.5 text-xs text-slate-400">Share the survey link with respondents</p>
                <button
                  onClick={shareOnWhatsApp}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <ChatBubbleIcon className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                </button>
                <button
                  onClick={shareViaSystem}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <DotsHorizontalIcon className="h-3.5 w-3.5" /> More apps…
                </button>
                <button
                  onClick={copyShareLink}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Link2Icon className="h-3.5 w-3.5" /> {copyFeedback ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex items-center gap-1 border-b border-orange-200 bg-white px-2 sm:px-4">
        <button
          onClick={() => setView('create')}
          className={`relative flex items-center px-3 py-2.5 text-sm font-semibold transition ${
            view === 'create' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Create
          {view === 'create' ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-orange-500" /> : null}
        </button>
        <button
          onClick={() => setView('results')}
          className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold transition ${
            view === 'results' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Results
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">{survey?.responses?.length || 0}</span>
          {view === 'results' ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-orange-500" /> : null}
        </button>
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 7rem)' }}>
        {view === 'results' ? (
          <main className="flex-1 overflow-auto bg-gradient-to-br from-orange-100 to-amber-50 p-4 sm:p-8">
            <SurveyResultsView survey={survey} />
          </main>
        ) : (
        <>
        {/* Question list */}
        {questionsOpen ? (
          <>
            <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setQuestionsOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-40 w-full max-w-xs overflow-y-auto border-r border-orange-200 bg-orange-100 px-3 py-4 shadow-2xl lg:static lg:z-auto lg:w-60 lg:max-w-none lg:shadow-none">
              <div className="mb-3 flex items-center justify-between lg:hidden">
                <span className="text-sm font-semibold text-slate-900">Questions</span>
                <button onClick={() => setQuestionsOpen(false)} className="rounded-full p-1.5 text-slate-500 hover:bg-orange-200">
                  <Cross2Icon className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={addQuestion}
                className="mx-auto mb-4 block w-auto rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                + New question
              </button>

              {loading ? (
                <p className="text-sm text-slate-400">Loading questions…</p>
              ) : error && !survey ? (
                <p className="text-sm text-rose-500">{error}</p>
              ) : (
                <div className="space-y-2">
                  {survey?.questions.map((question, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={question._id || index}
                        onClick={() => {
                          setSelectedIndex(index);
                          setEditPanelOpen(true);
                        }}
                        className={`flex h-16 w-full min-w-0 items-start gap-2 overflow-hidden rounded-xl border border-orange-200 bg-white p-3 text-left shadow-sm transition ${
                          isSelected ? 'ring-2 ring-orange-500' : 'ring-1 ring-transparent hover:ring-orange-300'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0 text-xs text-slate-400">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{question.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>
          </>
        ) : null}

        {/* Form preview */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-orange-100 to-amber-50 p-4 sm:p-8">
          {loading ? (
            <p className="text-slate-400">Loading survey…</p>
          ) : error && !survey ? (
            <p className="text-rose-500">{error}</p>
          ) : survey ? (
            <div className="mx-auto max-w-2xl rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-8">
              <h2 className="text-2xl font-semibold text-slate-900">{survey.title}</h2>
              <p className="mt-1 text-sm text-slate-500">For {survey.audience}</p>

              <div className="mt-8 space-y-6">
                {survey.questions.map((question, index) => (
                  <div
                    key={question._id || index}
                    onClick={() => {
                      setSelectedIndex(index);
                      setEditPanelOpen(true);
                    }}
                    className={`cursor-pointer rounded-xl p-4 transition ${
                      index === selectedIndex ? 'ring-2 ring-orange-500' : 'ring-1 ring-transparent hover:ring-slate-200'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {index + 1}. {question.text}
                      {question.required ? <span className="ml-1 text-rose-500">*</span> : null}
                    </p>

                    <div className="mt-3">
                      {question.type === 'short_text' ? (
                        <input
                          disabled
                          placeholder="Short answer text"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
                        />
                      ) : question.type === 'long_text' ? (
                        <textarea
                          disabled
                          rows={3}
                          placeholder="Long answer text"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
                        />
                      ) : question.type === 'multiple_choice' ? (
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center gap-2 text-sm text-slate-600">
                              <input type="radio" disabled className="h-4 w-4" />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span
                              key={n}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-sm text-slate-400"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-400">Survey not found.</p>
          )}
        </main>

        {/* Edit panel */}
        {editPanelOpen ? (
          <>
            <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setEditPanelOpen(false)} />
            <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-xs overflow-y-auto border-l border-orange-200 bg-orange-100 px-5 py-4 shadow-2xl lg:static lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Edit question</h2>
            <button onClick={() => setEditPanelOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-orange-200 lg:hidden">
              <Cross2Icon className="h-4 w-4" />
            </button>
          </div>

          {selectedQuestion ? (
            <div className="mt-5 space-y-5">
              <label className="block space-y-1.5 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Question text</span>
                <textarea
                  rows={3}
                  value={editedText}
                  onChange={(event) => {
                    setEditedText(event.target.value);
                    setDirty(true);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-400"
                />
              </label>

              <label className="block space-y-1.5 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Answer type</span>
                <select
                  value={editedType}
                  onChange={(event) => {
                    setEditedType(event.target.value as QuestionType);
                    setDirty(true);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-400"
                >
                  {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {editedType === 'multiple_choice' ? (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Options</span>
                  {editedOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <input
                        value={option}
                        onChange={(event) => {
                          const next = [...editedOptions];
                          next[index] = event.target.value;
                          setEditedOptions(next);
                          setDirty(true);
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-400"
                      />
                      <button
                        onClick={() => {
                          setEditedOptions(editedOptions.filter((_, i) => i !== index));
                          setDirty(true);
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 hover:text-rose-500"
                      >
                        <Cross2Icon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setEditedOptions([...editedOptions, '']);
                      setDirty(true);
                    }}
                    className="text-xs font-medium text-orange-500 hover:text-orange-600"
                  >
                    + Add option
                  </button>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Required</span>
                <button
                  onClick={() => {
                    setEditedRequired(!editedRequired);
                    setDirty(true);
                  }}
                  className={`relative h-6 w-11 rounded-full transition ${editedRequired ? 'bg-orange-500' : 'bg-slate-200'}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      editedRequired ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => moveQuestion('up')}
                  disabled={selectedIndex === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-orange-300 disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveQuestion('down')}
                  disabled={!survey || selectedIndex === survey.questions.length - 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-orange-300 disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteQuestion(selectedIndex)}
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" /> Delete question
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No question selected.</p>
          )}
            </aside>
          </>
        ) : null}
        </>
        )}
      </div>
    </div>
  );
}

function SurveyResultsView({ survey }: { survey: Survey | null }) {
  if (!survey) return null;
  const responses = survey.responses || [];

  if (responses.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-orange-200 bg-white/80 p-12 text-center">
        <p className="text-sm font-semibold text-slate-700">No responses yet</p>
        <p className="mt-1 text-xs text-slate-500">Share your survey link and responses will show up here.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Total responses</p>
        <p className="mt-1 text-3xl font-bold text-orange-600">{responses.length}</p>
      </div>

      {survey.questions.map((question, index) => {
        const answers = responses
          .map((response) => response.answers[index])
          .filter((answer): answer is string => Boolean(answer && answer.trim()));

        return (
          <div key={question._id || index} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              {index + 1}. {question.text}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {answers.length} response{answers.length === 1 ? '' : 's'}
            </p>

            <div className="mt-4">
              {question.type === 'multiple_choice' ? (
                <MultipleChoiceBreakdown options={question.options} answers={answers} />
              ) : question.type === 'rating' ? (
                <RatingBreakdown answers={answers} />
              ) : (
                <TextAnswerList answers={answers} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MultipleChoiceBreakdown({ options, answers }: { options: string[]; answers: string[] }) {
  const total = answers.length;
  const counts = options.map((option) => answers.filter((answer) => answer === option).length);
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="space-y-2.5">
      {options.map((option, index) => {
        const count = counts[index];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={option}>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-700">{option}</span>
              <span>
                {count} ({pct}%)
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatingBreakdown({ answers }: { answers: string[] }) {
  const values = answers.map((answer) => Number(answer)).filter((value) => !Number.isNaN(value));
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const counts = [1, 2, 3, 4, 5].map((n) => values.filter((value) => value === n).length);
  const maxCount = Math.max(1, ...counts);

  return (
    <div>
      <p className="text-2xl font-bold text-orange-600">
        {average.toFixed(1)} <span className="text-sm font-medium text-slate-400">/ 5 average</span>
      </p>
      <div className="mt-3 space-y-2">
        {[1, 2, 3, 4, 5].map((n, index) => (
          <div key={n} className="flex items-center gap-2">
            <span className="w-3 text-xs font-medium text-slate-500">{n}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                style={{ width: `${(counts[index] / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right text-xs text-slate-500">{counts[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextAnswerList({ answers }: { answers: string[] }) {
  if (answers.length === 0) {
    return <p className="text-xs text-slate-400">No answers yet.</p>;
  }
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {answers.map((answer, index) => (
        <p key={index} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {answer}
        </p>
      ))}
    </div>
  );
}
