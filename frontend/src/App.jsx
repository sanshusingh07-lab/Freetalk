import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

// Layouts
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { MainAppLayout } from './layouts/MainAppLayout.jsx';

// Public Pages
import { Landing } from './pages/Landing.jsx';
import { About } from './pages/About.jsx';
import { CommunityGuidelines } from './pages/CommunityGuidelines.jsx';
import { Privacy } from './pages/Privacy.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { ForgotPassword } from './pages/ForgotPassword.jsx';

// App Pages
import { Home } from './pages/Home.jsx';
import { Explore } from './pages/Explore.jsx';
import { Topics } from './pages/Topics.jsx';
import { TopicDetails } from './pages/TopicDetails.jsx';
import { PostDetails } from './pages/PostDetails.jsx';
import { CreatePost } from './pages/CreatePost.jsx';
import { CreatePoll } from './pages/CreatePoll.jsx';
import { Search } from './pages/Search.jsx';
import { Saved } from './pages/Saved.jsx';
import { Notifications } from './pages/Notifications.jsx';
import { Messages } from './pages/Messages.jsx';
import { Activity } from './pages/Activity.jsx';
import { PrivacyCenter } from './pages/PrivacyCenter.jsx';
import { Settings } from './pages/Settings.jsx';
import { DebatesPage } from './pages/DebatesPage.jsx';
import { PersonalInsights } from './pages/PersonalInsights.jsx';

// Staff & Admin Pages
import { ModerationQueue } from './pages/ModerationQueue.jsx';
import { Appeals } from './pages/Appeals.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-mono text-ink-600 bg-paper-50">Loading FreeTalk...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Anonymous-Only Route Wrapper: prevents logged-in users from seeing landing or auth pages
function AnonymousOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-mono text-ink-600 bg-paper-50">Loading FreeTalk...</div>;
  }
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

// Staff Route Wrapper
function StaffRoute({ children }) {
  const { isStaff, loading } = useAuth();
  if (loading) return null;
  if (!isStaff) return <Navigate to="/home" replace />;
  return children;
}

// Admin Route Wrapper
function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <Routes>
                {/* Public Standalone Layout */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<AnonymousOnlyRoute><Landing /></AnonymousOnlyRoute>} />
                  <Route path="/about" element={<About />} />
                  <Route path="/guidelines" element={<CommunityGuidelines />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/login" element={<AnonymousOnlyRoute><Login /></AnonymousOnlyRoute>} />
                  <Route path="/register" element={<AnonymousOnlyRoute><Register /></AnonymousOnlyRoute>} />
                  <Route path="/forgot-password" element={<AnonymousOnlyRoute><ForgotPassword /></AnonymousOnlyRoute>} />
                </Route>

                {/* Main Three-Column Application Layout */}
                <Route element={<MainAppLayout />}>
                  <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/topics" element={<Topics />} />
                  <Route path="/topics/:slug" element={<TopicDetails />} />
                  <Route path="/post/:id" element={<PostDetails />} />
                  <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                  <Route path="/poll/create" element={<ProtectedRoute><CreatePoll /></ProtectedRoute>} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
                  <Route path="/privacy-center" element={<ProtectedRoute><PrivacyCenter /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/debates" element={<DebatesPage />} />
                  <Route path="/insights" element={<ProtectedRoute><PersonalInsights /></ProtectedRoute>} />

                  {/* Staff & Admin Routes */}
                  <Route path="/moderation" element={<StaffRoute><ModerationQueue /></StaffRoute>} />
                  <Route path="/appeals" element={<StaffRoute><Appeals /></StaffRoute>} />
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
