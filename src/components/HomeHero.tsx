import React from 'react';
import { Briefcase, UserCheck, Building2, ShieldCheck, ArrowRight, UserPlus, LogIn, Sparkles, Search } from 'lucide-react';

interface HomeHeroProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onNavigateLogin, onNavigateRegister }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
      <div className="text-center max-w-3xl mx-auto space-y-5">
        
        {/* Milestone 2 Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Milestone 2: Public Job Board & Listing Creation</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Find Your Next Career or Hire <span className="text-indigo-600">Top Engineers</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Explore open positions from top tech teams, or sign up as an <strong className="text-slate-800 font-semibold">Employer</strong> to post job requisitions and manage candidates.
        </p>

        {/* Action Buttons for Unauthenticated Visitors */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            id="hero-register-btn"
            onClick={onNavigateRegister}
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="hero-login-btn"
            onClick={onNavigateLogin}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <LogIn className="w-4 h-4 text-slate-600" />
            <span>Log In to Account</span>
          </button>
        </div>

      </div>
    </div>
  );
};
