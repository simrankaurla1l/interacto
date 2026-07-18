import LegalPageLayout from '../components/landing/LegalPageLayout.js';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="July 2026" theme="orange">
      <Section title="What we collect">
        <p>
          If you create an account (to build a presentation, survey, or host a quiz), we collect your name,
          email address, and password (stored as a secure hash, never in plain text). If you sign in with
          Google, we receive your name and email from Google's identity service instead of a password.
        </p>
        <p>
          If you're joining a quiz, answering a survey, or viewing a presentation someone shared with you, no
          account is required — we only store the display name you type in for that session, tied to that
          specific quiz room.
        </p>
      </Section>

      <Section title="How we use it">
        <p>
          Your account details are used to let you create, edit, and manage your own presentations, surveys,
          and quizzes. Content you generate with AI is sent to our AI provider solely to produce that content
          and is not used to train third-party models on our behalf.
        </p>
      </Section>

      <Section title="What we share">
        <p>
          We don't sell your data. We share only what's necessary to run the service — for example, Google's
          identity service if you use "Sign in with Google," and our AI provider to generate presentation,
          survey, or quiz content on your request.
        </p>
      </Section>

      <Section title="Data retention">
        <p>
          Your presentations, surveys, quizzes, and their responses are kept until you delete them or close
          your account. Quiz participant sessions (display name and answers) are tied to that quiz room and
          are not linked to any account.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can edit or delete anything you've created at any time from your dashboard. To request a full
          export or deletion of your account data, reach out using the contact details in our footer.
        </p>
      </Section>

      <Section title="Contact">
        <p>Questions about this policy? Reach out via the contact details listed in the site footer.</p>
      </Section>
    </LegalPageLayout>
  );
}
