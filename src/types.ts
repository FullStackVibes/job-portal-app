export type UserRole = 'job_seeker' | 'employer';

export type JobType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Remote';

export type ApplicationStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string>;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  salary?: string;
  description: string;
  createdAt: string;
}

export interface CreateJobInput {
  title: string;
  company: string;
  location: string;
  type: JobType;
  salary?: string;
  description: string;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  resume_name: string;
  resume_data: string; // Base64 or stored content
  resume_size?: number; // bytes
  cover_letter?: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface CreateApplicationInput {
  job_id: string;
  applicant_name: string;
  applicant_email: string;
  resume_name: string;
  resume_data: string;
  resume_size?: number;
  cover_letter?: string;
}

