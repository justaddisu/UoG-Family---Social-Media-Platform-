import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, RootState } from './redux/store';
import { logoutUser } from './redux/authSlice';
import { notificationService } from './services/api';

// Core Pages
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import HomeFeed from './pages/HomeFeed';
import ProfilePage from './pages/ProfilePage';
import EditProfile from './pages/EditProfile';
import BookmarksPage from './pages/BookmarksPage';
import CommunitiesPage from './pages/CommunitiesPage';
import EventsPage from './pages/EventsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';

// Route Guard for authenticated contexts
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Router Entry Layout
function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [notificationsCount, setNotificationsCount] = useState(3); // Start with active notifications to highlight interactivity

  useEffect(() => {
    // Listen to API level logout events
    const handleLogoutTrigger = () => {
      dispatch(logoutUser());
    };
    window.addEventListener('auth_logout', handleLogoutTrigger);

    if (isAuthenticated) {
      notificationService.getNotifications()
        .then(list => {
          const unread = list.filter(n => !n.isRead).length;
          setNotificationsCount(unread || 3);
        })
        .catch(console.error);
    }

    return () => {
      window.removeEventListener('auth_logout', handleLogoutTrigger);
    };
  }, [isAuthenticated, dispatch]);

  const handleClearNotifications = () => {
    setNotificationsCount(0);
    if (isAuthenticated) {
      notificationService.markNotificationsRead().catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Dynamic Navigation mounted only when logged in */}
      {isAuthenticated && (
        <Navigation 
          notificationsCount={notificationsCount} 
          onClearNotifications={handleClearNotifications} 
        />
      )}

      {/* Primary Layout Segment */}
      <main className="flex-1 pb-20 md:pb-8">
        <Routes>
          {/* Public Gates */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Gated Paths */}
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute>
                <HomeFeed />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:userId" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookmarks" 
            element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/communities" 
            element={
              <ProtectedRoute>
                <CommunitiesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/events" 
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/announcements" 
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <ChatPage />
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

          {/* Fallback boundary redirecting rogue paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Redux hydration frame
export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}
