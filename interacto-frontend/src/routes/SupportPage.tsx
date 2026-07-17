import { Link } from 'react-router-dom';
import { LinkedInLogoIcon } from '@radix-ui/react-icons';
import LegalPageLayout from '../components/landing/LegalPageLayout.js';

const LINKEDIN_URL = 'https://www.linkedin.com/in/simran-k21';
const CONTACT_NUMBER = '739-489-7487';

export default function SupportPage() {
  return (
    <LegalPageLayout title="Support" updated="July 2026" theme="orange">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Need help?</h2>
        <p className="mt-3 text-sm leading-relaxed">
          Whether you're stuck building a presentation, setting up a survey, or hosting a live quiz, reach out
          directly and we'll help you sort it out.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-slate-700 transition hover:text-orange-600"
            >
              <LinkedInLogoIcon className="h-4 w-4" />
              Message on LinkedIn
            </a>
          </li>
          <li>
            <a
              href={`tel:${CONTACT_NUMBER.replace(/[^+\d]/g, '')}`}
              className="font-medium text-slate-700 transition hover:text-orange-600"
            >
              Call {CONTACT_NUMBER}
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Common questions</h2>
        <p className="mt-3 text-sm leading-relaxed">
          Most quick questions — like whether participants need an account, or how many people can join a
          quiz — are answered on the{' '}
          <Link to="/#faq" className="font-medium text-orange-600 hover:text-orange-700">
            FAQ section
          </Link>{' '}
          of the homepage.
        </p>
      </section>
    </LegalPageLayout>
  );
}
