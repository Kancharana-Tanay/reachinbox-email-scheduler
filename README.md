# ReachInbox Email Scheduler

A production-quality MVP for a full-stack email scheduling platform inspired by ReachInbox.

## 1. Project Overview
This application allows users to authenticate via Google OAuth, connect their Slack workspace, manage email campaigns by uploading a CSV of leads, and schedule emails to be sent using Ethereal SMTP. It enforces per-sender minimum delays and hourly rate limits, rescheduling emails appropriately without dropping them.

## 2. Tech Stack
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Caching/Queues**: Redis + BullMQ
- **SMTP**: Nodemailer + Ethereal Email
- **Search**: Elasticsearch
- **Frontend**: React, Vite, Tailwind CSS
- **Infrastructure**: Docker & Docker Compose

## 3. Local Setup
### Prerequisites
- Docker and Docker Compose
- Node.js (v18+)

```bash
# Clone and enter directory
cd reachinbox-email-scheduler

# Copy environment variables
cp .env.example .env

# Start all services with Docker
docker compose up --build
```
The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Bull Board (Admin)**: http://localhost:4000/admin/queues (admin/admin)

## 4. Environment Variables
Check `.env.example` for all configurable variables. Important ones include:
- `WORKER_CONCURRENCY`: Number of jobs a worker processes concurrently.
- `DEFAULT_MAX_EMAILS_PER_HOUR`: The hourly limit per sender.
- `ENCRYPTION_KEY`: A 32-byte key used to encrypt SMTP passwords and Slack tokens.

## 5. How to run Backend (Without Docker)
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev # Starts Express server
npm run worker:dev # Starts Worker process
```

## 6. How to run Frontend (Without Docker)
```bash
cd frontend
npm install
npm run dev
```

## 7. Ethereal Setup
- Create a free account at [ethereal.email](https://ethereal.email/).
- Obtain SMTP credentials and put them in your `.env` (under `SENDER_1_SMTP_HOST`, etc.).
- When running `npm run prisma:seed`, it will automatically create a demo sender using these credentials.
- After sending emails, you can view the previews in your Ethereal account.

## 8. Google OAuth Setup
- Create a project in [Google Cloud Console](https://console.cloud.google.com/).
- Setup OAuth Consent Screen and create Web Application Credentials.
- Add `http://localhost:4000/api/auth/google/callback` as an authorized redirect URI.
- Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.

## 9. Slack OAuth Setup
- Create an app at [api.slack.com/apps](https://api.slack.com/apps).
- Under OAuth & Permissions, add `chat:write` scope.
- Add `http://localhost:4000/api/slack/callback` as a Redirect URL.
- Put `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` in `.env`.

## 10. Elasticsearch
Emails are asynchronously indexed into Elasticsearch by a background worker (`email-index` queue). The frontend search hits the `GET /api/emails/search` endpoint. If Elasticsearch is unreachable, it seamlessly falls back to a PostgreSQL `contains` query.

## 11. BullMQ
Uses Redis-backed queues:
- `email-send`: Handles scheduling and sending logic.
- `email-index`: Syncs completed/failed jobs to Elasticsearch.

## 12. Architecture Overview
```text
Frontend (React)
       ↓ (HTTP)
Express API (Backend)  <--> PostgreSQL (Source of Truth)
       ↓ (Enqueue Jobs)
   Redis / BullMQ
       ↓
 Worker Processes (Independently Scalable)
   ├── Ethereal SMTP (Sending)
   ├── Slack API (Rate limit notifications)
   └── Elasticsearch (Indexing via separate queue)
```

## 13. Scheduling
When a campaign is created, the API calculates the initial schedule using the start time, minimum delay, and hourly limit. BullMQ delayed jobs are created for each email. However, at execution time, the worker dynamically verifies these conditions again (in case of overlaps) and may reschedule the job if necessary.

## 14. Persistence on Restart
Future delayed jobs are stored persistently in Redis by BullMQ, and their state is tracked in PostgreSQL. If the backend or worker is restarted, BullMQ naturally resumes polling delayed jobs and active jobs, preventing lost schedules and preventing duplicate creation on startup.

## 15. Rate Limiting
A Redis fixed-window counter (`email-rate:{senderId}:{hour}`) is incremented atomically. If the limit is reached, the worker reschedules the BullMQ job to the next hour window and sends exactly one Slack notification per window.

## 16. Concurrency
`WORKER_CONCURRENCY` defines how many async jobs a single worker process handles simultaneously. Multiple worker processes can safely run on different machines/containers without stepping on each other, due to PostgreSQL row-level state updates acting as a distributed lock.

## 17. Delay Between Sends
The default delay (2000ms) is enforced per sender across all concurrent workers using an atomic Lua script in Redis.

## 18. Idempotency
- **API Idempotency**: Campaign creation uses the `Idempotency-Key` header with Redis `NX` commands.
- **Worker Idempotency**: Before sending, the worker performs `UPDATE EmailJob SET status = 'PROCESSING' WHERE id = ? AND status = 'SCHEDULED'`, guaranteeing only one worker can acquire and send an email.

## 19. Features Implemented
- [x] Backend API with Express + Prisma + PostgreSQL
- [x] BullMQ + Redis + Concurrency + Rescheduling
- [x] Minimum delay & Hourly rate limiting
- [x] Real Google OAuth & Session Management
- [x] Real Slack OAuth & Notifications
- [x] Elasticsearch Indexing & Search UI
- [x] Ethereal SMTP Integration
- [x] React Frontend with Tailwind CSS
- [x] Bull Board Admin Dashboard
- [x] CSV Parsing (up to 10k leads)

## 20. Assumptions / Trade-offs
- **Best-effort Ordering**: Since jobs are handled asynchronously by multiple workers and rescheduled when limits are hit, absolute sequential ordering of emails within a campaign is best-effort.
- **Single DB Model**: No explicit `Tenant` abstraction, assuming a typical B2C or simple B2B model where `User` owns `Senders`.
- **Encryption**: Sender credentials and Slack tokens are encrypted symmetrically. In a massive enterprise app, a robust KMS would be preferred.
