import { motion, type Variants } from 'framer-motion';
import { MagicWandIcon, ChatBubbleIcon, LightningBoltIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import Reveal from './Reveal.js';

const features = [
  {
    icon: MagicWandIcon,
    eyebrow: 'AI Presentations',
    title: 'A full deck, written and designed for you',
    description:
      'Describe your topic, audience, and goal — Interacto generates a polished, editable slide deck with images and charts in seconds.',
    points: ['Editable slides with drag-and-drop layout', 'AI image search built in', 'Charts generated from your content'],
    image: 'https://images.pexels.com/photos/6476782/pexels-photo-6476782.jpeg?auto=compress&cs=tinysrgb&h=1000&w=1200',
    accent: 'from-sky-500 to-cyan-400'
  },
  {
    icon: ChatBubbleIcon,
    eyebrow: 'Feedback Surveys',
    title: 'Collect honest answers, no friction',
    description:
      'Build a survey with AI, share it as a link, and watch responses roll in — no account needed for the people answering.',
    points: ['Short text, multiple choice, and rating questions', 'One shareable public link', 'Responses tracked live'],
    image: 'https://images.pexels.com/photos/6937870/pexels-photo-6937870.jpeg?auto=compress&cs=tinysrgb&h=1000&w=1200',
    accent: 'from-fuchsia-500 to-pink-400'
  },
  {
    icon: LightningBoltIcon,
    eyebrow: 'Live Quizzes',
    title: 'A live game, hosted in one click',
    description:
      'Host a real-time multiplayer quiz with a room code, 60-second timed questions, live leaderboard, and up to 50 players.',
    points: ['Room code — join with just a name', 'Synced questions for every player', 'Instant leaderboard at the end'],
    image: 'https://images.pexels.com/photos/7092551/pexels-photo-7092551.jpeg?auto=compress&cs=tinysrgb&h=1000&w=1200',
    accent: 'from-emerald-500 to-teal-400'
  }
];

const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const listItem: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

export default function FeatureRows() {
  return (
    <section id="features" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Everything, in one link</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Three ways to engage an audience</h2>
        </Reveal>

        <div className="mt-20 space-y-24">
          {features.map((feature, index) => {
            const reversed = index % 2 === 1;
            return (
              <div
                key={feature.title}
                className={`grid items-center gap-12 lg:grid-cols-2 ${reversed ? 'lg:[&>*:first-child]:order-2' : ''}`}
              >
                <Reveal direction={reversed ? 'right' : 'left'}>
                  <div className="group relative">
                    <div
                      className={`absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br ${feature.accent} opacity-15 blur-2xl transition-opacity duration-500 group-hover:opacity-30`}
                    />
                    <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        loading="lazy"
                        className="h-80 w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>
                </Reveal>

                <Reveal direction={reversed ? 'left' : 'right'} delay={0.1}>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-white`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </motion.div>
                  <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-400">{feature.eyebrow}</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{feature.title}</h3>
                  <p className="mt-4 leading-relaxed text-slate-600">{feature.description}</p>
                  <motion.ul
                    variants={listContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-60px' }}
                    className="mt-6 space-y-3"
                  >
                    {feature.points.map((point) => (
                      <motion.li
                        key={point}
                        variants={listItem}
                        className="flex items-start gap-2.5 text-sm text-slate-600"
                      >
                        <CheckCircledIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                        {point}
                      </motion.li>
                    ))}
                  </motion.ul>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
