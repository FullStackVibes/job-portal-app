import React from 'react';
import { Briefcase, LogOut, LogIn, UserPlus, UserCheck, Building2, Search, PlusCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentView: 'login' | 'register' | 'dashboard' | 'home' | 'jobs';
  onNavigate: (view: 'login' | 'register' | 'dashboard' | 'home' | 'jobs') => void;
  onOpenPostJobModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onOpenPostJobModal }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <button 
            id="brand-logo-btn"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group focus:outline-none text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:bg-indigo-700 transition-all">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                JobPortal
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                v2.0 Job Board
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
            <button
              id="nav-jobs-board-btn"
              onClick={() => onNavigate('home')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                currentView === 'home' || currentView === 'jobs'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse Jobs</span>
            </button>

            {isAuthenticated && (
              <button
                id="nav-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            )}
          </nav>

          {/* Right User Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                
                {/* Post a Job Shortcut button for Employer */}
                {user.role === 'employer' && (
                  <button
                    id="header-post-job-btn"
                    onClick={() => {
                      if (onOpenPostJobModal) {
                        onOpenPostJobModal();
                      } else {
                        onNavigate('dashboard');
                      }
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post a Job</span>
                  </button>
                )}

                {/* User Role Badge Card */}
                <div id="user-role-badge-container" className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span id="user-full-name" className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-1 max-w-[100px] sm:max-w-[150px]">
                      {user.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {user.role === 'job_seeker' ? (
                        <span id="role-badge-job-seeker" className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <UserCheck className="w-3 h-3" />
                          Job Seeker
                        </span>
                      ) : (
                        <span id="role-badge-employer" className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Building2 className="w-3 h-3" />
                          Employer
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  title="Log out of your account"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </div>
            ) : (
              /* Unauthenticated Controls */
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  id="nav-login-btn"
                  onClick={() => onNavigate('login')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    currentView === 'login'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </button>

                <button
                  id="nav-signup-btn"
                  onClick={() => onNavigate('register')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
                    currentView === 'register'
                      ? 'bg-indigo-700 text-white ring-2 ring-indigo-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
