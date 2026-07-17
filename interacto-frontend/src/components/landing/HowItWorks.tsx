import { motion } from 'framer-motion';
import Reveal from './Reveal.js';

const steps = [
  { number: '01', title: 'Describe what you need', description: 'Give it a topic, your audience, and your goal — presentation, survey, or quiz.' },
  { number: '02', title: 'AI generates the content', description: 'A full deck of slides, a set of survey questions, or quiz questions, ready to edit.' },
  { number: '03', title: 'Share a single link', description: 'Send it to anyone — no account required to view, respond, or join.' },
  { number: '04', title: 'Watch results live', description: 'Responses, scores, and leaderboards update in real time as people participate.' }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-slate-100 bg-slate-50/60 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">How it works</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">From idea to live in under a minute</h2>
        </Reveal>

        <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-6 hidden h-px origin-left bg-gradient-to-r from-transparent via-slate-300 to-transparent lg:block"
          />
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.1}>
              <div className="relative">
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: index * 0.1 + 0.15, type: 'spring', stiffness: 260, damping: 18 }}
                  whileHover={{ scale: 1.1 }}
                  className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-900 shadow-sm"
                >
                  {step.number}
                </motion.div>
                <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
