import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleIcon, PersonIcon, ArrowUpIcon } from '@radix-ui/react-icons';
import Reveal from './Reveal.js';

type NodeKey = 'start' | 'presentations' | 'surveys' | 'quizzes' | 'accounts' | 'pricing';

interface ChatNode {
  bot: string;
  options: { label: string; next: NodeKey }[];
}

const nodes: Record<NodeKey, ChatNode> = {
  start: {
    bot: "Hi! 👋 I'm here to help. What do you want to know about Interacto?",
    options: [
      { label: 'What can I do with presentations?', next: 'presentations' },
      { label: 'What can I do with surveys?', next: 'surveys' },
      { label: 'What can I do with quizzes?', next: 'quizzes' },
      { label: 'Do participants need an account?', next: 'accounts' },
      { label: 'Is it free?', next: 'pricing' }
    ]
  },
  presentations: {
    bot: 'With AI Presentations you can generate a full slide deck from a topic, drag-and-drop resize elements, search and add images with AI, insert charts, format text, and present live with a share link.',
    options: [
      { label: 'What can I do with surveys?', next: 'surveys' },
      { label: 'What can I do with quizzes?', next: 'quizzes' },
      { label: '⬅ Start over', next: 'start' }
    ]
  },
  surveys: {
    bot: 'With Feedback Surveys you can add short text, long text, multiple choice, and rating questions, share one public link to collect responses, and watch results come in live — no account needed to respond.',
    options: [
      { label: 'What can I do with presentations?', next: 'presentations' },
      { label: 'What can I do with quizzes?', next: 'quizzes' },
      { label: '⬅ Start over', next: 'start' }
    ]
  },
  quizzes: {
    bot: 'With Live Quizzes you can generate multiple-choice questions with AI, host a live room with a join code, run 60-second timed questions for up to 50 players, track who has answered from the host view, and reveal a live leaderboard at the end.',
    options: [
      { label: 'What can I do with presentations?', next: 'presentations' },
      { label: 'What can I do with surveys?', next: 'surveys' },
      { label: '⬅ Start over', next: 'start' }
    ]
  },
  accounts: {
    bot: 'Nope — only you, the creator, need an account. Anyone you invite just clicks your link; a quiz only asks them for a display name.',
    options: [
      { label: 'What can I do with presentations?', next: 'presentations' },
      { label: 'Is it free?', next: 'pricing' },
      { label: '⬅ Start over', next: 'start' }
    ]
  },
  pricing: {
    bot: 'Free to try, no credit card needed — create your first presentation, survey, or quiz in under a minute.',
    options: [
      { label: 'What can I do with quizzes?', next: 'quizzes' },
      { label: 'Do participants need an account?', next: 'accounts' },
      { label: '⬅ Start over', next: 'start' }
    ]
  }
};

interface Message {
  sender: 'bot' | 'user';
  text: string;
}

interface ChatWidgetProps {
  className?: string;
}

export default function ChatWidget({ className = 'relative mx-auto max-w-xl' }: ChatWidgetProps) {
  const [history, setHistory] = useState<Message[]>([{ sender: 'bot', text: nodes.start.bot }]);
  const [currentKey, setCurrentKey] = useState<NodeKey>('start');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, typing]);

  const handleOption = (label: string, next: NodeKey) => {
    setHistory((prev) => [...prev, { sender: 'user', text: label }]);
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setHistory((prev) => [...prev, { sender: 'bot', text: nodes[next].bot }]);
      setCurrentKey(next);
    }, 550);
  };

  const currentOptions = nodes[currentKey].options;

  return (
    <Reveal className={className}>
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-orange-100 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-amber-100 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl">
        <div ref={scrollRef} className="max-h-40 space-y-3 overflow-y-auto px-5 pb-3 pt-5">
          <AnimatePresence initial={false}>
            {history.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' ? (
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <ChatBubbleIcon className="h-3 w-3" />
                  </span>
                ) : null}
                <p
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.sender === 'bot'
                      ? 'rounded-bl-sm bg-slate-100 text-slate-700'
                      : 'rounded-br-sm bg-slate-900 text-white'
                  }`}
                >
                  {message.text}
                </p>
                {message.sender === 'user' ? (
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                    <PersonIcon className="h-3 w-3" />
                  </span>
                ) : null}
              </motion.div>
            ))}
          </AnimatePresence>

          {typing ? (
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ChatBubbleIcon className="h-3 w-3" />
              </span>
              <span className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.15 }}
                    className="h-1.5 w-1.5 rounded-full bg-slate-400"
                  />
                ))}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {currentOptions.map((option) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={typing}
                onClick={() => handleOption(option.label, option.next)}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {option.label}
              </motion.button>
            ))}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md">
              <ArrowUpIcon className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
