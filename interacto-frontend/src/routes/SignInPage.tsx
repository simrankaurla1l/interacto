import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeClosedIcon, LockClosedIcon, EyeOpenIcon, EyeClosedIcon, QuoteIcon } from '@radix-ui/react-icons';
import { useAuth } from '../lib/AuthContext.js';
import GoogleSignInButton from '../components/GoogleSignInButton.js';

const MotionLink = motion(Link);

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          'radial-gradient(circle at 12% 10%, rgba(251,146,60,0.2) 0%, transparent 45%), radial-gradient(circle at 88% 20%, rgba(251,191,36,0.2) 0%, transparent 45%), #ffffff'
      }}
    >
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-orange-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-amber-300/30 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] shadow-2xl lg:grid-cols-2"
      >
        <div className="bg-gradient-to-b from-orange-50 to-amber-50 px-8 py-12 sm:px-12">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-bold text-white">
              I
            </span>
            <span className="text-lg font-semibold text-slate-900">Interacto</span>
          </Link>

          <div className="mt-10 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Sign In</h1>
            <p className="mt-2 text-sm text-slate-500">Welcome back! Please enter your details to continue.</p>
          </div>

          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600"
            >
              {error}
            </motion.div>
          ) : null}

          <div className="mt-8">
            <GoogleSignInButton theme="outline" onSuccess={() => navigate(from, { replace: true })} onError={setError} />
          </div>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Email</span>
              <div className="relative">
                <EnvelopeClosedIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  placeholder="you@example.com"
                />
              </div>
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Password</span>
              <div className="relative">
                <LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeClosedIcon className="h-4 w-4" /> : <EyeOpenIcon className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <MotionLink whileTap={{ scale: 0.97 }} to="/signup" className="font-semibold text-orange-600 hover:text-orange-700">
              Sign up
            </MotionLink>
          </p>
        </div>

        <div className="relative hidden flex-col justify-between bg-white p-10 lg:flex">
          <div>
            <QuoteIcon className="h-8 w-8 text-amber-500" />
            <p className="mt-4 max-w-sm text-2xl font-semibold leading-snug text-slate-900">
              Turn any idea into a live, interactive experience — generated by AI, shared with a single link.
            </p>
            <p className="mt-4 max-w-sm text-sm text-slate-500">
              No design skills, no account needed for the people you invite — just a presentation, survey, or
              quiz that's ready in seconds.
            </p>
          </div>

          <svg viewBox="0 0 400 220" fill="none" className="w-full max-w-sm self-end">
            <rect x="30" y="10" width="220" height="150" rx="18" className="stroke-orange-200" strokeWidth="2" />
            <rect x="60" y="40" width="220" height="150" rx="18" className="stroke-orange-500" strokeWidth="2" fill="white" />
            <rect x="90" y="60" width="120" height="10" rx="5" className="fill-amber-300" />
            <rect x="90" y="78" width="80" height="8" rx="4" className="fill-amber-200" />
            <rect x="90" y="130" width="20" height="40" rx="4" className="fill-rose-400" />
            <rect x="120" y="110" width="20" height="60" rx="4" className="fill-orange-400" />
            <rect x="150" y="95" width="20" height="75" rx="4" className="fill-amber-400" />
            <rect x="180" y="120" width="20" height="50" rx="4" className="fill-yellow-400" />
            <circle cx="330" cy="50" r="26" className="stroke-amber-400" strokeWidth="2" />
            <path d="M322 39 L344 50 L322 61 Z" className="fill-amber-400" />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
