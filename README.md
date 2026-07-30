# Job Portal Application

A full-stack, production-ready job portal web application connecting Job Seekers with Employers. Built with React, Express, Prisma ORM, and PostgreSQL (Neon DB).

---

## 🚀 Key Features

- **Role-Based Authentication**: Secure JWT authentication supporting dedicated roles for **Job Seekers** and **Employers**.
- **Search & Filtering**: Search job listings by keyword, location, and contract type (Full-Time, Part-Time, Contract, Remote).
- **Resume & Application Management**: Upload PDF/DOCX resumes with file size validation, attach custom cover letters, and track application status (`Submitted`, `Under Review`, `Accepted`, `Rejected`).
- **Employer Dashboard**: Post new job listings, manage posted jobs, review candidate applications, download candidate resumes, and update hiring statuses.
- **Job Seeker Dashboard**: Explore top positions, track submitted applications in real-time, and prevent duplicate submissions.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide React Icons, Vite
- **Backend**: Express.js (Node.js), TypeScript
- **Database & ORM**: PostgreSQL (Neon Database), Prisma ORM
- **Authentication**: JWT (JSON Web Tokens), bcryptjs password hashing

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` or set environment variables on your hosting provider:

```env
# PostgreSQL Database Connection URL (e.g. Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# JWT Secret Key for token signing
JWT_SECRET="your_secure_jwt_secret_key"

# Server Port (default 3000)
PORT=3000

# Configurable CORS Allowed Origin
CLIENT_ORIGIN="*"
```

---

## 📦 Local Setup Guide

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory with your `DATABASE_URL` and `JWT_SECRET`.

3. **Synchronize Database Schema**
   Push the Prisma schema to your PostgreSQL database:
   ```bash
   npx prisma db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
