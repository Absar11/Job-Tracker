# Job Tracker Pro — Full-Stack MERN Application

Job Tracker Pro is a full-stack (MERN) application built with **React 18 (Vite)**, **Redux Toolkit**, **Express.js**, and **MongoDB with Mongoose**. It helps job seekers organize, track, and analyze their job applications, interview schedules, and career metrics from a single modern interface.

---

## Features

### 🛡️ Authentication & Security
- **OTP Email Verification on Signup:** New users verify their email with a 6-digit one-time code before account creation.
- **JWT Session Persistence:** Secure login, registration, and session restoration via bearer tokens.
- **Password Hashing:** Passwords hashed with `bcryptjs`.
- **Forgot Password Flow:** Email-based password reset with tokenized secure links.

### 💼 Job Application Pipeline
- **Full CRUD:** Add, view, edit, and delete job applications.
- **Dynamic Search & Filters:** Filter by status, company, location; sort by date or name.
- **Pagination:** Optimized listing with next/prev controls and item count.

### 📊 Analytics Dashboard
- **KPI Cards:** Total Applications, Scheduled Interviews, Rejection Rate, and Offers at a glance.
- **Charts (Chart.js):**
  - Monthly Applications Timeline (bar chart)
  - Status Distribution Doughnut
  - Interview vs Rejection Pie Chart

### ⏰ Automatic Interview Reminder Emails
- **24-hour reminder:** Email sent automatically 24 hours before a scheduled interview.
- **1-hour reminder:** Email sent automatically 1 hour before a scheduled interview.
- **Per-job toggle:** Enable or disable reminders per application from the Interview Calendar.
- **Idempotent delivery:** Each reminder is sent only once (tracked via `reminder24hSent` / `reminder1hSent` flags).
- Scheduler runs every **5 minutes** in the background (requires MongoDB connection).

### 📅 Interview Calendar
- Lists all upcoming interviews with countdown timer, format, and location.
- Toggle reminders on/off per interview directly from the dashboard.

### ⚙️ Hybrid Persistence Engine
- **MongoDB (Production):** Mongoose schemas with full relational queries.
- **Local Fallback:** If `MONGODB_URI` is absent, the server auto-switches to a file-based JSON database (`data/db.json`) — fully functional out-of-the-box with no configuration required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, Framer Motion, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose (local JSON fallback) |
| Auth | JWT, bcryptjs |
| Email | Nodemailer (SMTP — Gmail compatible) |
| Styling | Tailwind CSS |

---

## Project Structure

```
├── src/
│   ├── backend/
│   │   ├── controllers/        # Auth & Job controllers
│   │   ├── middleware/         # JWT auth middleware
│   │   ├── models/             # User & Job Mongoose schemas
│   │   ├── routes/             # REST API route definitions
│   │   └── services/           # DB service, email service, reminder scheduler
│   ├── components/             # Reusable UI components (Charts, Toast, etc.)
│   ├── layouts/                # Dashboard sidebar layout
│   ├── pages/                  # All page components (Login, Register, Dashboard, etc.)
│   ├── redux/                  # Auth slice & global store
│   ├── services/               # API client (fetch wrapper)
│   └── types.js                # Shared enums (JobStatus, JobType)
├── server.js                   # Express + Vite dev server integration
├── dev-start.cjs               # Dev launcher (auto-clears ports)
├── package.json
└── .env.example                # Environment variable template
```

---

## REST API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/send-otp` | Step 1 of signup — send OTP to email |
| `POST` | `/register` | Step 2 of signup — verify OTP & create account |
| `POST` | `/login` | Login and receive JWT token |
| `GET` | `/profile` | Get authenticated user profile |
| `PUT` | `/profile` | Update name, avatar, or password |
| `POST` | `/forgot-password` | Request password reset email |
| `POST` | `/reset-password` | Reset password with token + OTP |

### Jobs (`/api/jobs`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Create a job application |
| `GET` | `/` | List, search, filter, paginate applications |
| `GET` | `/analytics` | Aggregated stats for dashboard charts |
| `GET` | `/:id` | Get single job details |
| `PUT` | `/:id` | Update a job application |
| `DELETE` | `/:id` | Delete a job application |
| `POST` | `/:id/reminder` | Manually trigger a reminder email |

---

## Setup & Installation

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd job-tracker-pro
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# MongoDB connection string (leave blank to use local JSON fallback)
MONGODB_URI="mongodb+srv://..."

# JWT signing secret
JWT_SECRET="your_secret_here"

# SMTP Email (for OTP, password reset, and interview reminders)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_16_char_app_password"
SMTP_FROM="Job Tracker Pro <your_email@gmail.com>"
```

> **Gmail users:** Use a [Gmail App Password](https://myaccount.google.com/apppasswords) — not your regular Gmail password.

### 3. Run in Development

```bash
npm run dev
```

App opens at: `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm run start
```

---

## Deployment

| Service | What to deploy |
|---|---|
| **Render** | Backend (Express server) — supports `setInterval`, needed for reminder scheduler |
| **Vercel** | Frontend only (if separated) — serverless, scheduler will NOT work |
| **MongoDB Atlas** | Database |

> **Render Free Tier Note:** The server sleeps after 15 min of inactivity. Use [cron-job.org](https://cron-job.org) to ping `/api/health` every 10 minutes to keep it alive and ensure reminders are delivered.

---

## Coming Soon
- Resume upload & management
