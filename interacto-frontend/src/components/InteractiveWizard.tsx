import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Cross2Icon } from '@radix-ui/react-icons';
import { api } from '../lib/api.js';

interface InteractiveWizardProps {
  open: boolean;
  onClose: () => void;
}

export default function InteractiveWizard({ open, onClose }: InteractiveWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const responseErrorMessage = (error: any) => {
    return error?.response?.data?.error || error?.message || '';
  };

  const handleQuestionGeneration = async () => {
    setError('');
    if (!topic || !audience || !goal) {
      setError('Please complete all fields before continuing.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/presentations/questions', { topic, audience, goal });
      setQuestions(response.data.questions || []);
      setAnswers(Array(response.data.questions?.length || 4).fill(''));
      setStep(2);
    } catch (err: any) {
      setError(responseErrorMessage(err) || 'Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePresentation = async () => {
    setError('');
    if (!questions.length) {
      setError('No questions available to generate the presentation.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/presentations/generate', {
        topic,
        audience,
        goal,
        questions,
        answers
      });
      navigate(`/editor/${response.data.presentationId}`);
      onClose();
    } catch (err: any) {
      setError(responseErrorMessage(err) || 'Failed to generate the presentation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-8"
          >
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(circle at 10% 0%, rgba(251,146,60,0.12) 0%, transparent 45%), radial-gradient(circle at 90% 10%, rgba(251,191,36,0.12) 0%, transparent 45%)'
              }}
            />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Interactive Presentation</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">AI wizard</h2>
                <p className="mt-2 text-sm text-slate-500">Generate a presentation with Gemini prompts and review the slides.</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
                aria-label="Close"
              >
                <Cross2Icon className="h-4 w-4" />
              </button>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
            ) : null}

            {step === 1 ? (
              <div className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    <span>Topic</span>
                    <input
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                      placeholder="E.g. Sales kickoff for startup investors"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    <span>Audience</span>
                    <input
                      value={audience}
                      onChange={(event) => setAudience(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                      placeholder="E.g. marketing managers"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    <span>Goal</span>
                    <input
                      value={goal}
                      onChange={(event) => setGoal(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                      placeholder="E.g. convince them to adopt the platform"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between gap-4 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleQuestionGeneration}
                    disabled={loading}
                    className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Generating questions…' : 'Next'}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">Answer the AI-generated clarifying questions so Gemini can build a stronger presentation.</p>
                  {questions.map((question, index) => (
                    <label key={question + index} className="space-y-2 text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{question}</span>
                      <textarea
                        rows={3}
                        value={answers[index] || ''}
                        onChange={(event) => {
                          const nextAnswers = [...answers];
                          nextAnswers[index] = event.target.value;
                          setAnswers(nextAnswers);
                        }}
                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                        placeholder="Provide details or preferences here"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    Back
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGeneratePresentation}
                    disabled={loading}
                    className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Generating presentation…' : 'Generate presentation'}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
