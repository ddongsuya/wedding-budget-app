import React, { Suspense, lazy, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { QueryProvider } from './src/contexts/QueryProvider';
import { ToastContainer } from './src/components/common/Toast';
import { InstallPrompt } from './src/components/common/InstallPrompt';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { Layout } from './components/Layout';
import { useOnlineStatus } from './src/hooks/useOnlineStatus';
import { OfflinePage } from './src/pages/Offline';
import { LoadingScreen } from './src/components/common/LoadingScreen/LoadingScreen';
import { SplashScreen } from './src/components/common/SplashScreen';
import { WelcomeOnboarding } from './components/onboarding/WelcomeOnboarding';
import { SetupWizard } from './components/onboarding/SetupWizard';
import { FeatureHints } from './components/onboarding/FeatureHints';
import { MilestoneCelebration } from './components/celebration/MilestoneCelebration';
import { useOnboarding } from './src/hooks/useOnboarding';
import { useMilestone } from './src/hooks/useMilestone';

// 페이지 지연 로딩 (Lazy Loading)
const Login = lazy(() => import('./src/pages/Login'));
const Register = lazy(() => import('./src/pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Venues = lazy(() => import('./pages/Venues'));
const Budget = lazy(() => import('./pages/Budget'));
const Checklist = lazy(() => import('./pages/Checklist'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Settings = lazy(() => import('./pages/Settings'));
const ChangePassword = lazy(() => import('./src/pages/ChangePassword'));
const ForgotPassword = lazy(() => import('./src/pages/ForgotPassword'));
const CoupleConnect = lazy(() => import('./src/pages/CoupleConnect'));
const AdminDashboard = lazy(() => import('./src/pages/AdminDashboard'));
const AdminAnnouncements = lazy(() => import('./src/pages/AdminAnnouncements'));
const Announcements = lazy(() => import('./src/pages/Announcements'));
const NotificationCenter = lazy(() => import('./src/pages/NotificationCenter'));
const NotificationSettings = lazy(() => import('./src/pages/NotificationSettings'));
const PhotoReferences = lazy(() => import('./pages/PhotoReferences'));

// 온보딩 및 마일스톤 래퍼 컴포넌트
const AppContent: React.FC = () => {
  const {
    currentStep,
    completeWelcome,
    completeSetup,
    completeHints,
  } = useOnboarding();

  // 마일스톤 데이터 (실제로는 API/Context에서 가져옴)
  // TODO: 실제 데이터 연동 필요
  const { currentMilestone, dismissMilestone } = useMilestone(
    null, // dDay - 실제 데이터 연동 필요
    0,    // checklistProgress
    0     // budgetProgress
  );

  return (
    <>
      {/* 온보딩 플로우 */}
      {currentStep === 'welcome' && (
        <WelcomeOnboarding onComplete={completeWelcome} />
      )}
      {currentStep === 'setup' && (
        <SetupWizard 
          onComplete={completeSetup}
          onSkip={() => completeSetup()}
        />
      )}
      {currentStep === 'hints' && (
        <FeatureHints onComplete={completeHints} />
      )}

      {/* 마일스톤 축하 모달 */}
      {currentMilestone && currentStep === 'complete' && (
        <MilestoneCelebration 
          type={currentMilestone} 
          onClose={dismissMilestone} 
        />
      )}
    </>
  );
};

function App() {
  const isOnline = useOnlineStatus();
  const [showSplash, setShowSplash] = useState(() => {
    // 세션당 한 번만 스플래시 표시
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  if (!isOnline) {
    return <OfflinePage />;
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={2500} />;
  }

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
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/venues"
            element={
              <ProtectedRoute>
                <Layout>
                  <Venues />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <Layout>
                  <Budget />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist"
            element={
              <ProtectedRoute>
                <Layout>
                  <Checklist />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <Layout>
                  <Schedule />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/couple/connect"
            element={
              <ProtectedRoute>
                <CoupleConnect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute>
                <AdminAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <Announcements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications/settings"
            element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/photo-references"
            element={
              <ProtectedRoute>
                <Layout>
                  <PhotoReferences />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 기본 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
        <ToastContainer />
        <InstallPrompt />
        <AppContent />
          </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
