import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import { api } from '../lib/api.js';
import type { Survey } from '../types/survey.d.ts';

export default function SurveyRespondPage() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!surveyId) return;
    const fetchSurvey = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/surveys/${surveyId}`);
        setSurvey(response.data.survey);
        setAnswers(new Array(response.data.survey.questions.length).fill(''));
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load this survey.');
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [surveyId]);

  const setAnswer = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!surveyId || !survey) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/api/surveys/${surveyId}/responses`, { answers });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-400">Loading survey…</p>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-rose-500">{error}</p>
      </div>
    );
  }

  if (!survey) {
    return null;
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <CheckCircledIcon className="mx-auto h-10 w-10 text-emerald-500" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Thanks for your feedback!</h1>
          <p className="mt-2 text-sm text-slate-500">Your response has been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">{survey.title}</h1>
        <p className="mt-1 text-sm text-slate-500">For {survey.audience}</p>

        {error ? <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-8 space-y-7">
          {survey.questions.map((question, index) => (
            <div key={question._id || index}>
              <p className="text-sm font-medium text-slate-800">
                {index + 1}. {question.text}
                {question.required ? <span className="ml-1 text-rose-500">*</span> : null}
              </p>

              <div className="mt-3">
                {question.type === 'short_text' ? (
                  <input
                    value={answers[index] || ''}
                    onChange={(event) => setAnswer(index, event.target.value)}
                    placeholder="Your answer"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
                  />
                ) : question.type === 'long_text' ? (
                  <textarea
                    rows={3}
                    value={answers[index] || ''}
                    onChange={(event) => setAnswer(index, event.target.value)}
                    placeholder="Your answer"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
                  />
                ) : question.type === 'multiple_choice' ? (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={answers[index] === option}
                          onChange={() => setAnswer(index, option)}
                          className="h-4 w-4"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAnswer(index, String(n))}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition ${
                          answers[index] === String(n)
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-8 w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
