import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/api';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import { RootState } from '../redux/store';
import { Loader2, ArrowLeft } from 'lucide-react';

const COLLEGES = [
  'College of Informatics',
  'College of Medicine and Health Sciences',
  'College of Business and Economics',
  'College of Agriculture',
  'College of Social Sciences and Humanities',
  'School of Law',
];

const RESEARCH_FIELDS = [
  'Computer Science',
  'Information Systems',
  'Software Engineering',
  'General Medicine',
  'Pharmacy',
  'Public Health',
  'Management',
  'Economics',
  'Accounting',
  'Agronomy',
  'Plant Sciences',
  'History and Heritage',
  'Clinical Psychology',
];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [department, setDepartment] = useState('Computer Science');
  const [college, setCollege] = useState('College of Informatics');
  const [graduationYear, setGraduationYear] = useState('');
  const [validateError, setValidateError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidateError('');

    if (!email || !password || !fullName) {
      setValidateError('Email, password, and full name are required to proceed.');
      return;
    }

    try {
      dispatch(loginStart());
      const data = await authService.register({
        email,
        password,
        fullName,
        role,
        department,
        college,
        graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
      });
      dispatch(loginSuccess({ user: data.user, accessToken: data.accessToken }));
      navigate('/feed');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Registration failed. Email may already exist.';
      dispatch(loginFailure(errMsg));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-yellow-500 hover:border-yellow-500 transition">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Home</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="text-center text-3xl font-extrabold text-white font-display">
          Create Your Academic Account
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-yellow-500 hover:text-yellow-400 underline decoration-yellow-500/30">
            Sign in in standard portal
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/85 border border-slate-800 py-8 px-6 shadow-xl rounded-xl backdrop-blur-sm sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Warnings */}
            {(validateError || error) && (
              <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-400 animate-pulse">
                {validateError || error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Full Name (Academic Name)
              </label>
              <input
                type="text"
                required
                placeholder="Dr. Solomon Tasew / Dr. Jane Gobena"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-yellow-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                University Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@uog.edu.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-yellow-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Secure Account Password
              </label>
              <input
                type="password"
                required
                placeholder="min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-yellow-500"
              />
            </div>

            {/* Role & Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                  Academic Status Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-500"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="ALUMNI">ALUMNI</option>
                  <option value="LECTURER">LECTURER</option>
                  <option value="STAFF">TECHNICAL STAFF</option>
                  <option value="GONDAR_COMMUNITY">GONDAR COMMUNITY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                  Expected/Graduation Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2026"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            {/* College & Department Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                  Faculty / College division
                </label>
                <select
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-500"
                >
                  {COLLEGES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                  Academic Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-500"
                >
                  {RESEARCH_FIELDS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sign Up Trigger */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded font-bold text-slate-950 bg-yellow-500 hover:bg-yellow-400 text-sm shadow transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Register Identity</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
