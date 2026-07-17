import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Cross2Icon } from '@radix-ui/react-icons';
import { api } from '../lib/api.js';

interface SurveyWizardProps {
  open: boolean;
  onClose: () => void;
}

export default function SurveyWizard({ open, onClose }: SurveyWizardProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!title || !audience || !goal) {
      setError('Please complete all fields before continuing.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/surveys/generate', {
        title,
        audience,
        goal,
        questionCount
      });
      navigate(`/survey/${response.data.surveyId}`);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to generate the survey. Please try again.');
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
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
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
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Feedback Survey</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Survey wizard</h2>
                <p className="mt-2 text-sm text-slate-500">Tell Gemini what you're gathering feedback on and it'll draft the questions.</p>
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

            <div className="mt-8 space-y-4">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Survey title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  placeholder="E.g. Customer satisfaction check-in"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Audience</span>
                <input
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  placeholder="E.g. restaurant customers"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Goal</span>
                <input
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  placeholder="E.g. find out what to improve about service"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Number of questions</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </label>
            </div>

            <div className="mt-8 flex items-center justify-end gap-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Generating survey…' : 'Generate survey'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
