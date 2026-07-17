import LegalPageLayout from '../components/landing/LegalPageLayout.js';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" updated="July 2026">
      <Section title="Using Interacto">
        <p>
          By creating an account or using Interacto to build presentations, surveys, or quizzes, you agree to
          these terms. You're responsible for the content you create and share, and for keeping your account
          credentials secure.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          You own the presentations, surveys, and quizzes you create. We store them so you can access, edit,
          and share them, but we don't claim ownership over your content or use it for anything beyond
          operating the service you asked for.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Don't use Interacto to distribute harmful, illegal, or abusive content, to harass participants in a
          quiz or survey, or to attempt to disrupt or gain unauthorized access to the service.
        </p>
      </Section>

      <Section title="Participants">
        <p>
          Anyone joining a quiz, answering a survey, or viewing a presentation you share does so without
          creating an account. As the creator, you're responsible for how you use any responses you collect.
        </p>
      </Section>

      <Section title="Service availability">
        <p>
          We aim to keep Interacto available and reliable, but we don't guarantee uninterrupted access.
          Features may change as the product evolves.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You can stop using Interacto and delete your account at any time. We may suspend accounts that
          violate these terms.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these terms as the product changes. Continued use of Interacto after an update means
          you accept the revised terms.
        </p>
      </Section>

      <Section title="Contact">
        <p>Questions about these terms? Reach out via the contact details listed in the site footer.</p>
      </Section>
    </LegalPageLayout>
  );
}
