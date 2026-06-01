import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/api';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import { RootState } from '../redux/store';
import { Eye, EyeOff, Loader2, Sparkles, Building2, HelpCircle, ArrowLeft } from 'lucide-react';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Auto redirect if already registered
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please specify both your academic email and password.');
      return;
    }

    try {
      dispatch(loginStart());
      const data = await authService.login({ email, password });
      dispatch(loginSuccess({ user: data.user, accessToken: data.accessToken }));
      navigate('/feed');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Wrong credentials or server offline.';
      dispatch(loginFailure(errMsg));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-yellow-500 hover:border-yellow-500 transition">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Home</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <span className="p-1 px-3 rounded bg-yellow-500 text-slate-950 font-extrabold text-sm tracking-widest shadow-md">
            UoG FAMILY
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white font-display">
          Sign In to Your Workspace
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          Or{' '}
          <Link to="/register" className="font-semibold text-yellow-500 hover:text-yellow-400 underline decoration-yellow-500/30">
            register as a new student, alumnus, or staff member
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/85 border border-slate-800 py-8 px-6 shadow-xl rounded-xl backdrop-blur-sm sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Validation and Axios Errors */}
            {(validationError || error) && (
              <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-400 animate-pulse">
                {validationError || error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Academic Email Address
              </label>
              <div className="mt-1.5 input-container relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@uog.edu.et"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Academic Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-500 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Helper Hint Box for dev */}
            <div className="p-3 bg-slate-950 border border-slate-800 text-[10px] text-slate-400 rounded space-y-1">
              <span className="font-semibold text-yellow-500 block">💡 Demonstration Seed Roster:</span>
              <p>• Student: <strong>student.jane@uog.edu.et</strong> (password: <strong>gondar123</strong>)</p>
              <p>• Lecturer: <strong>lecturer.cs@uog.edu.et</strong> (password: <strong>gondar123</strong>)</p>
              <p>• Super Admin: <strong>super.admin@uog.edu.et</strong> (password: <strong>gondar123</strong>)</p>
            </div>

            {/* Login Trigger */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded font-bold text-slate-950 bg-yellow-500 hover:bg-yellow-400 text-sm shadow transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Authenticate Workspace</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
