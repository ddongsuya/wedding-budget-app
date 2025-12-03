import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { ToastContainer } from './src/components/common/Toast';
import { InstallPrompt } from './src/components/common/InstallPrompt';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { Layout } from './components/Layout';
import { useOnlineStatus } from './src/hooks/useOnlineStatus';
import { OfflinePage } from './src/pages/Offline';
import { LoadingScreen } from './src/components/common/LoadingScreen/LoadingScreen';

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

function App() {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return <OfflinePage />;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
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

          {/* 기본 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
        <ToastContainer />
        <InstallPrompt />
      </AuthProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
