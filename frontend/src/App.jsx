import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketDetail from './pages/TicketDetail';
import WorkTrackingDashboard from './pages/WorkTrackingDashboard';
import AdminEngineersPage from './pages/AdminEngineersPage';
import Devices from './pages/Devices';

import { AuthProvider, useAuth } from './context/AuthContext';


/* ================= PROTECTED ROUTE ================= */

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return <div className="text-center mt-10 text-slate-400">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <div className="text-center mt-10 text-slate-400">Loading profile...</div>;
  }

  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


/* ================= PUBLIC ROUTE ================= */

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) return null;

  if (user || token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


/* ================= ROUTES ================= */

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tracking"
        element={
          <ProtectedRoute role="admin">
            <WorkTrackingDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/engineers"
        element={
          <ProtectedRoute role="admin">
            <AdminEngineersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <Devices />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}


/* ================= MAIN APP ================= */

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 text-slate-100 relative overflow-hidden">

          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -left-10 w-2/5 h-2/5 rounded-full bg-blue-600/20 blur-[120px]" />
            <div className="absolute -bottom-10 -right-10 w-1/2 h-1/2 rounded-full bg-indigo-500/20 blur-[150px]" />
            <div className="absolute top-2/5 left-3/5 w-1/3 h-1/3 rounded-full bg-purple-500/10 blur-[100px]" />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AppRoutes />
            </main>

            <Chatbot />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;