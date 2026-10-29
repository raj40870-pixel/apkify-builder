import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import BuilderPage from './pages/BuilderPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PaymentPage from './pages/PaymentPage';
import TermsPage from './pages/TermsPage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import SupportPage from './pages/SupportPage';
import { User, Build } from './types';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location, message: "Login required to access this page" }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  
  // Mock builds for dashboard
  const [builds] = useState<Build[]>([
    { id: '1', appName: 'My Ecommerce', techStack: 'Website URL', date: 'Oct 24, 2024', status: 'Completed', downloadUrl: '#' },
    { id: '2', appName: 'Fitness Tracker', techStack: 'ZIP Package', date: 'Oct 28, 2024', status: 'Completed', downloadUrl: '#' },
    { id: '3', appName: 'News App', techStack: 'Website URL', date: 'Nov 02, 2024', status: 'Building', downloadUrl: '#' },
    { id: '4', appName: 'Portfolio', techStack: 'HTML/Web', date: 'Nov 05, 2024', status: 'Completed', downloadUrl: '#' },
  ]);

  useEffect(() => {
    // Check for user on mount
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };
    
    checkUser();
    
    // Listen for storage updates
    window.addEventListener('storage', checkUser);
    window.addEventListener('auth:updated', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('auth:updated', checkUser);
    };
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Map the basic auth user to our full User type for the dashboard
  const getFullUser = (u: any): User | null => {
    if (!u) return null;
    
    return {
      id: u.id || u._id || '1',
      fullName: u.name || u.fullName || 'User',
      email: u.email || 'user@example.com',
      plan: u.plan || 'Free',
      plan_expiry_date: u.plan_expiry_date,
      last_credit_refill: u.last_credit_refill,
      buildsUsed: 0, // Should be fetched from backend history logic instead of hardcoding
      totalBuilds: u.history_limit || 10,
      photoURL: u.photoURL || null,
    };
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#0a0a0f] text-white">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route 
              path="/payment" 
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/build" 
              element={
                <ProtectedRoute>
                  <BuilderPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/accounts/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage user={getFullUser(user)!} builds={builds} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/terms-and-condition" element={<TermsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/support" element={<SupportPage />} />
            {/* Fallback to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
