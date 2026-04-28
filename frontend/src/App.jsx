import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketDetail from './pages/TicketDetail';
import WorkTrackingDashboard from './pages/WorkTrackingDashboard';
import AdminEngineersPage from './pages/AdminEngineersPage';
import Devices from './pages/Devices';
import Chatbot from './components/Chatbot';

// Context placeholder (will map to Context later)
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');
  
  if (loading) return <div>Loading...</div>;
  
  // If no user state but we have a token, we are likely in a state transition (just logged in)
  if (!user && !token) return <Navigate to="/login" />;
  
  // If user state exists, check roles
  if (user && role && user.role !== role && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  // If we have a token but no user yet, just show a blank/loading screen until user state catches up
  if (!user && token) return <div>Loading profile...</div>;
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 text-slate-100 font-sans relative overflow-hidden">
          {/* Aesthetic background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[150px]"></div>
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]"></div>
          </div>
          
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
              <Routes>
                <Route path="/login" element={<Login />} />
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
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
            <Chatbot />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
