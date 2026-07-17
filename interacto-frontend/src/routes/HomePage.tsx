import { useAuth } from '../lib/AuthContext.js';
import ScrollProgress from '../components/landing/ScrollProgress.js';
import LandingNav from '../components/landing/LandingNav.js';
import Hero from '../components/landing/Hero.js';
import FeatureRows from '../components/landing/FeatureRows.js';
import HowItWorks from '../components/landing/HowItWorks.js';
import StatsBar from '../components/landing/StatsBar.js';
import Faq from '../components/landing/Faq.js';
import LandingFooter from '../components/landing/LandingFooter.js';

export default function HomePage() {
  const { user, loading } = useAuth();
  const isAuthed = !loading && Boolean(user);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <ScrollProgress />
      <LandingNav isAuthed={isAuthed} />
      <Hero isAuthed={isAuthed} />
      <FeatureRows />
      <HowItWorks />
      <StatsBar />
      <Faq />
      <LandingFooter />
    </div>
  );
}
