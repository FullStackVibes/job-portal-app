import React, { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, Loader2, Eye, EyeOff, Sparkles, UserCheck, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginFormProps {
  onSuccess: () => void;
  onNavigateRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onNavigateRegister }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    setServerError(null);

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || 'Invalid email or password.');
      } else {
        login(data.token, data.user);
        onSuccess();
      }
    } catch (err) {
      console.error('Login error:', err);
      setServerError('Unable to connect to authentication server. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (demoType: 'seeker' | 'employer') => {
    setServerError(null);
    setFieldErrors({});
    if (demoType === 'seeker') {
      setEmail('seeker@example.com');
      setPassword('password123');
    } else {
      setEmail('employer@example.com');
      setPassword('password123');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-6 sm:p-8">
        
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Sign in to access your Job Portal account
          </p>
        </div>

        {/* Global Error Banner */}
        {serverError && (
          <div id="login-error-alert" className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Authentication Error</span>
              <span>{serverError}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          
          {/* Email Field */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Email Address
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder="user@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all text-sm ${
                  fieldErrors.email
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.email && (
              <p id="email-field-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-800">
                Password
              </label>
            </div>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                }}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all text-sm ${
                  fieldErrors.password
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15'
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-field-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 focus:outline-hidden focus:ring-3 focus:ring-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Login Options */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Quick Demo Accounts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="demo-seeker-btn"
              type="button"
              onClick={() => handleFillDemo('seeker')}
              className="px-3 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Job Seeker
            </button>
            <button
              id="demo-employer-btn"
              type="button"
              onClick={() => handleFillDemo('employer')}
              className="px-3 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Employer
            </button>
          </div>
        </div>

        {/* Footer switch link */}
        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Create an Account
          </button>
        </p>

      </div>
    </div>
  );
};
