import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Building2, Mail, Calendar, Briefcase, PlusCircle, 
  User, Sparkles, Trash2, ArrowRight, CheckCircle2, Search, FileText, 
  Clock, Download, ChevronDown, ChevronUp, Send, Paperclip, Users,
  RefreshCw, AlertCircle, X, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Job, Application, ApplicationStatus } from '../types';
import { JobDetailModal } from './JobDetailModal';
import { PostJobModal } from './PostJobModal';

interface EnrichedApplication extends Application {
  job_title?: string;
  company_name?: string;
  location?: string;
  type?: string;
}

interface DashboardProps {
  onNavigateHome?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateHome }) => {
  const { user, logout, token } = useAuth();

  // Employer state
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  
  // Applications received per job (for employers)
  const [expandedJobApps, setExpandedJobApps] = useState<string | null>(null);
  const [jobApplications, setJobApplications] = useState<Record<string, Application[]>>({});
  const [isLoadingApps, setIsLoadingApps] = useState<Record<string, boolean>>({});
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Job Seeker state
  const [myApplications, setMyApplications] = useState<EnrichedApplication[]>([]);
  const [isLoadingMyApps, setIsLoadingMyApps] = useState(false);
  const [isRefreshingSeeker, setIsRefreshingSeeker] = useState(false);

  // Status Badge Styling Helper
  const getStatusBadgeStyle = (status: ApplicationStatus | string) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Accepted':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: ApplicationStatus | string) => {
    switch (status) {
      case 'Submitted':
        return <Send className="w-3.5 h-3.5 text-blue-600" />;
      case 'Under Review':
        return <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />;
      case 'Accepted':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Rejected':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Download resume helper
  const handleDownloadResume = (dataUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error downloading resume file.');
    }
  };

  // Fetch jobs posted by employer
  const fetchMyJobs = async () => {
    if (!user || user.role !== 'employer') return;
    setIsLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data: Job[] = await res.json();
        const filtered = data.filter((j) => j.employer_id === user.id);
        setMyJobs(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch employer jobs', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Fetch applications for a specific employer job
  const fetchApplicationsForJob = async (jobId: string) => {
    if (!token) return;
    setIsLoadingApps(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await fetch(`/api/applications/job/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const apps = await res.json();
        setJobApplications(prev => ({ ...prev, [jobId]: apps }));
      }
    } catch (err) {
      console.error(`Failed to fetch applications for job ${jobId}`, err);
    } finally {
      setIsLoadingApps(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Toggle expand candidate applicants list for employer job
  const toggleJobAppsExpand = (jobId: string) => {
    if (expandedJobApps === jobId) {
      setExpandedJobApps(null);
    } else {
      setExpandedJobApps(jobId);
      fetchApplicationsForJob(jobId);
    }
  };

  // Update candidate status handler (Employer)
  const handleUpdateApplicationStatus = async (appId: string, jobId: string, newStatus: string) => {
    if (!token) return;
    setUpdatingAppId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update candidate status.');
      }

      // Update local state for this job
      setJobApplications((prev) => {
        const currentList = prev[jobId] || [];
        const updatedList = currentList.map((a) => (a.id === appId ? { ...a, status: newStatus as any } : a));
        return { ...prev, [jobId]: updatedList };
      });

      setStatusToast(`Status successfully updated to "${newStatus}"!`);
      setTimeout(() => setStatusToast(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error updating application status.');
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Fetch applications submitted by job seeker
  const fetchMyApplications = async (isManualRefresh = false) => {
    if (!user || user.role !== 'job_seeker' || !token) return;
    if (isManualRefresh) setIsRefreshingSeeker(true);
    else setIsLoadingMyApps(true);

    try {
      const res = await fetch('/api/applications/my-applications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMyApplications(data);
      }
    } catch (err) {
      console.error('Failed to fetch user applications', err);
    } finally {
      setIsLoadingMyApps(false);
      setIsRefreshingSeeker(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'employer') {
      fetchMyJobs();
    } else if (user?.role === 'job_seeker') {
      fetchMyApplications();

      // Setup polling every 8 seconds for live status updates on Job Seeker Dashboard
      const interval = setInterval(() => {
        fetchMyApplications(true);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  if (!user) return null;

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent';

  const handleJobCreated = (newJob: Job) => {
    setMyJobs((prev) => [newJob, ...prev]);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job listing?')) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setMyJobs((prev) => prev.filter((j) => j.id !== jobId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete job.');
      }
    } catch (err) {
      alert('Error deleting job listing.');
    }
  };

  // Seeker Status Counts
  const submittedCount = myApplications.filter(a => a.status === 'Submitted').length;
  const underReviewCount = myApplications.filter(a => a.status === 'Under Review').length;
  const acceptedCount = myApplications.filter(a => a.status === 'Accepted').length;
  const rejectedCount = myApplications.filter(a => a.status === 'Rejected').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Toast Notification Banner */}
      {statusToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{statusToast}</span>
          <button 
            onClick={() => setStatusToast(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Authentication Session Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-indigo-300">{user.name}</span>!
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Logged in as{' '}
              <span className="font-semibold text-white underline decoration-indigo-400 decoration-2">
                {user.role === 'job_seeker' ? 'Job Seeker' : 'Employer'}
              </span>
              . Real-time application tracking and candidate management active.
            </p>
          </div>

          {/* Role Status Card & CTA */}
          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-inner ${
                user.role === 'job_seeker' ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}>
                {user.role === 'job_seeker' ? <UserCheck className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold block">Active Role</span>
                <span className="text-base font-bold text-white capitalize">
                  {user.role === 'job_seeker' ? 'Job Seeker' : 'Employer'}
                </span>
              </div>
            </div>

            {user.role === 'employer' && (
              <button
                id="employer-dashboard-post-job-btn"
                onClick={() => setIsPostModalOpen(true)}
                className="px-5 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shrink-0"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Post a Job</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Info Details & Role Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Metadata Card */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-6 h-fit">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Account Profile</h2>
              <p className="text-xs text-slate-500">Verified session details</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Full Name
              </span>
              <p className="font-semibold text-slate-800">
                {user.name}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Email Address
              </span>
              <p className="font-medium text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {user.email}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Role
              </span>
              <div>
                {user.role === 'job_seeker' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <UserCheck className="w-3.5 h-3.5" />
                    Job Seeker
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    <Building2 className="w-3.5 h-3.5" />
                    Employer
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Member Since
              </span>
              <p className="font-medium text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                {formattedDate}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {user.role === 'job_seeker' && onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Browse All Job Listings</span>
              </button>
            )}

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Sign Out of Session
            </button>
          </div>
        </div>

        {/* Main Dashboard Panel */}
        <div className="lg:col-span-2 space-y-6">
          {user.role === 'job_seeker' ? (
            /* Job Seeker View & Live Application Tracking */
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-emerald-600" />
                      Job Application Tracker
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Live status tracking for submitted applications & resume attachments.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => fetchMyApplications(true)}
                      disabled={isRefreshingSeeker}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Refresh application statuses"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSeeker ? 'animate-spin text-indigo-600' : ''}`} />
                      <span>{isRefreshingSeeker ? 'Refreshing...' : 'Refresh Status'}</span>
                    </button>

                    {onNavigateHome && (
                      <button
                        onClick={onNavigateHome}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Browse Jobs</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-center">
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Submitted</span>
                    <span className="text-2xl font-extrabold text-blue-950 mt-0.5 block">{submittedCount}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Under Review</span>
                    <span className="text-2xl font-extrabold text-amber-950 mt-0.5 block">{underReviewCount}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Accepted</span>
                    <span className="text-2xl font-extrabold text-emerald-950 mt-0.5 block">{acceptedCount}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-center">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Rejected</span>
                    <span className="text-2xl font-extrabold text-rose-950 mt-0.5 block">{rejectedCount}</span>
                  </div>
                </div>
              </div>

              {/* Submitted Applications List */}
              <div className="space-y-4">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
                  <span>Your Submitted Applications ({myApplications.length})</span>
                  <span className="text-xs text-slate-500 font-normal">
                    Auto-updates live
                  </span>
                </h4>

                {isLoadingMyApps ? (
                  <div className="py-8 text-center text-xs font-medium text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading application status history...</span>
                  </div>
                ) : myApplications.length === 0 ? (
                  <div className="p-8 bg-white rounded-3xl border border-slate-200/90 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Paperclip className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      You haven't applied for any jobs yet.
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Explore our active job board and attach your resume to apply for open positions.
                    </p>
                    {onNavigateHome && (
                      <button
                        onClick={onNavigateHome}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                        <span>Find Opportunities</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myApplications.map((app) => (
                      <div 
                        key={app.id} 
                        className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 hover:border-indigo-300 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-indigo-600 block">
                              {app.company_name}
                            </span>
                            <h5 className="text-base font-extrabold text-slate-900">
                              {app.job_title}
                            </h5>
                          </div>

                          {/* Color-Coded Live Status Badge */}
                          <div className="self-start sm:self-auto">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(app.status)} shadow-2xs`}>
                              {getStatusIcon(app.status)}
                              <span>{app.status || 'Submitted'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Resume attachment info */}
                        <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-slate-700 font-medium overflow-hidden">
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="truncate">Attached Resume: <strong>{app.resume_name}</strong></span>
                          </div>

                          <button
                            onClick={() => handleDownloadResume(app.resume_data, app.resume_name)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download File</span>
                          </button>
                        </div>

                        {/* Cover note snippet */}
                        {app.cover_letter && (
                          <div className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-200/50">
                            <strong className="text-amber-900 font-semibold block mb-0.5">Your Submitted Pitch:</strong>
                            "{app.cover_letter}"
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                          <span>Applied on {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>Ref: {app.id.slice(0, 10)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Employer View & Candidate Application Management */
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                      Employer Candidate Portal
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Review applicant resumes and update candidate hiring status in real-time.
                    </p>
                  </div>

                  <button
                    id="dashboard-post-job-cta"
                    onClick={() => setIsPostModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post New Listing</span>
                  </button>
                </div>

                {/* Posted Jobs Count */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                      Active Job Listings
                    </span>
                    <span className="text-2xl font-extrabold text-indigo-700 mt-0.5 block">
                      {myJobs.length} {myJobs.length === 1 ? 'Job Requisition' : 'Job Requisitions'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employer Posted Jobs List */}
              <div className="space-y-4">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
                  <span>Your Job Requisitions & Candidates</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {myJobs.length} total
                  </span>
                </h4>

                {isLoadingJobs ? (
                  <div className="py-8 text-center text-xs font-medium text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading your job listings...</span>
                  </div>
                ) : myJobs.length === 0 ? (
                  <div className="p-8 bg-white rounded-3xl border border-slate-200/90 text-center space-y-3">
                    <p className="text-sm font-semibold text-slate-700">
                      You haven't posted any job listings yet.
                    </p>
                    <p className="text-xs text-slate-500">
                      Click the button below to create your first requisition.
                    </p>
                    <button
                      onClick={() => setIsPostModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Post a Job</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myJobs.map((job) => {
                      const appsForJob = jobApplications[job.id] || [];
                      const isExpanded = expandedJobApps === job.id;
                      const isLoadingThisJobApps = isLoadingApps[job.id];

                      return (
                        <div 
                          key={job.id}
                          className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-indigo-300 transition-all"
                        >
                          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                  {job.type}
                                </span>
                                <span className="text-xs text-slate-400">
                                  Posted {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h5 className="text-lg font-bold text-slate-900">
                                {job.title}
                              </h5>
                              <p className="text-xs text-slate-500">
                                {job.location} {job.salary ? `• ${job.salary}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => toggleJobAppsExpand(job.id)}
                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Users className="w-4 h-4" />
                                <span>Candidates ({appsForJob.length || 'View'})</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200/80 transition-colors cursor-pointer"
                                title="Delete job posting"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Candidate Applications Dropdown for this Job */}
                          {isExpanded && (
                            <div className="p-5 bg-slate-50/80 border-t border-slate-200 space-y-4 animate-in fade-in duration-200">
                              <h6 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                <span>Received Candidate Applications</span>
                                <span>{appsForJob.length} candidate(s)</span>
                              </h6>

                              {isLoadingThisJobApps ? (
                                <div className="text-xs text-slate-500 py-4 text-center flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                  <span>Loading applicant list...</span>
                                </div>
                              ) : appsForJob.length === 0 ? (
                                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                                  No candidates have applied for this position yet.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {appsForJob.map((app) => (
                                    <div 
                                      key={app.id}
                                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                          <h6 className="text-sm font-bold text-slate-900">
                                            {app.applicant_name}
                                          </h6>
                                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                            <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                            {app.applicant_email}
                                          </p>
                                        </div>

                                        {/* Interactive Application Status Selector */}
                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                                            Status:
                                          </span>
                                          <div className="relative">
                                            <select
                                              value={app.status || 'Submitted'}
                                              disabled={updatingAppId === app.id}
                                              onChange={(e) => handleUpdateApplicationStatus(app.id, job.id, e.target.value)}
                                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all ${getStatusBadgeStyle(app.status)}`}
                                            >
                                              <option value="Submitted">Submitted</option>
                                              <option value="Under Review">Under Review</option>
                                              <option value="Accepted">Accepted</option>
                                              <option value="Rejected">Rejected</option>
                                            </select>

                                            {updatingAppId === app.id && (
                                              <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs rounded-xl flex items-center justify-center">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Resume file box */}
                                      <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 text-slate-800 font-medium overflow-hidden">
                                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                          <span className="truncate">{app.resume_name}</span>
                                        </div>

                                        <button
                                          onClick={() => handleDownloadResume(app.resume_data, app.resume_name)}
                                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>Download Resume</span>
                                        </button>
                                      </div>

                                      {/* Cover note snippet */}
                                      {app.cover_letter && (
                                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                                          <strong className="text-slate-800 font-semibold block mb-0.5">Candidate Cover Note:</strong>
                                          "{app.cover_letter}"
                                        </div>
                                      )}

                                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                                        <span>Submitted on {new Date(app.createdAt).toLocaleString()}</span>
                                        <span>App ID: {app.id.slice(0, 10)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />

      <PostJobModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onJobCreated={handleJobCreated}
      />
    </div>
  );
};
