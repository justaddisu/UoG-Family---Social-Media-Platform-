import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { logoutUser } from '../redux/authSlice';
import { authService } from '../services/api';
import { 
  Home, 
  MessageSquare, 
  Users, 
  Calendar, 
  Bell, 
  Bookmark, 
  ShieldAlert, 
  LogOut, 
  User as UserIcon,
  Search,
  BookOpen
} from 'lucide-react';

interface NavigationProps {
  notificationsCount: number;
  onClearNotifications: () => void;
}

export default function Navigation({ notificationsCount, onClearNotifications }: NavigationProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  const handleLogout = () => {
    authService.logout();
    dispatch(logoutUser());
    navigate('/login');
  };

  const isAdminOrModerator = user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR';

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center space-x-2">
              <span className="p-1 px-2.5 rounded bg-yellow-500 text-slate-950 font-extrabold text-sm tracking-widest shadow-inner relative overflow-hidden">
                UoG
                <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </span>
              <span className="font-display font-semibold tracking-tight text-lg text-white">
                Family<span className="text-yellow-500 font-bold block sm:inline text-xs sm:text-lg sm:ml-1 font-mono text-[10px]">v1.0</span>
              </span>
            </NavLink>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-3 text-sm">
            <nav id="navbar-links" className="flex space-x-1 lg:space-x-2">
              <NavLink 
                to="/feed" 
                id="nav-feed"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-md font-medium transition duration-150 ${isActive ? 'bg-slate-800 text-yellow-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <Home className="w-4 h-4 mr-1.5" />
                Feed
              </NavLink>

              <NavLink 
                to="/messages" 
                id="nav-messages"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-md font-medium transition duration-150 relative ${isActive ? 'bg-slate-800 text-yellow-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Chats
              </NavLink>

              <NavLink 
                to="/communities" 
                id="nav-communities"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-md font-medium transition duration-150 ${isActive ? 'bg-slate-800 text-yellow-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <Users className="w-4 h-4 mr-1.5" />
                Communities
              </NavLink>

              <NavLink 
                to="/events" 
                id="nav-events"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-md font-medium transition duration-150 ${isActive ? 'bg-slate-800 text-yellow-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                Events
              </NavLink>

              <NavLink 
                to="/announcements" 
                id="nav-announcements"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-md font-medium transition duration-150 ${isActive ? 'bg-slate-800 text-yellow-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                Memos
              </NavLink>

              <NavLink 
                to="/bookmarks" 
                id="nav-bookmarks"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-md font-medium transition duration-150 ${isActive ? 'bg-slate-800 text-yellow-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <Bookmark className="w-4 h-4 mr-1.5" />
                Bookmarks
              </NavLink>

              {isAdminOrModerator && (
                <NavLink 
                  to="/admin" 
                  id="nav-admin"
                  className={({ isActive }) => `flex items-center px-3 py-2 rounded-md font-medium transition duration-150 ${isActive ? 'bg-red-950/40 text-red-400 border border-red-900/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                >
                  <ShieldAlert className="w-4 h-4 mr-1.5 text-red-500 animate-pulse" />
                  Security Desk
                </NavLink>
              )}
            </nav>
          </div>

          {/* User Profile Shortcut & Logout */}
          <div className="flex items-center space-x-3">
            {/* Notifications Button */}
            <NavLink 
              to="/notifications" 
              onClick={onClearNotifications}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full relative transition duration-150"
            >
              <Bell className="w-5 h-5" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-bounce">
                  {notificationsCount}
                </span>
              )}
            </NavLink>

            {/* Profile Avatar Trigger */}
            <NavLink 
              to={`/profile/${user.id}`} 
              className="flex items-center space-x-2 p-1 pr-2.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              <img 
                src={user.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-slate-600"
              />
              <span className="hidden lg:inline text-xs font-medium text-slate-200">
                {user.profile?.fullName || "My Profile"}
              </span>
            </NavLink>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-full transition duration-150"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Sticky Footer (Extremely Professional Touch) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 py-2 py-safe shadow-xl">
        <div className="flex justify-around items-center text-[10px]">
          <NavLink to="/feed" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-yellow-400' : 'text-slate-400'}`}>
            <Home className="w-5 h-5" />
            <span>Feed</span>
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-yellow-400' : 'text-slate-400'}`}>
            <MessageSquare className="w-5 h-5" />
            <span>Chats</span>
          </NavLink>
          <NavLink to="/communities" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-yellow-400' : 'text-slate-400'}`}>
            <Users className="w-5 h-5" />
            <span>Clubs</span>
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-yellow-400' : 'text-slate-400'}`}>
            <Calendar className="w-5 h-5" />
            <span>Events</span>
          </NavLink>
          <NavLink to={`/profile/${user.id}`} className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-yellow-400' : 'text-slate-400'}`}>
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
