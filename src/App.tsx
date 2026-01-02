import React, { Suspense, lazy, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { QueryProvider } from '@/contexts/QueryProvider';
import { ToastContainer } from '@/components/common/Toast';
import { InstallPrompt } from '@/components/common/InstallPrompt';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OfflinePage } from '@/pages/Offline';
import { LoadingScreen } from '@/components/common/LoadingScreen/LoadingScreen';
import { SplashScreen } from '@/components/common/SplashScreen';
import { WelcomeOnboarding } from '@/components/onboarding/WelcomeOnboarding';
import { SetupWizard } from '@/components/onboarding/SetupWizard';
import { FeatureHints } from '@/components/onboarding/FeatureHints';
import { MilestoneCelebration } from '@/components/celebration/MilestoneCelebration';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useMilestone } from '@/hooks/useMilestone';

// 페이지 지연 로딩 (Lazy Loading)
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Venues = lazy(() => import('@/pages/Venues'));
const Budget = lazy(() => import('@/pages/Budget'));
const Checklist = lazy(() => import('@/pages/Checklist'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const Settings = lazy(() => import('@/pages/Settings'));
const ChangePassword = lazy(() => import('@/pages/ChangePassword'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const CoupleConnect = lazy(() => import('@/pages/CoupleConnect'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminAnnouncements = lazy(() => import('@/pages/AdminAnnouncements'));
const Announcements = lazy(() => import('@/pages/Announcements'));
const NotificationCenter = lazy(() => import('@/pages/NotificationCenter'));
const NotificationSettings = lazy(() => import('@/pages/NotificationSettings'));
const PhotoReferences = lazy(() => import('@/pages/PhotoReferences'));
const Expenses = lazy(() => import('@/pages/Expenses'));

// 온보딩 및 마일스톤 래퍼 컴포넌트 (Router 내부에서 사용)
const AppContent: React.FC = () => {
  const { currentStep, completeWelcome, completeSetup, completeHints } = useOnboarding();
  const { currentMilestone, dismissMilestone } = useMilestone(null, 0, 0);

  return (
    <>
      {currentStep === 'welcome' && <WelcomeOnboarding onComplete={completeWelcome} />}
      {currentStep === 'setup' && <SetupWizard onComplete={completeSetup} onSkip={() => completeSetup()} />}
      {currentStep === 'hints' && <FeatureHints onComplete={completeHints} />}
      {currentMilestone && currentStep === 'complete' && (
        <MilestoneCelebration type={currentMilestone} onClose={dismissMilestone} />
      )}
    </>
  );
};

function App() {
  const isOnline = useOnlineStatus();
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  if (!isOnline) return <OfflinePage />;
  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} duration={2500} />;

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <Router>
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    {/* 공개 라우트 */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* 보호된 라우트 */}
                    <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                    <Route path="/venues" element={<ProtectedRoute><Layout><Venues /></Layout></ProtectedRoute>} />
                    <Route path="/budget" element={<ProtectedRoute><Layout><Budget /></Layout></ProtectedRoute>} />
                    <Route path="/checklist" element={<ProtectedRoute><Layout><Checklist /></Layout></ProtectedRoute>} />
                    <Route path="/schedule" element={<ProtectedRoute><Layout><Schedule /></Layout></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                    <Route path="/settings/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                    <Route path="/couple/connect" element={<ProtectedRoute><CoupleConnect /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/announcements" element={<ProtectedRoute><AdminAnnouncements /></ProtectedRoute>} />
                    <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
                    <Route path="/notifications/settings" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                    <Route path="/photo-references" element={<ProtectedRoute><Layout><PhotoReferences /></Layout></ProtectedRoute>} />
                    <Route path="/expenses" element={<ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>} />

                    {/* 기본 리다이렉트 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
                {/* AppContent를 Router 내부로 이동 - useNavigate 등 사용 가능 */}
                <AppContent />
              </Router>
              <ToastContainer />
              <InstallPrompt />
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
