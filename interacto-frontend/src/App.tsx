import { Route, Routes, Navigate } from 'react-router-dom';
import HomePage from './routes/HomePage.js';
import DashboardPage from './routes/DashboardPage.js';
import SignUpPage from './routes/SignUpPage.js';
import SignInPage from './routes/SignInPage.js';
import PresentationEditorPage from './routes/PresentationEditorPage.js';
import PresentPage from './routes/PresentPage.js';
import SurveyEditorPage from './routes/SurveyEditorPage.js';
import SurveyRespondPage from './routes/SurveyRespondPage.js';
import QuizHostPage from './routes/QuizHostPage.js';
import QuizJoinPage from './routes/QuizJoinPage.js';
import PrivacyPolicyPage from './routes/PrivacyPolicyPage.js';
import TermsOfServicePage from './routes/TermsOfServicePage.js';
import SupportPage from './routes/SupportPage.js';
import RequireAuth from './components/RequireAuth.js';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/editor/:presentationId"
        element={
          <RequireAuth>
            <PresentationEditorPage />
          </RequireAuth>
        }
      />
      <Route path="/present/:presentationId" element={<PresentPage />} />
      <Route
        path="/survey/:surveyId"
        element={
          <RequireAuth>
            <SurveyEditorPage />
          </RequireAuth>
        }
      />
      <Route path="/survey/:surveyId/respond" element={<SurveyRespondPage />} />
      <Route
        path="/quiz/:quizId/host/:roomCode"
        element={
          <RequireAuth>
            <QuizHostPage />
          </RequireAuth>
        }
      />
      <Route path="/quiz/join/:roomCode" element={<QuizJoinPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
