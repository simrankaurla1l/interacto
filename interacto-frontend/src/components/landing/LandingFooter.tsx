import { Link } from 'react-router-dom';
import { LinkedInLogoIcon } from '@radix-ui/react-icons';
import Reveal from './Reveal.js';

const LINKEDIN_URL = 'https://www.linkedin.com/in/simran-k21';
const CONTACT_NUMBER = '739-489-7487';

const quickLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' }
];

const resources = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/support', label: 'Support' }
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white px-6 py-14">
      <Reveal className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 text-[10px] font-bold text-white">
                I
              </span>
              <span className="font-semibold text-slate-900">Interacto</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              AI-generated presentations, surveys, and live quizzes — shared with a single link.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Quick links</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition hover:text-slate-900">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Resources</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              {resources.map((resource) => (
                <li key={resource.to}>
                  <Link to={resource.to} className="transition hover:text-slate-900">
                    {resource.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Connect</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition hover:text-slate-900"
                >
                  <LinkedInLogoIcon className="h-4 w-4" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT_NUMBER.replace(/[^+\d]/g, '')}`} className="transition hover:text-slate-900">
                  {CONTACT_NUMBER}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Interacto. All rights reserved.</p>
        </div>
      </Reveal>
    </footer>
  );
}
