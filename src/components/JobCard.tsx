import React from 'react';
import { MapPin, Briefcase, DollarSign, Calendar, ArrowRight, Trash2, Building2, CheckCircle2 } from 'lucide-react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onViewDetails: (job: Job) => void;
  isOwner?: boolean;
  onDelete?: (jobId: string) => void;
  hasApplied?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onViewDetails,
  isOwner = false,
  onDelete,
  hasApplied = false,
}) => {
  // Format posted date
  const formattedDate = new Date(job.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Type pill color styles
  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'Full-Time':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      case 'Part-Time':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'Contract':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'Remote':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div 
      id={`job-card-${job.id}`}
      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      <div className="p-6 space-y-4">
        
        {/* Header: Company & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                {job.company}
              </span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {job.title}
              </h3>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              id={`job-type-badge-${job.id}`}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getTypeBadgeStyle(job.type)}`}
            >
              {job.type}
            </span>
            {hasApplied && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Applied
              </span>
            )}
          </div>
        </div>

        {/* Metadata Pills (Location, Salary, Posted Date) */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-600 pt-1">
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span>{job.location}</span>
          </div>

          {job.salary && (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-semibold">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>{job.salary}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-400 ml-auto">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Description Snippet */}
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed pt-1">
          {job.description}
        </p>
      </div>

      {/* Card Footer Actions */}
      <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3">
        {isOwner && onDelete ? (
          <button
            id={`job-delete-btn-${job.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(job.id);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200/80 transition-colors cursor-pointer"
            title="Delete job post"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        ) : (
          <span className="text-xs font-medium text-slate-400">
            ID: {job.id.slice(0, 8)}...
          </span>
        )}

        <button
          id={`job-card-details-${job.id}`}
          onClick={() => onViewDetails(job)}
          className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200 shadow-2xs transition-all cursor-pointer group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
