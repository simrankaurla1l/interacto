import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  MagicWandIcon,
  ChatBubbleIcon,
  LightningBoltIcon,
  QuestionMarkCircledIcon,
  ExitIcon,
  StarFilledIcon,
  TrashIcon,
  EyeOpenIcon,
  DownloadIcon,
  CheckCircledIcon
} from '@radix-ui/react-icons';
import InteractiveWizard from '../components/InteractiveWizard.js';
import SurveyWizard from '../components/SurveyWizard.js';
import QuizWizard from '../components/QuizWizard.js';
import Counter from '../components/landing/Counter.js';
import AssistantLauncher from '../components/landing/AssistantLauncher.js';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.js';
import type { Presentation } from '../types/presentation.d.ts';
import type { Survey } from '../types/survey.d.ts';
import type { Quiz } from '../types/quiz.d.ts';

type View = 'overview' | 'presentations' | 'surveys' | 'quizzes';

const createOptions = [
  {
    key: 'interactive' as const,
    icon: MagicWandIcon,
    title: 'AI Presentation',
    description: 'Turn a topic, audience, and goal into a full, editable slide deck.',
    points: ['Auto-generated slides with images & charts', 'Drag-and-drop layout editing', 'Present live with a share link'],
    accent: 'from-amber-500 to-yellow-400',
    tint: 'bg-amber-50 text-amber-600'
  },
  {
    key: 'survey' as const,
    icon: ChatBubbleIcon,
    title: 'Feedback Survey',
    description: 'Build a survey and collect responses with a single shareable link.',
    points: ['Short text, multiple choice & rating questions', 'No account needed to respond', 'Responses tracked live'],
    accent: 'from-amber-500 to-yellow-400',
    tint: 'bg-amber-50 text-amber-600'
  },
  {
    key: 'quiz' as const,
    icon: LightningBoltIcon,
    title: 'Live Quiz',
    description: 'Host a real-time multiplayer quiz with a room code and live leaderboard.',
    points: ['Up to 50 players, 60s timed questions', 'Join with just a name — no account', 'Instant leaderboard at the end'],
    accent: 'from-amber-500 to-yellow-400',
    tint: 'bg-amber-50 text-amber-600'
  }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>('overview');
  const [selectedCreate, setSelectedCreate] = useState<(typeof createOptions)[number]['key']>('interactive');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'presentation' | 'survey' | 'quiz';
    id: string;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [surveyWizardOpen, setSurveyWizardOpen] = useState(false);
  const [quizWizardOpen, setQuizWizardOpen] = useState(false);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loadingPresentations, setLoadingPresentations] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const fetchPresentations = async () => {
      setLoadingPresentations(true);
      try {
        const response = await api.get('/api/presentations');
        setPresentations(response.data.presentations || []);
      } catch {
        setPresentations([]);
      } finally {
        setLoadingPresentations(false);
      }
    };

    fetchPresentations();
  }, [wizardOpen]);

  useEffect(() => {
    const fetchSurveys = async () => {
      setLoadingSurveys(true);
      try {
        const response = await api.get('/api/surveys');
        setSurveys(response.data.surveys || []);
      } catch {
        setSurveys([]);
      } finally {
        setLoadingSurveys(false);
      }
    };

    fetchSurveys();
  }, [surveyWizardOpen]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoadingQuizzes(true);
      try {
        const response = await api.get('/api/quizzes');
        setQuizzes(response.data.quizzes || []);
      } catch {
        setQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    fetchQuizzes();
  }, [quizWizardOpen]);

  const openWizard = (key: (typeof createOptions)[number]['key']) => {
    if (key === 'interactive') setWizardOpen(true);
    if (key === 'survey') setSurveyWizardOpen(true);
    if (key === 'quiz') setQuizWizardOpen(true);
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    const { type, id, label } = confirmDelete;
    if (type === 'presentation') {
      await api.delete(`/api/presentations/${id}`);
      setPresentations((prev) => prev.filter((item) => item._id !== id));
    } else if (type === 'survey') {
      await api.delete(`/api/surveys/${id}`);
      setSurveys((prev) => prev.filter((item) => item._id !== id));
    } else {
      await api.delete(`/api/quizzes/${id}`);
      setQuizzes((prev) => prev.filter((item) => item._id !== id));
    }
    setConfirmDelete(null);
    setToast(`"${label}" deleted successfully`);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const navItems: {
    key: View;
    label: string;
    icon: typeof HomeIcon;
    tint: string;
    activeBg: string;
    activeText: string;
    count?: number;
  }[] = [
    { key: 'overview', label: 'Overview', icon: HomeIcon, tint: 'bg-orange-50 text-orange-600', activeBg: 'bg-orange-50', activeText: 'text-orange-700' },
    {
      key: 'presentations',
      label: 'Presentations',
      icon: MagicWandIcon,
      tint: 'bg-amber-50 text-amber-600',
      activeBg: 'bg-amber-50',
      activeText: 'text-amber-700',
      count: presentations.length
    },
    {
      key: 'surveys',
      label: 'Surveys',
      icon: ChatBubbleIcon,
      tint: 'bg-amber-50 text-amber-600',
      activeBg: 'bg-amber-50',
      activeText: 'text-amber-700',
      count: surveys.length
    },
    {
      key: 'quizzes',
      label: 'Quizzes',
      icon: LightningBoltIcon,
      tint: 'bg-amber-50 text-amber-600',
      activeBg: 'bg-amber-50',
      activeText: 'text-amber-700',
      count: quizzes.length
    }
  ];

  return (
    <div className="flex h-screen bg-white">
      <aside className="sticky top-0 z-40 flex h-screen w-20 flex-shrink-0 flex-col overflow-visible border-r border-orange-100 bg-gradient-to-b from-orange-50/50 via-white to-white">
        <Link to="/" className="flex items-center justify-center px-0 py-6">
          <motion.span
            whileHover={{ rotate: -8, scale: 1.1 }}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-bold text-white"
          >
            I
          </motion.span>
        </Link>

        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((navItem) => {
            const isActive = view === navItem.key;
            return (
              <SidebarTooltip key={navItem.key} label={navItem.label}>
                <motion.button
                  onClick={() => setView(navItem.key)}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex w-full items-center justify-center rounded-xl px-0 py-2.5 text-sm font-medium text-slate-600 transition hover:text-orange-700"
                >
                  {isActive ? (
                    <motion.span
                      layoutId="sidebar-active"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className={`absolute inset-0 rounded-xl ${navItem.activeBg}`}
                    />
                  ) : null}
                  <span className="relative z-10 flex items-center">
                    <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg ${navItem.tint}`}>
                      <navItem.icon className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  {typeof navItem.count === 'number' ? (
                    <span className="absolute right-1 top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-slate-500 shadow-sm">
                      {navItem.count}
                    </span>
                  ) : null}
                </motion.button>
              </SidebarTooltip>
            );
          })}

          <div className="my-3 h-px bg-orange-100" />

          <SidebarTooltip label="Support">
            <motion.a
              href="/support"
              whileTap={{ scale: 0.95 }}
              className="flex w-full items-center justify-center rounded-xl px-0 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-700"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <QuestionMarkCircledIcon className="h-3.5 w-3.5" />
              </span>
            </motion.a>
          </SidebarTooltip>
        </nav>

        {user ? (
          <div ref={profileRef} className="relative border-t border-orange-100 p-3">
            <AnimatePresence>
              {profileMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-3 mb-2 w-64 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg"
                >
                  <div className="border-b border-orange-100 px-4 py-2.5">
                    <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{user.email}</p>
                  </div>
                  <Link
                    to="/"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-orange-50"
                  >
                    Home
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <ExitIcon className="h-4 w-4" />
                    Sign out
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <SidebarTooltip label={user.name}>
              <button
                onClick={() => setProfileMenuOpen((value) => !value)}
                className="flex w-full items-center justify-center rounded-xl px-0 py-2 text-left transition hover:bg-orange-50"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-semibold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </button>
            </SidebarTooltip>
          </div>
        ) : null}
      </aside>

      <div className="relative flex h-screen flex-1 flex-col overflow-y-auto">
        <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-sky-100/50 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-96 -z-10 h-72 w-72 rounded-full bg-fuchsia-100/40 blur-3xl" />

        <main className="flex w-full flex-1 flex-col px-4 py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {view === 'overview' ? (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
                  className="space-y-12"
                >
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}
                    className="relative overflow-hidden rounded-3xl px-6 py-5 text-center sm:px-10"
                    style={{
                      background:
                        'radial-gradient(circle at 12% 15%, rgba(251,146,60,0.25) 0%, transparent 45%), radial-gradient(circle at 88% 25%, rgba(251,191,36,0.25) 0%, transparent 45%), linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)'
                    }}
                  >
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      The Future Of Interactive Content
                      <StarFilledIcon className="h-3 w-3 text-orange-400" />
                    </div>

                    <h2 className="relative mx-auto mt-6 max-w-2xl text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                      Where Great Ideas Meet{' '}
                      <span className="relative inline-block">
                        <span className="relative z-10">Interactive AI</span>
                        <span className="pointer-events-none absolute -inset-1 rounded-md border-2 border-dashed border-orange-300" />
                      </span>
                    </h2>

                    <p className="mx-auto mt-6 max-w-lg text-xs text-slate-500 sm:text-sm">
                      Describe your topic and Interacto instantly builds a presentation, survey, or quiz — ready to
                      share in seconds.
                    </p>

                    <div className="relative mt-6 inline-flex flex-wrap justify-center gap-1 rounded-full border border-orange-100 bg-white p-1 shadow-sm">
                      {createOptions.map((option) => {
                        const isActive = selectedCreate === option.key;
                        return (
                          <button
                            key={option.key}
                            onClick={() => setSelectedCreate(option.key)}
                            className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm"
                          >
                            {isActive ? (
                              <motion.span
                                layoutId="hero-tab-active"
                                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                              />
                            ) : null}
                            <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-slate-700'}`}>
                              <option.icon className="h-6 w-4" />
                              {option.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">
                      {createOptions
                        .filter((option) => option.key === selectedCreate)
                        .map((option) => (
                          <motion.div
                            key={option.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="mt-6 grid w-full gap-4 rounded-3xl border border-orange-100 bg-white p-4 text-left shadow-sm sm:p-5 lg:grid-cols-2 lg:items-center"
                          >
                            <div>
                              <span
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${option.accent} text-white shadow-sm`}
                              >
                                <option.icon className="h-6 w-4" />
                              </span>
                              <h3 className="mt-6 text-sm font-bold text-slate-900">{option.title}</h3>
                              <p className="mt-6 text-xs leading-relaxed text-slate-500">{option.description}</p>
                              <ul className="mt-6 space-y-1">
                                {option.points.map((point) => (
                                  <li key={point} className="flex items-start gap-2 text-xs text-slate-600">
                                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => openWizard(option.key)}
                                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br ${option.accent} px-4 py-1.5 text-xs font-semibold text-white shadow-sm`}
                              >
                                Start {option.title} →
                              </motion.button>
                            </div>

                            <div >
                              {option.key === 'interactive' ? <PresentationSample /> : null}
                              {option.key === 'survey' ? <SurveySample /> : null}
                              {option.key === 'quiz' ? <QuizSample /> : null}
                            </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>

                    <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 divide-x divide-dashed divide-slate-200">
                      {[
                        { label: 'Presentations', value: presentations.length },
                        { label: 'Surveys', value: surveys.length },
                        { label: 'Quizzes', value: quizzes.length }
                      ].map((stat) => (
                        <div key={stat.label} className="px-4 text-center">
                          <p className="text-lg font-bold text-orange-500">
                            <Counter target={stat.value} />
                          </p>
                          <p className="text-xs text-slate-500">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}

              {view === 'presentations' ? (
                <RecordsSection
                  title="Presentations"
                  description="Everything you've generated with AI."
                  loading={loadingPresentations}
                  empty={presentations.length === 0}
                  emptyLabel="No presentations yet."
                  onCreate={() => setWizardOpen(true)}
                  createLabel="Create a presentation"
                >
                  <thead>
                    <tr className="border-b border-amber-100 bg-gradient-to-r from-orange-500 to-amber-400 text-xs font-semibold uppercase tracking-wide text-white">
                      <th className="px-5 py-4">Title</th>
                      <th className="px-5 py-4">Topic</th>
                      <th className="px-5 py-4">Slides</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presentations.map((presentation) => (
                      <tr key={presentation._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-4 text-xs font-semibold text-slate-900">{presentation.title}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{presentation.topic}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{presentation.slides.length}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/editor/${presentation._id}`}
                              aria-label="View presentation"
                              className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-slate-400 hover:text-slate-700"
                            >
                              <EyeOpenIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDownload(presentation.title, presentation)}
                              aria-label="Download presentation"
                              className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-amber-300 hover:text-amber-600"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ type: 'presentation', id: presentation._id, label: presentation.title })}
                              aria-label="Delete presentation"
                              className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-rose-300 hover:text-rose-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </RecordsSection>
              ) : null}

              {view === 'surveys' ? (
                <RecordsSection
                  title="Surveys"
                  description="Feedback forms shared with your audience."
                  loading={loadingSurveys}
                  empty={surveys.length === 0}
                  emptyLabel="No surveys yet."
                  onCreate={() => setSurveyWizardOpen(true)}
                  createLabel="Create a survey"
                >
                  <thead>
                    <tr className="border-b border-amber-100 bg-gradient-to-r from-orange-500 to-amber-400 text-xs font-semibold uppercase tracking-wide text-white">
                      <th className="px-5 py-4">Title</th>
                      <th className="px-5 py-4">Audience</th>
                      <th className="px-5 py-4">Questions</th>
                      <th className="px-5 py-4">Responses</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((survey) => (
                      <tr key={survey._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-4 text-xs font-semibold text-slate-900">{survey.title}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{survey.audience}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{survey.questions.length}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{survey.responses?.length || 0}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/survey/${survey._id}`}
                              aria-label="View survey"
                              className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-slate-400 hover:text-slate-700"
                            >
                              <EyeOpenIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDownload(survey.title, survey)}
                              aria-label="Download survey"
                              className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-amber-300 hover:text-amber-600"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ type: 'survey', id: survey._id, label: survey.title })}
                              aria-label="Delete survey"
                              className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-rose-300 hover:text-rose-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </RecordsSection>
              ) : null}

              {view === 'quizzes' ? (
                <RecordsSection
                  title="Quizzes"
                  description="Live rooms hosted for your audience."
                  loading={loadingQuizzes}
                  empty={quizzes.length === 0}
                  emptyLabel="No quizzes yet."
                  onCreate={() => setQuizWizardOpen(true)}
                  createLabel="Create a quiz"
                >
                  <thead>
                    <tr className="border-b border-amber-100 bg-gradient-to-r from-orange-500 to-amber-400 text-xs font-semibold uppercase tracking-wide text-white">
                      <th className="px-5 py-4">Title</th>
                      <th className="px-5 py-4">Audience</th>
                      <th className="px-5 py-4">Difficulty</th>
                      <th className="px-5 py-4">Questions</th>
                      <th className="px-5 py-4">Room</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((quiz) => (
                      <tr key={quiz._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-4 text-xs font-semibold text-slate-900">{quiz.title}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{quiz.audience}</td>
                        <td className="px-5 py-4 text-xs capitalize text-slate-500">{quiz.difficulty}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{quiz.questions.length}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{quiz.roomCode}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/quiz/${quiz._id}/host/${quiz.roomCode}`}
                              aria-label="Open quiz room"
                              className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-slate-400 hover:text-slate-700"
                            >
                              <EyeOpenIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDownload(quiz.title, quiz)}
                              aria-label="Download quiz"
                              className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-amber-300 hover:text-amber-600"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ type: 'quiz', id: quiz._id, label: quiz.title })}
                              aria-label="Delete quiz"
                              className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-rose-300 hover:text-rose-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </RecordsSection>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <InteractiveWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <SurveyWizard open={surveyWizardOpen} onClose={() => setSurveyWizardOpen(false)} />
      <QuizWizard open={quizWizardOpen} onClose={() => setQuizWizardOpen(false)} />

      <AssistantLauncher />

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-6 z-[70] flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2.5 shadow-lg"
          >
            <CheckCircledIcon className="h-4 w-4 flex-shrink-0 text-emerald-500" />
            <span className="text-sm font-medium text-slate-700">{toast}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setConfirmDelete(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h3 className="text-base font-bold text-slate-900">Delete "{confirmDelete.label}"?</h3>
              <p className="mt-1.5 text-sm text-slate-500">This action cannot be undone.</p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={performDelete}
                  className="flex-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PresentationSample() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-3">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-rose-300" />
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        <span className="h-2 w-2 rounded-full bg-emerald-300" />
      </div>
      <div className="mt-2 h-2 w-2/3 rounded-full bg-slate-300" />
      <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-slate-200" />
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <div className="h-8 rounded-lg bg-amber-200" />
        <div className="h-8 rounded-lg bg-amber-100" />
        <div className="h-8 rounded-lg bg-amber-100" />
      </div>
      <div className="mt-1.5 flex items-end gap-1">
        <div className="h-3 w-2.5 rounded bg-yellow-300" />
        <div className="h-5 w-2.5 rounded bg-yellow-400" />
        <div className="h-2 w-2.5 rounded bg-yellow-200" />
        <div className="h-4 w-2.5 rounded bg-yellow-300" />
      </div>
    </div>
  );
}

function SurveySample() {
  const options = [
    { label: 'Not likely', selected: false },
    { label: 'Neutral', selected: false },
    { label: 'Very likely', selected: true }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Question 2 of 5</p>
      <p className="mt-1 text-xs font-semibold text-slate-800">How likely are you to recommend us?</p>
      <div className="mt-2 space-y-1">
        {options.map((option) => (
          <div
            key={option.label}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              option.selected ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full border ${option.selected ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}
            />
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizSample() {
  const options = ['Mercury', 'Venus', 'Earth', 'Mars'];

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Question 3 of 10</p>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">42s</span>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-800">Which planet is closest to the sun?</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {options.map((option) => (
          <div key={option} className="rounded-lg border border-slate-200 px-2 py-1 text-center text-xs font-medium text-slate-600">
            {option}
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative">
      {children}
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

function RecordsSection({
  title,
  description,
  loading,
  empty,
  emptyLabel,
  onCreate,
  createLabel,
  children
}: {
  title: string;
  description: string;
  loading: boolean;
  empty: boolean;
  emptyLabel: string;
  onCreate: () => void;
  createLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-6 py-6 sm:px-8"
      style={{
        background:
          'radial-gradient(circle at 12% 15%, rgba(251,146,60,0.25) 0%, transparent 45%), radial-gradient(circle at 88% 25%, rgba(251,191,36,0.25) 0%, transparent 45%), linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)'
      }}
    >
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{description}</p>

      <div className="mt-5">
        {loading ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : empty ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-dashed border-orange-200 bg-white/80 p-12 text-center"
          >
            <p className="text-xs text-slate-500">{emptyLabel}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCreate}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              {createLabel}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-x-auto rounded-3xl border border-orange-100 bg-white shadow-sm"
          >
            <table className="w-full text-left">{children}</table>
          </motion.div>
        )}
      </div>
    </div>
  );
}
