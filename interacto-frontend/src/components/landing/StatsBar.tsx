import { motion } from 'framer-motion';
import Reveal from './Reveal.js';
import Counter from './Counter.js';

const stats = [
  { value: 50, suffix: '', label: 'players per live quiz' },
  { value: 60, suffix: 's', label: 'per timed question' },
  { value: 3, suffix: '', label: 'content types, one app' },
  { value: 0, suffix: '', label: 'signup needed for players to join' }
];

export default function StatsBar() {
  return (
    <section className="bg-white px-6 py-16">
      <Reveal className="mx-auto grid max-w-5xl grid-cols-2 gap-8 rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-8 py-12 shadow-sm sm:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -4 }} className="text-center">
            <p className="text-3xl font-bold text-slate-900 sm:text-4xl">
              <Counter target={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-xs text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </Reveal>
    </section>
  );
}
