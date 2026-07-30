import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, RotateCcw, Briefcase, PlusCircle, Sparkles, Inbox } from 'lucide-react';
import { Job, JobType } from '../types';
import { JobCard } from './JobCard';
import { JobDetailModal } from './JobDetailModal';
import { PostJobModal } from './PostJobModal';
import { useAuth } from '../context/AuthContext';

interface JobBoardProps {
  onNavigateLogin?: () => void;
  onNavigateRegister?: () => void;
}

export const JobBoard: React.FC<JobBoardProps> = ({
  onNavigateLogin,
  onNavigateRegister,
}) => {
  const { user, token, isAuthenticated } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);

  // Fetch applied job IDs for current job seeker
  useEffect(() => {
    if (isAuthenticated && token && user?.role === 'job_seeker') {
      fetch('/api/applications/my-job-ids', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.appliedJobIds)) {
            setAppliedJobIds(data.appliedJobIds);
          }
        })
        .catch(() => {});
    } else {
      setAppliedJobIds([]);
    }
  }, [isAuthenticated, token, user]);

  // Fetch jobs function
  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (locationQuery.trim()) params.append('location', locationQuery.trim());
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load job listings.');
      }
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching jobs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and on filter change (debounced or on submit)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, locationQuery, typeFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setTypeFilter('all');
  };

  const handleJobCreated = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job listing?')) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete job.');
        return;
      }
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      alert('Error deleting job listing.');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Search & Filter Header Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Explore Verified Requisitions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Browse Open Opportunities
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Search top engineering, design, and product roles from verified hiring teams.
            </p>
          </div>

          {/* Action Button: Post Job (Employer) or Seeker CTAs */}
          {isAuthenticated && user?.role === 'employer' ? (
            <button
              id="job-board-post-job-btn"
              onClick={() => setIsPostModalOpen(true)}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Job</span>
            </button>
          ) : !isAuthenticated ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onNavigateLogin}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={onNavigateRegister}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          ) : null}
        </div>

        {/* Search Input Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-2">
          
          {/* Keyword Search Field */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="job-search-input"
              type="text"
              placeholder="Job title, keywords, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Location Field */}
          <div className="md:col-span-4 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="job-location-input"
              type="text"
              placeholder="City, state, or 'Remote'..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Job Type Dropdown Filter */}
          <div className="md:col-span-3 relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <select
              id="job-type-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer text-slate-700 font-medium"
            >
              <option value="all">All Job Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

        </div>

        {/* Active Filters Bar & Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            </span>
            {(searchQuery || locationQuery || typeFilter !== 'all') && (
              <span className="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Filtered Search Active
              </span>
            )}
          </div>

          {(searchQuery || locationQuery || typeFilter !== 'all') && (
            <button
              id="job-reset-filters-btn"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold text-center">
          {error}
        </div>
      )}

      {/* Loading State Spinner */}
      {isLoading ? (
        <div className="py-16 text-center space-y-4">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Loading job listings...</p>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State */
        <div 
          id="jobs-empty-state"
          className="py-16 px-6 bg-white rounded-3xl border border-slate-200/90 text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No job listings found matching your search
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try tweaking your keyword terms, expanding your location filter, or switching job type categories.
          </p>
          {(searchQuery || locationQuery || typeFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear All Search Filters</span>
            </button>
          )}
        </div>
      ) : (
        /* Job Listings Grid */
        <div id="job-listings-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewDetails={(j) => setSelectedJob(j)}
              isOwner={user?.role === 'employer' && user.id === job.employer_id}
              onDelete={handleDeleteJob}
              hasApplied={appliedJobIds.includes(job.id)}
            />
          ))}
        </div>
      )}

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onNavigateLogin={onNavigateLogin}
        onAppliedSuccess={(appliedId) => {
          setAppliedJobIds((prev) => [...prev, appliedId]);
        }}
      />

      {/* Post Job Modal */}
      <PostJobModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onJobCreated={handleJobCreated}
      />

    </div>
  );
};
