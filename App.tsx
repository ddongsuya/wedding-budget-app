import React from 'react';
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
import Login from './src/pages/Login';
import Register from './src/pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Venues } from './pages/Venues';
import { Budget } from './pages/Budget';
import { Expenses } from './pages/Expenses';
import { Checklist } from './pages/Checklist';
import { Schedule } from './pages/Schedule';
import { Settings } from './pages/Settings';

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
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
            path="/expenses"
            element={
              <ProtectedRoute>
                <Layout>
                  <Expenses />
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

          {/* 기본 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
        <ToastContainer />
        <InstallPrompt />
      </AuthProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
