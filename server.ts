import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment Configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "job_portal_secret_key_2026_dev_mode";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

// Prisma Client Instance
const prisma = new PrismaClient();

// Local JSON File Fallbacks (used if DATABASE_URL is not set or DB connection is unavailable)
const DB_FILE = path.join(__dirname, "users_db.json");
const JOBS_DB_FILE = path.join(__dirname, "jobs_db.json");
const APPLICATIONS_DB_FILE = path.join(__dirname, "applications_db.json");

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "job_seeker" | "employer";
  createdAt: string;
}

interface StoredJob {
  id: string;
  employer_id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-Time" | "Part-Time" | "Contract" | "Remote";
  salary?: string;
  description: string;
  createdAt: string;
}

interface StoredApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  resume_name: string;
  resume_data: string;
  resume_size?: number;
  cover_letter?: string;
  status: "Submitted" | "Under Review" | "Accepted" | "Rejected";
  createdAt: string;
}

// Local JSON File Helpers
function readUsersDB(): StoredUser[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialUsers: StoredUser[] = [
        {
          id: "usr_demo_seeker_1",
          name: "Alex Rivera",
          email: "seeker@example.com",
          passwordHash: bcrypt.hashSync("password123", 10),
          role: "job_seeker",
          createdAt: new Date().toISOString()
        },
        {
          id: "usr_demo_employer_1",
          name: "Acme Corp (Sarah)",
          email: "employer@example.com",
          passwordHash: bcrypt.hashSync("password123", 10),
          role: "employer",
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(DB_FILE, JSON.stringify(initialUsers, null, 2), "utf-8");
      return initialUsers;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading users DB file:", error);
    return [];
  }
}

function writeUsersDB(users: StoredUser[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing users DB file:", error);
  }
}

function readJobsDB(): StoredJob[] {
  try {
    if (!fs.existsSync(JOBS_DB_FILE)) {
      const initialJobs: StoredJob[] = [
        {
          id: "job_demo_1",
          employer_id: "usr_demo_employer_1",
          title: "Senior Full Stack Engineer",
          company: "Acme Corp",
          location: "San Francisco, CA (Hybrid)",
          type: "Full-Time",
          salary: "$140,000 - $175,000 / year",
          description: "We are looking for an experienced Full Stack Engineer to build high-performance Web applications using TypeScript, React, and Node.js.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
        },
        {
          id: "job_demo_2",
          employer_id: "usr_demo_employer_1",
          title: "Lead UI/UX Designer",
          company: "Acme Corp",
          location: "Remote",
          type: "Remote",
          salary: "$120,000 - $145,000 / year",
          description: "Join our design team to craft elegant, user-centered digital experiences for thousands of professionals.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
        }
      ];
      fs.writeFileSync(JOBS_DB_FILE, JSON.stringify(initialJobs, null, 2), "utf-8");
      return initialJobs;
    }
    const raw = fs.readFileSync(JOBS_DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading jobs DB file:", error);
    return [];
  }
}

function writeJobsDB(jobs: StoredJob[]): void {
  try {
    fs.writeFileSync(JOBS_DB_FILE, JSON.stringify(jobs, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing jobs DB file:", error);
  }
}

function readApplicationsDB(): StoredApplication[] {
  try {
    if (!fs.existsSync(APPLICATIONS_DB_FILE)) {
      const initialApps: StoredApplication[] = [
        {
          id: "app_demo_1",
          job_id: "job_demo_1",
          applicant_id: "usr_demo_seeker_1",
          applicant_name: "Alex Rivera",
          applicant_email: "seeker@example.com",
          resume_name: "Alex_Rivera_Senior_FullStack_Resume.pdf",
          resume_data: "data:application/pdf;base64,JVBERi0xLjQKJ...",
          resume_size: 245000,
          cover_letter: "I am excited to submit my application for Senior Full Stack Engineer.",
          status: "Submitted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
        }
      ];
      fs.writeFileSync(APPLICATIONS_DB_FILE, JSON.stringify(initialApps, null, 2), "utf-8");
      return initialApps;
    }
    const raw = fs.readFileSync(APPLICATIONS_DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading applications DB file:", error);
    return [];
  }
}

function writeApplicationsDB(apps: StoredApplication[]): void {
  try {
    fs.writeFileSync(APPLICATIONS_DB_FILE, JSON.stringify(apps, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing applications DB file:", error);
  }
}

// Data Mappers
function mapPrismaUser(user: any): StoredUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password,
    role: user.role as "job_seeker" | "employer",
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt
  };
}

function mapPrismaJob(job: any): StoredJob {
  return {
    id: job.id,
    employer_id: job.employerId || job.employer_id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type as any,
    salary: job.salary ?? undefined,
    description: job.description,
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt
  };
}

function mapPrismaApplication(app: any): StoredApplication {
  return {
    id: app.id,
    job_id: app.jobId || app.job_id,
    applicant_id: app.applicantId || app.applicant_id,
    applicant_name: app.applicantName || app.applicant_name,
    applicant_email: app.applicantEmail || app.applicant_email,
    resume_name: app.resumeName || app.resume_name,
    resume_data: app.resumeData || app.resume_data,
    resume_size: app.resume_size,
    cover_letter: app.coverLetter ?? app.cover_letter ?? undefined,
    status: app.status as any,
    createdAt: app.createdAt instanceof Date ? app.createdAt.toISOString() : app.createdAt
  };
}

// Async Database Access Layer (Prisma Primary, Local JSON Fallback)
let prismaConnectionTested = false;
let prismaIsConnected = false;

async function checkPrismaConnection(): Promise<boolean> {
  if (prismaIsConnected) {
    return true;
  }

  if (!process.env.DATABASE_URL) {
    return false;
  }

  try {
    await prisma.$connect();
    // Test that the schema tables exist and can be queried
    await prisma.user.findFirst();
    prismaIsConnected = true;
    console.log("[Database] Connected to PostgreSQL via Prisma successfully.");
    return true;
  } catch (err: any) {
    prismaIsConnected = false;
    return false;
  }
}

async function dbFindUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (await checkPrismaConnection()) {
    try {
      const user = await prisma.user.findUnique({ where: { email: normalized } });
      if (user) return mapPrismaUser(user);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }
  const users = readUsersDB();
  return users.find(u => u.email.toLowerCase() === normalized) || null;
}

async function dbFindUserById(id: string): Promise<StoredUser | null> {
  if (await checkPrismaConnection()) {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) return mapPrismaUser(user);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }
  const users = readUsersDB();
  return users.find(u => u.id === id) || null;
}

async function dbCreateUser(data: { id?: string; name: string; email: string; passwordHash: string; role: "job_seeker" | "employer" }): Promise<StoredUser> {
  const newUser: StoredUser = {
    id: data.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    role: data.role,
    createdAt: new Date().toISOString()
  };

  if (await checkPrismaConnection()) {
    try {
      const created = await prisma.user.create({
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          password: newUser.passwordHash,
          role: newUser.role
        }
      });
      return mapPrismaUser(created);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }

  const users = readUsersDB();
  users.push(newUser);
  writeUsersDB(users);
  return newUser;
}

async function dbGetJobs(filters?: { search?: string; location?: string; type?: string }): Promise<StoredJob[]> {
  let jobs: StoredJob[] = [];
  if (await checkPrismaConnection()) {
    try {
      const prismaJobs = await prisma.job.findMany({
        orderBy: { createdAt: "desc" }
      });
      jobs = prismaJobs.map(mapPrismaJob);
    } catch (e: any) {
      prismaIsConnected = false;
      jobs = readJobsDB();
    }
  } else {
    jobs = readJobsDB();
  }

  const { search, location, type } = filters || {};

  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    jobs = jobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
    );
  }

  if (location && typeof location === "string" && location.trim()) {
    const locQuery = location.trim().toLowerCase();
    jobs = jobs.filter(j => j.location.toLowerCase().includes(locQuery));
  }

  if (type && typeof type === "string" && type.trim() && type !== "all") {
    jobs = jobs.filter(j => j.type.toLowerCase() === type.trim().toLowerCase());
  }

  jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return jobs;
}

async function dbGetJobById(id: string): Promise<StoredJob | null> {
  if (await checkPrismaConnection()) {
    try {
      const job = await prisma.job.findUnique({ where: { id } });
      if (job) return mapPrismaJob(job);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }
  const jobs = readJobsDB();
  return jobs.find(j => j.id === id) || null;
}

async function dbCreateJob(data: { id?: string; employer_id: string; title: string; company: string; location: string; type: "Full-Time" | "Part-Time" | "Contract" | "Remote"; salary?: string; description: string }): Promise<StoredJob> {
  const newJob: StoredJob = {
    id: data.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    employer_id: data.employer_id,
    title: data.title,
    company: data.company,
    location: data.location,
    type: data.type,
    salary: data.salary,
    description: data.description,
    createdAt: new Date().toISOString()
  };

  if (await checkPrismaConnection()) {
    try {
      const created = await prisma.job.create({
        data: {
          id: newJob.id,
          employerId: newJob.employer_id,
          title: newJob.title,
          company: newJob.company,
          location: newJob.location,
          type: newJob.type,
          salary: newJob.salary,
          description: newJob.description
        }
      });
      return mapPrismaJob(created);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }

  const jobs = readJobsDB();
  jobs.unshift(newJob);
  writeJobsDB(jobs);
  return newJob;
}

async function dbDeleteJob(id: string): Promise<boolean> {
  if (await checkPrismaConnection()) {
    try {
      await prisma.job.delete({ where: { id } });
      return true;
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }

  let jobs = readJobsDB();
  const initialLen = jobs.length;
  jobs = jobs.filter(j => j.id !== id);
  writeJobsDB(jobs);
  return jobs.length < initialLen;
}

async function dbFindApplication(jobId: string, applicantId: string): Promise<StoredApplication | null> {
  if (await checkPrismaConnection()) {
    try {
      const app = await prisma.application.findFirst({
        where: { jobId, applicantId }
      });
      if (app) return mapPrismaApplication(app);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }

  const apps = readApplicationsDB();
  return apps.find(a => a.job_id === jobId && a.applicant_id === applicantId) || null;
}

async function dbCreateApplication(data: StoredApplication): Promise<StoredApplication> {
  if (await checkPrismaConnection()) {
    try {
      const created = await prisma.application.create({
        data: {
          id: data.id,
          jobId: data.job_id,
          applicantId: data.applicant_id,
          applicantName: data.applicant_name,
          applicantEmail: data.applicant_email,
          resumeName: data.resume_name,
          resumeData: data.resume_data,
          coverLetter: data.cover_letter,
          status: data.status
        }
      });
      return mapPrismaApplication(created);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }

  const apps = readApplicationsDB();
  apps.unshift(data);
  writeApplicationsDB(apps);
  return data;
}

async function dbGetApplicationsByUser(applicantId: string): Promise<StoredApplication[]> {
  if (await checkPrismaConnection()) {
    try {
      const prismaApps = await prisma.application.findMany({
        where: { applicantId },
        orderBy: { createdAt: "desc" }
      });
      return prismaApps.map(mapPrismaApplication);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }

  const apps = readApplicationsDB();
  return apps.filter(a => a.applicant_id === applicantId);
}

async function dbGetApplicationsByJob(jobId: string): Promise<StoredApplication[]> {
  if (await checkPrismaConnection()) {
    try {
      const prismaApps = await prisma.application.findMany({
        where: { jobId },
        orderBy: { createdAt: "desc" }
      });
      return prismaApps.map(mapPrismaApplication);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }

  const apps = readApplicationsDB();
  return apps.filter(a => a.job_id === jobId);
}

async function dbGetApplicationById(id: string): Promise<StoredApplication | null> {
  if (await checkPrismaConnection()) {
    try {
      const app = await prisma.application.findUnique({ where: { id } });
      if (app) return mapPrismaApplication(app);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }

  const apps = readApplicationsDB();
  return apps.find(a => a.id === id) || null;
}

async function dbUpdateApplicationStatus(id: string, status: "Submitted" | "Under Review" | "Accepted" | "Rejected"): Promise<StoredApplication | null> {
  if (await checkPrismaConnection()) {
    try {
      const updated = await prisma.application.update({
        where: { id },
        data: { status }
      });
      return mapPrismaApplication(updated);
    } catch (e: any) {
      prismaIsConnected = false;
    }
  }

  const apps = readApplicationsDB();
  const appIndex = apps.findIndex(a => a.id === id);
  if (appIndex === -1) return null;

  apps[appIndex].status = status;
  writeApplicationsDB(apps);
  return apps[appIndex];
}

function sanitizeUser(user: StoredUser) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function startServer() {
  const app = express();

  // CORS Middleware Configuration
  app.use(
    cors({
      origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN,
      credentials: true
    })
  );

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // --- HEALTH CHECK ENDPOINT ---
  app.get("/api/health", (req, res) => {
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  // --- AUTH ROUTES ---

  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, role } = req.body || {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Full Name is required." });
      }

      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Email Address is required." });
      }

      if (!isValidEmail(email.trim())) {
        return res.status(400).json({ error: "Please enter a valid email address (e.g., user@example.com)." });
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password is required." });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      if (!role || (role !== "job_seeker" && role !== "employer")) {
        return res.status(400).json({ error: "Please select a valid role ('Job Seeker' or 'Employer')." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await dbFindUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(409).json({ error: "This email address is already registered. Please log in instead." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await dbCreateUser({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role
      });

      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(201).json({
        user: sanitizeUser(newUser),
        token,
        message: "Registration successful!"
      });
    } catch (err) {
      console.error("Registration error:", err);
      return res.status(500).json({ error: "Internal server error during registration." });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};

      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Email Address is required." });
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password is required." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await dbFindUserByEmail(normalizedEmail);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        user: sanitizeUser(user),
        token,
        message: "Login successful!"
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Internal server error during login." });
    }
  });

  // GET /api/auth/me
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

      const user = await dbFindUserById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: "User profile not found." });
      }

      return res.status(200).json({ user: sanitizeUser(user) });
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired session token." });
    }
  });

  // --- JOB BOARD ROUTES ---

  // GET /api/jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const { search, location, type } = req.query;
      const jobs = await dbGetJobs({
        search: typeof search === "string" ? search : undefined,
        location: typeof location === "string" ? location : undefined,
        type: typeof type === "string" ? type : undefined
      });
      return res.status(200).json(jobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      return res.status(500).json({ error: "Failed to retrieve job listings." });
    }
  });

  // POST /api/jobs (Employers only)
  app.post("/api/jobs", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required. Please log in as an Employer to post a job." });
      }

      const token = authHeader.split(" ")[1];
      let decoded: { userId: string; email: string; role: string };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
      } catch (err) {
        return res.status(401).json({ error: "Invalid or expired authentication session." });
      }

      if (decoded.role !== "employer") {
        return res.status(403).json({ error: "Access denied. Only registered Employers can post new job listings." });
      }

      const { title, company, location, type, salary, description } = req.body || {};

      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Job Title is required." });
      }

      if (!company || typeof company !== "string" || !company.trim()) {
        return res.status(400).json({ error: "Company Name is required." });
      }

      if (!location || typeof location !== "string" || !location.trim()) {
        return res.status(400).json({ error: "Job Location is required." });
      }

      const validTypes = ["Full-Time", "Part-Time", "Contract", "Remote"];
      if (!type || !validTypes.includes(type)) {
        return res.status(400).json({ error: "Please select a valid Job Type (Full-Time, Part-Time, Contract, or Remote)." });
      }

      if (!description || typeof description !== "string" || !description.trim()) {
        return res.status(400).json({ error: "Job Description is required." });
      }

      const newJob = await dbCreateJob({
        employer_id: decoded.userId,
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        type,
        salary: salary && typeof salary === "string" && salary.trim() ? salary.trim() : undefined,
        description: description.trim()
      });

      return res.status(201).json(newJob);
    } catch (err) {
      console.error("Error creating job listing:", err);
      return res.status(500).json({ error: "Failed to create job listing due to server error." });
    }
  });

  // DELETE /api/jobs/:id (Employers only)
  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

      if (decoded.role !== "employer") {
        return res.status(403).json({ error: "Only employers can delete job listings." });
      }

      const jobId = req.params.id;
      const job = await dbGetJobById(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job listing not found." });
      }

      if (job.employer_id !== decoded.userId) {
        return res.status(403).json({ error: "You can only delete jobs posted by your account." });
      }

      await dbDeleteJob(jobId);
      return res.status(200).json({ message: "Job listing deleted successfully." });
    } catch (err) {
      return res.status(500).json({ error: "Error deleting job listing." });
    }
  });

  // --- APPLICATION SYSTEM ROUTES ---

  // POST /api/applications (Job Seekers only)
  app.post("/api/applications", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required. Please log in as a Job Seeker to submit an application." });
      }

      const token = authHeader.split(" ")[1];
      let decoded: { userId: string; email: string; role: string };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
      } catch (err) {
        return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
      }

      if (decoded.role !== "job_seeker") {
        return res.status(403).json({ error: "Access denied. Only registered Job Seekers can submit applications." });
      }

      const { job_id, resume_name, resume_data, resume_size, cover_letter, applicant_name, applicant_email } = req.body || {};

      if (!job_id || typeof job_id !== "string") {
        return res.status(400).json({ error: "Job ID is required." });
      }

      const targetJob = await dbGetJobById(job_id);
      if (!targetJob) {
        return res.status(404).json({ error: "Target job listing was not found." });
      }

      // Check duplicate application
      const existingApp = await dbFindApplication(job_id, decoded.userId);
      if (existingApp) {
        return res.status(400).json({ error: "You have already applied for this job listing." });
      }

      if (!resume_name || typeof resume_name !== "string" || !resume_data || typeof resume_data !== "string") {
        return res.status(400).json({ error: "A valid resume file (.pdf or .docx) is required." });
      }

      const seekerUser = await dbFindUserById(decoded.userId);
      const finalName = (applicant_name && typeof applicant_name === "string" && applicant_name.trim())
        ? applicant_name.trim()
        : (seekerUser ? seekerUser.name : "Job Seeker Candidate");

      const finalEmail = (applicant_email && typeof applicant_email === "string" && applicant_email.trim())
        ? applicant_email.trim()
        : decoded.email;

      const newApp = await dbCreateApplication({
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        job_id,
        applicant_id: decoded.userId,
        applicant_name: finalName,
        applicant_email: finalEmail,
        resume_name,
        resume_data,
        resume_size: typeof resume_size === "number" ? resume_size : undefined,
        cover_letter: cover_letter && typeof cover_letter === "string" ? cover_letter.trim() : undefined,
        status: "Submitted",
        createdAt: new Date().toISOString()
      });

      return res.status(201).json(newApp);
    } catch (err) {
      console.error("Error submitting application:", err);
      return res.status(500).json({ error: "Failed to submit job application due to server error." });
    }
  });

  // GET /api/applications/check/:jobId
  app.get("/api/applications/check/:jobId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(200).json({ hasApplied: false });
      }

      const token = authHeader.split(" ")[1];
      let decoded: { userId: string; email: string; role: string };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
      } catch (err) {
        return res.status(200).json({ hasApplied: false });
      }

      const { jobId } = req.params;
      const existingApp = await dbFindApplication(jobId, decoded.userId);
      return res.status(200).json({ hasApplied: !!existingApp });
    } catch (err) {
      return res.status(200).json({ hasApplied: false });
    }
  });

  // GET /api/applications/my-job-ids
  app.get("/api/applications/my-job-ids", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(200).json({ appliedJobIds: [] });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

      const userApps = await dbGetApplicationsByUser(decoded.userId);
      const appliedJobIds = userApps.map(a => a.job_id);

      return res.status(200).json({ appliedJobIds });
    } catch (err) {
      return res.status(200).json({ appliedJobIds: [] });
    }
  });

  // GET /api/applications/my-applications
  app.get("/api/applications/my-applications", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

      if (decoded.role !== "job_seeker") {
        return res.status(403).json({ error: "Only Job Seekers can view submitted applications." });
      }

      const userApps = await dbGetApplicationsByUser(decoded.userId);
      const jobs = await dbGetJobs();

      const enriched = userApps.map(app => {
        const targetJob = jobs.find(j => j.id === app.job_id);
        return {
          ...app,
          job_title: targetJob ? targetJob.title : "Unknown Position",
          company_name: targetJob ? targetJob.company : "Unknown Company",
          location: targetJob ? targetJob.location : "N/A",
          type: targetJob ? targetJob.type : "Full-Time",
        };
      });

      return res.status(200).json(enriched);
    } catch (err) {
      return res.status(500).json({ error: "Failed to retrieve applications." });
    }
  });

  // GET /api/applications/job/:jobId (For Employers)
  app.get("/api/applications/job/:jobId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

      if (decoded.role !== "employer") {
        return res.status(403).json({ error: "Only Employers can view job candidate applications." });
      }

      const { jobId } = req.params;
      const job = await dbGetJobById(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job listing not found." });
      }

      if (job.employer_id !== decoded.userId) {
        return res.status(403).json({ error: "Access denied. You can only view applications for jobs you posted." });
      }

      const jobApps = await dbGetApplicationsByJob(jobId);
      return res.status(200).json(jobApps);
    } catch (err) {
      return res.status(500).json({ error: "Failed to retrieve job applications." });
    }
  });

  // PATCH /api/applications/:id/status (Employers)
  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const token = authHeader.split(" ")[1];
      let decoded: { userId: string; email: string; role: string };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
      } catch (err) {
        return res.status(401).json({ error: "Invalid session token." });
      }

      if (decoded.role !== "employer") {
        return res.status(403).json({ error: "Only Employers can update candidate application status." });
      }

      const { id } = req.params;
      const { status } = req.body || {};

      const validStatuses = ["Submitted", "Under Review", "Accepted", "Rejected"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status value. Must be one of: ${validStatuses.join(", ")}` });
      }

      const targetApp = await dbGetApplicationById(id);
      if (!targetApp) {
        return res.status(404).json({ error: "Application not found." });
      }

      const targetJob = await dbGetJobById(targetApp.job_id);
      if (!targetJob) {
        return res.status(404).json({ error: "Associated job posting was not found." });
      }

      if (targetJob.employer_id !== decoded.userId) {
        return res.status(403).json({ error: "Access denied. You can only update applications for jobs you posted." });
      }

      const updated = await dbUpdateApplicationStatus(id, status);
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Error updating application status:", err);
      return res.status(500).json({ error: "Failed to update application status." });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
