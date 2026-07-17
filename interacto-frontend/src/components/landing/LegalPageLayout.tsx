import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { useAuth } from '../../lib/AuthContext.js';

interface LegalPageLayoutProps {
  title: string;
  updated: string;
  children: ReactNode;
  theme?: 'default' | 'orange';
}

export default function LegalPageLayout({ title, updated, children, theme = 'default' }: LegalPageLayoutProps) {
  const { user } = useAuth();
  const homeHref = user ? '/dashboard' : '/';
  const isOrange = theme === 'orange';

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={
        isOrange
          ? {
              background:
                'radial-gradient(circle at 12% 0%, rgba(251,146,60,0.15) 0%, transparent 45%), radial-gradient(circle at 88% 15%, rgba(251,191,36,0.15) 0%, transparent 45%), #ffffff'
            }
          : undefined
      }
    >
      <header className={`border-b px-6 py-6 ${isOrange ? 'border-orange-100' : 'border-slate-100'}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to={homeHref} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white ${
                isOrange ? 'from-orange-500 to-amber-400' : 'from-sky-500 to-fuchsia-500'
              }`}
            >
              I
            </span>
            <span className="font-semibold text-slate-900">Interacto</span>
          </Link>
          <Link
            to={homeHref}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              isOrange
                ? 'border-orange-200 bg-white text-orange-700 hover:border-orange-300 hover:bg-orange-50'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            {user ? 'Back to dashboard' : 'Back to home'}
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated {updated}</p>
        <div className="prose-legal mt-10 space-y-8 text-slate-600">{children}</div>
      </main>
    </div>
  );
}
