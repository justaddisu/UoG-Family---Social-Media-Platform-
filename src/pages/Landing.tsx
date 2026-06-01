import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { 
  Users, 
  BookOpen, 
  Share2, 
  ShieldCheck, 
  Award, 
  MessageCircle, 
  ArrowRight,
  Sparkles,
  Github,
  Linkedin
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Auto redirect if already verified
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/feed');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white relative overflow-hidden">
      {/* Visual Accent Circles */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-full text-xs font-mono text-yellow-400 mb-8 shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OFFICIAL DIGITAL ALUMNI & STUDENT PORTAL FOR UOG</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-display text-white max-w-4xl mx-auto leading-tight">
          Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500">University of Gondar</span> Family Hub
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The premier academic community network for Gondar students, alumni, lecturers, and staff. Connecting hundreds of researchers, creatives, and leaders.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link 
            to="/login" 
            className="w-full sm:w-auto px-8 py-3.5 rounded-md font-semibold bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-base shadow-lg transition transform hover:-translate-y-0.5 duration-150 flex items-center justify-center space-x-2"
          >
            <span>Sign In to Your Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            to="/register" 
            className="w-full sm:w-auto px-8 py-3.5 rounded-md font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-base shadow-lg transition duration-150 flex items-center justify-center"
          >
            Create Academic Account
          </Link>
        </div>
      </div>

      {/* Key Core Features Bento Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
            Designed for Gondarians Worldwide
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-400">
            A cohesive virtual ecosystem supporting high safety, rapid exchange, and professional mentorship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 border border-slate-700/60 p-8 rounded-xl backdrop-blur-sm shadow-md hover:border-yellow-500/30 transition">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg w-fit mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Academic Communities</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Join specialized groups for your specific department, interest club, athletic faction, or graduation class. Connect directly with people who share your focus.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-8 rounded-xl backdrop-blur-sm shadow-md hover:border-yellow-500/30 transition">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg w-fit mb-6">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Channels</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Coordinate projects and discuss lectures instantaneously. Engage in one-to-one chats or group discussions powered by latency-free Socket.io websockets.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-8 rounded-xl backdrop-blur-sm shadow-md hover:border-yellow-500/30 transition">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg w-fit mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Administrative Memos</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Stay in step with verified university council events, official policy updates, priority club milestones, research outcomes, and pinned memos.
            </p>
          </div>
        </div>
      </div>

      {/* Trust and Safety Banner */}
      <div className="max-w-5xl mx-auto px-4 py-8 mb-16 bg-slate-800/30 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-full">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Trust, Safety & Academic Integrity</h4>
            <p className="text-xs text-slate-400 mt-1">
              Protected by JWT authentication, secure SQLite data tables, role restrictions, and automated AI Content Moderation.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-1">
            <Award className="w-4 h-4 text-yellow-500" />
            <span>EST. 1954</span>
          </div>
          <span>•</span>
          <span>GONDAR, ETHIOPIA</span>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center py-6 border-t border-slate-800 text-slate-500 text-xs relative z-10">
        <p>&copy; 2026 University of Gondar (UoG) Family. All rights reserved. Powered by PERN Stack & Prisma.</p>
        <div className="mt-3 space-y-2">
          <p className="text-slate-400">Developed by <span className="text-yellow-500 font-semibold">Addisu Dessalegn</span></p>
          <div className="flex justify-center gap-3 items-center">
            <a 
              href="https://github.com/justaddisu" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-yellow-500 transition"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <span className="text-slate-600">•</span>
            <a 
              href="https://www.linkedin.com/in/addisu-dessalegn-6a852b11a" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-yellow-500 transition"
            >
              <Linkedin className="h-4 w-4" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
