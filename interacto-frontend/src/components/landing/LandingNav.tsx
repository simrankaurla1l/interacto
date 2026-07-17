import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionLink = motion(Link);

interface LandingNavProps {
  isAuthed: boolean;
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="group relative py-1 transition hover:text-slate-900">
      {label}
      <span className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-orange-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
    </a>
  );
}

export default function LandingNav({ isAuthed }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled ? 'border-slate-200 bg-white/85 shadow-sm backdrop-blur-lg' : 'border-transparent bg-white/60 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <motion.span
            whileHover={{ rotate: -8, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-bold text-white"
          >
            I
          </motion.span>
          <span className="text-lg font-semibold text-slate-900">Interacto</span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <NavLink href="#features" label="Features" />
          <NavLink href="#how-it-works" label="How it works" />
          <NavLink href="#faq" label="FAQ" />
        </nav>

        <div className="flex items-center gap-3">
          {isAuthed ? (
            <MotionLink
              whileTap={{ scale: 0.95 }}
              to="/dashboard"
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
            >
              Open Dashboard
            </MotionLink>
          ) : (
            <Link to="/signin" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
