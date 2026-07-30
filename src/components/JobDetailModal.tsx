import React, { useState, useEffect, useRef } from 'react';
import { 
  X, MapPin, DollarSign, Calendar, Building2, Briefcase, 
  CheckCircle2, LogIn, Send, AlertCircle, Upload, FileText, Trash2, 
  Loader2, FileCheck, User, Mail
} from 'lucide-react';
import { Job } from '../types';
import { useAuth } from '../context/AuthContext';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onNavigateLogin?: () => void;
  onAppliedSuccess?: (jobId: string) => void;
}

interface UploadedResume {
  file: File;
  name: string;
  size: number;
  data: string; // base64 string
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onNavigateLogin,
  onAppliedSuccess,
}) => {
  const { user, token, isAuthenticated } = useAuth();
  
  // Application & Modal states
  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingApplied, setIsCheckingApplied] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');
  const [resumeFile, setResumeFile] = useState<UploadedResume | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize pre-filled user details & check if already applied
  useEffect(() => {
    if (user) {
      setApplicantName(user.name || '');
      setApplicantEmail(user.email || '');
    }

    if (job && token && isAuthenticated && user?.role === 'job_seeker') {
      setIsCheckingApplied(true);
      fetch(`/api/applications/check/${job.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.hasApplied) {
            setHasApplied(true);
          } else {
            setHasApplied(false);
          }
        })
        .catch(() => {
          // ignore check error silently
        })
        .finally(() => {
          setIsCheckingApplied(false);
        });
    } else {
      setHasApplied(false);
    }
  }, [job, token, isAuthenticated, user]);

  if (!job) return null;

  const formattedDate = new Date(job.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Process File Selection
  const handleFileChange = (file: File | undefined) => {
    setFileError(null);
    setFormError(null);

    if (!file) return;

    // 1. File Extension Validation (.pdf, .docx)
    const lowerName = file.name.toLowerCase();
    const isValidExtension = lowerName.endsWith('.pdf') || lowerName.endsWith('.docx');
    
    if (!isValidExtension) {
      setFileError('Invalid file format. Only PDF (.pdf) and Word (.docx) documents are permitted.');
      return;
    }

    // 2. File Size Validation (Max 5MB = 5 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setFileError(`File size exceeds 5MB limit (${formatFileSize(file.size)}). Please select a smaller file.`);
      return;
    }

    // Read file as Base64 Data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setResumeFile({
        file,
        name: file.name,
        size: file.size,
        data: result,
      });
    };
    reader.onerror = () => {
      setFileError('Failed to read file. Please try selecting the file again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Application Submission Handler
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!resumeFile) {
      setFileError('Resume attachment is required. Please upload a PDF or DOCX file.');
      return;
    }

    if (!token) {
      setFormError('Session expired. Please log in again to submit your application.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: job.id,
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          resume_name: resumeFile.name,
          resume_data: resumeFile.data,
          resume_size: resumeFile.size,
          cover_letter: applicationNotes,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit job application.');
      }

      // Success
      setHasApplied(true);
      setShowApplyForm(false);
      setSuccessMessage('Application submitted successfully! The employer will review your resume.');
      
      if (onAppliedSuccess) {
        onAppliedSuccess(job.id);
      }
    } catch (err: any) {
      console.error('Application submit error:', err);
      setFormError(err.message || 'An error occurred while submitting your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        id="job-detail-modal"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
      >
        
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white relative">
          <button
            id="job-detail-modal-close-btn"
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {job.type}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Posted {formattedDate}
            </span>
          </div>

          <h2 id="job-detail-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight pr-10">
            {job.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>{job.company}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{job.location}</span>
            </div>

            {job.salary && (
              <div className="flex items-center gap-1.5 font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                <DollarSign className="w-4 h-4" />
                <span>{job.salary}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-slate-700">
          
          {/* Success Banner */}
          {(hasApplied || successMessage) && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-4 animate-in fade-in duration-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-base">Application Submitted!</h4>
                <p className="text-sm text-emerald-800 mt-1">
                  You have successfully submitted your application and resume for <strong className="font-semibold">{job.title}</strong> at <strong className="font-semibold">{job.company}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Job Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Full Job Description
            </h3>
            <div id="job-detail-description" className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-700 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
              {job.description}
            </div>
          </div>

          {/* Interactive Application Form for Seeker */}
          {showApplyForm && !hasApplied && (
            <form 
              id="job-application-form"
              onSubmit={handleApplySubmit} 
              className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-200/90 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                <h4 className="font-bold text-indigo-950 text-base flex items-center gap-2">
                  <Send className="w-4 h-5 text-indigo-600" />
                  Apply for {job.title}
                </h4>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-100/80 px-2.5 py-1 rounded-full border border-indigo-200">
                  Job Seeker Application
                </span>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Applicant Name & Email (Pre-filled) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
                    placeholder="Your Full Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Resume Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Resume Document <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-xs font-normal text-slate-500">PDF, DOCX (Max 5MB)</span>
                </label>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {!resumeFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-indigo-600 bg-indigo-100/50 scale-[0.99]' 
                        : fileError 
                          ? 'border-rose-300 bg-rose-50/50' 
                          : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Click to upload or drag & drop resume file
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports <strong className="font-semibold text-slate-700">PDF</strong> or <strong className="font-semibold text-slate-700">DOCX</strong> formats up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-2xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-indigo-600 font-semibold">
                          {formatFileSize(resumeFile.size)} • Ready to submit
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Remove resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* File Error Alert */}
                {fileError && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fileError}
                  </p>
                )}
              </div>

              {/* Cover Letter / Pitch */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cover Letter / Additional Pitch (Optional)
                </label>
                <textarea
                  value={applicationNotes}
                  onChange={(e) => setApplicationNotes(e.target.value)}
                  placeholder="Share a short intro or highlight your relevant technical background for this position..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-indigo-200/50">
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="application-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Role Specs Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-3">
            <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              Verified Job Listing posted by hiring representatives at {job.company}.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>

          {/* Dynamic Apply Action Button / Safeguard Badge */}
          {hasApplied ? (
            <button
              id="already-applied-btn"
              disabled
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-xl border border-emerald-300 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Already Applied</span>
            </button>
          ) : isAuthenticated && user ? (
            user.role === 'job_seeker' ? (
              !showApplyForm && (
                <button
                  id="modal-apply-now-btn"
                  onClick={() => {
                    setShowApplyForm(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Apply Now</span>
                </button>
              )
            ) : (
              <div className="text-xs font-medium text-slate-500 bg-slate-200/80 px-4 py-2.5 rounded-xl border border-slate-300">
                Logged in as Employer (Viewing Listing)
              </div>
            )
          ) : (
            <button
              id="modal-login-to-apply-btn"
              onClick={() => {
                onClose();
                if (onNavigateLogin) onNavigateLogin();
              }}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Log in as Job Seeker to Apply</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
