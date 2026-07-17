import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon } from '@radix-ui/react-icons';
import Reveal from './Reveal.js';

const faqs = [
  {
    q: 'Do people need an account to join my quiz or answer my survey?',
    a: 'No. Only you, as the creator, need an account. Anyone you invite to present, respond, or join just clicks your link — for a quiz they only type a display name.'
  },
  {
    q: 'How does the AI generate content?',
    a: 'You describe a topic, audience, and goal (plus a couple of clarifying questions), and Interacto generates a full presentation, survey, or quiz you can edit before sharing.'
  },
  {
    q: 'How many people can join a live quiz?',
    a: 'Up to 50 participants per room, with 60-second timed questions and a live leaderboard at the end.'
  },
  {
    q: 'Can I edit what the AI generates?',
    a: 'Yes — every slide, question, and answer option is fully editable after generation, with drag-and-drop layout for presentations.'
  }
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-slate-50/60 px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Frequently asked questions</h2>
        </Reveal>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <Reveal key={faq.q} delay={index * 0.06}>
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className={`w-full rounded-2xl border px-6 py-5 text-left shadow-sm transition ${
                    isOpen
                      ? 'border-orange-200 bg-orange-50/60 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-xs font-semibold text-orange-500/70">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-base font-semibold text-slate-900">{faq.q}</span>
                    </span>
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <PlusIcon className="h-4 w-4 text-slate-500" />
                    </span>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="ml-8 mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
