# FreeTalk — Ideas Over Identity

> **"Your identity is private. Your ideas are public. Your behavior still matters."**

FreeTalk is a modern, responsive, privacy-first anonymous social discussion platform built for college demonstrations and startup-grade deployments.

---

## 🌟 Key Features

1. **Strict Credential Segregation**:
   - Internal credentials (`user_id`, `email`, Argon2 hash) are NEVER exposed over public APIs.
   - Public interactions occur under randomly generated, customizable personas (e.g., **Anonymous Fox**, **Anonymous Raven**) with generative geometric abstract SVG avatars.
2. **Innovative Discussion Formats**:
   - **Thought of the Day**: Rotating philosophical and technology prompts.
   - **Blind Debate**: Side-by-side arguments judged and voted on without revealing speaker identities.
   - **Idea vs Idea**: Compare two contrasting philosophies or software architectures.
   - **Disappearing Identities**: Option to post using a single-discussion temporary alias that cannot be linked to any other activity.
   - **No Follower Culture**: Discourages vanity metrics—no public follower counts or popularity contests. Reputation is subtly reflected as "🌱 Positive Contributor".
3. **AI Content Moderation (Offline FastAPI)**:
   - Evaluates linguistic toxicity, harassment, threats, and spam.
   - 3-tier risk system:
     - **Low** (< 0.40): Published normally.
     - **Medium** (0.40 - 0.75): Caution flag / queued for review.
     - **High** (> 0.75): Intercepted into the Moderator Queue with automatic risk score breakdown.
4. **Privacy Center & Privacy Score (94/100)**:
   - Transparent compliance checklist.
   - Download complete personal data archive in JSON format.
   - Permanent one-click account deletion and credential purge.
5. **Real-time Anonymous Messaging & Notifications**:
   - Built on **Socket.IO** for instantaneous chat and live discussion reactions.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18+, Vite, Tailwind CSS, Lucide Icons, Framer Motion, Recharts, Axios, Socket.IO Client.
- **Backend**: Node.js 20+, Express.js, Prisma ORM, PostgreSQL, Argon2, JWT HTTP-only cookies, Zod, Helmet, Rate Limiter.
- **AI Moderation Service**: Python 3.11+ / FastAPI offline NLP classifier service.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+
- **Python**: 3.11+
- **PostgreSQL**: 16+ running locally on port 5432

---

### 2. Database Setup & Seed
1. Ensure your PostgreSQL service is running.
2. In `backend/`:
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
```

---

### 3. Start Python Moderation Service
In a dedicated terminal:
```bash
cd moderation-service
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

---

### 4. Start Node.js Backend
In a second terminal:
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

---

### 5. Start React Frontend
In a third terminal:
```bash
cd frontend
npm install
npm run dev
# Application opens at http://localhost:5173
```

---

## 🔑 Pre-Seeded Accounts

All accounts share the password: `Password123!`

| Role | Email | Anonymous Persona | Description |
| :--- | :--- | :--- | :--- |
| **System Admin** | `sanshusinghadmin@gmail.internal` | 🔮 Anonymous Oracle | Full platform administration, analytics & user directory |
| **Moderator** | `moderator.safety@gmail.com` | 🛡️ Anonymous Guardian | Safety queue reviewer & appeals steward |
| **User 1 (Fox)** | `alex.morgan92@gmail.com` | 🦊 Anonymous Fox | Active user with software & AI discussions |
| **User 2 (Raven)** | `priya.sharma.tech@gmail.com` | 🦅 Anonymous Raven | Active user with cybersecurity & debate votes |
| **User 3 (Pixel)** | `david.kim.design@outlook.com` | 🟩 Anonymous Pixel | Active contributor & poll creator |
| **User 4 (Moon)** | `elena.rostova@gmail.com` | 🌌 Anonymous Moon | Participant in debates & threaded replies |

*(You can also register a brand-new account in 30 seconds from `/register`!)*

---

## 🧪 Automated Testing

To run the automated backend test suite:
```bash
cd backend
npm test
```
All tests verify authentication, safety filters, database relations, and safe user serialization.
