import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { HomeHero } from './components/HomeHero';
import { JobBoard } from './components/JobBoard';
import { PostJobModal } from './components/PostJobModal';
import { Job } from './types';

type ViewType = 'home' | 'login' | 'register' | 'dashboard' | 'jobs';

function MainAppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isHeaderPostModalOpen, setIsHeaderPostModalOpen] = useState(false);

  useEffect(() => {
    // If logging in, switch to dashboard or stay on home if user clicked jobs
    if (isAuthenticated && (currentView === 'login' || currentView === 'register')) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center animate-pulse mb-4">
          <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-semibold text-slate-600">Verifying authentication session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenPostJobModal={() => setIsHeaderPostModalOpen(true)}
      />

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Dashboard View */}
        {currentView === 'dashboard' && isAuthenticated ? (
          <Dashboard onNavigateHome={() => setCurrentView('home')} />
        ) : null}

        {/* Login View */}
        {currentView === 'login' && !isAuthenticated ? (
          <div className="max-w-md mx-auto py-6">
            <LoginForm
              onSuccess={() => setCurrentView('dashboard')}
              onNavigateRegister={() => setCurrentView('register')}
            />
          </div>
        ) : null}

        {/* Register View */}
        {currentView === 'register' && !isAuthenticated ? (
          <div className="max-w-xl mx-auto py-6">
            <RegisterForm
              onSuccess={() => setCurrentView('dashboard')}
              onNavigateLogin={() => setCurrentView('login')}
            />
          </div>
        ) : null}

        {/* Home / Job Board View */}
        {(currentView === 'home' || currentView === 'jobs') && (
          <div className="space-y-8">
            {!isAuthenticated && (
              <HomeHero
                onNavigateLogin={() => setCurrentView('login')}
                onNavigateRegister={() => setCurrentView('register')}
              />
            )}

            <JobBoard
              onNavigateLogin={() => setCurrentView('login')}
              onNavigateRegister={() => setCurrentView('register')}
            />
          </div>
        )}

      </main>

      {/* Global Header Post Job Modal for Employers */}
      {user?.role === 'employer' && (
        <PostJobModal
          isOpen={isHeaderPostModalOpen}
          onClose={() => setIsHeaderPostModalOpen(false)}
          onJobCreated={() => {
            setIsHeaderPostModalOpen(false);
          }}
        />
      )}

      {/* App Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 px-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 JobPortal — Job Board & Employer Listing Management System.</p>
          <div className="flex items-center gap-3 text-slate-400 font-medium">
            <span className="text-indigo-600 font-bold">Milestone 2 Complete</span>
            <span>•</span>
            <span>Job Requisitions</span>
            <span>•</span>
            <span>JWT Role Authorization</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
