import React, { useState } from 'react';
import { User, Mail, Lock, UserPlus, AlertCircle, Loader2, UserCheck, Building2, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RegisterFormProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onNavigateLogin }) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('job_seeker');

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: { name?: string; email?: string; password?: string; role?: string } = {};
    setServerError(null);

    if (!name.trim()) {
      errors.name = 'Full Name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g., user@example.com).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!role) {
      errors.role = 'Please select an account role.';
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      let data: any = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          data = { error: 'Invalid JSON response received from server.' };
        }
      } else {
        const text = await response.text();
        data = { error: text || 'Server returned non-JSON response.' };
      }

      if (!response.ok) {
        setServerError(data.error || 'Registration failed. Please check your inputs.');
      } else {
        register(data.token, data.user);
        onSuccess();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setServerError(err?.message || 'Unable to connect to registration server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-6 sm:p-8">
        
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create Your Account
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Join Job Portal today as a Job Seeker or Employer
          </p>
        </div>

        {/* Global Server Error Alert */}
        {serverError && (
          <div id="register-error-alert" className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Registration Error</span>
              <span>{serverError}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          
          {/* Role Selector Cards */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2.5">
              Select Your Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Job Seeker Option */}
              <label
                className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  role === 'job_seeker'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="user-role"
                  value="job_seeker"
                  checked={role === 'job_seeker'}
                  onChange={() => setRole('job_seeker')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-2 rounded-lg ${role === 'job_seeker' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Job Seeker</span>
                      {role === 'job_seeker' && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      Looking for employment opportunities
                    </span>
                  </div>
                </div>
              </label>

              {/* Employer Option */}
              <label
                className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  role === 'employer'
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="user-role"
                  value="employer"
                  checked={role === 'employer'}
                  onChange={() => setRole('employer')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-2 rounded-lg ${role === 'employer' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Employer</span>
                      {role === 'employer' && (
                        <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      Hiring top talent for your company
                    </span>
                  </div>
                </div>
              </label>

            </div>
          </div>

          {/* Full Name Field */}
          <div>
            <label htmlFor="register-name" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                }}
                placeholder="John Doe"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all text-sm ${
                  fieldErrors.name
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.name && (
              <p id="name-field-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email Address Field */}
          <div>
            <label htmlFor="register-email" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="register-email"
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
            <label htmlFor="register-password" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                }}
                placeholder="At least 6 characters"
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
            {fieldErrors.password ? (
              <p id="password-field-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.password}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                Must be at least 6 characters long.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            id="register-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 focus:outline-hidden focus:ring-3 focus:ring-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Register Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer switch link */}
        <p className="mt-8 pt-6 border-t border-slate-200/80 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Sign In Instead
          </button>
        </p>

      </div>
    </div>
  );
};
