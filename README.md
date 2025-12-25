# Personal EZpensify 💸

**Personal EZpensify** is a full-stack personal finance application for tracking **expenses and income** in a simple, structured, and secure way.  
It is designed as a **mobile-first app** with a custom backend and modern authentication.

---

## 🚀 Features

- 🔐 Secure authentication using **Clerk**
- 💰 Track **expenses & income**
- 📊 Clean and minimal UI for daily finance logging
- 🌐 Custom backend with REST APIs
- 🗄️ Cloud-hosted PostgreSQL database
- 📱 Cross-platform mobile app (Android & iOS)
- 🛡️ API rate limiting for abuse prevention
- ⏱️ Scheduled cron job to keep backend alive

---

## 🧱 Tech Stack

### Frontend (Mobile)
- **Expo (React Native)**
- TypeScript
- Clerk Authentication

### Backend
- **Node.js + Express**
- REST API architecture
- Rate Limiting Middleware
- Cron Jobs

### Database
- **Neon DB (PostgreSQL)**

### Authentication
- **Clerk**

---

## 🔐 Backend Security & Reliability

### 🛡️ Rate Limiting
A rate limiter is implemented at the backend level to:
- Prevent API abuse
- Protect against brute-force and spam requests
- Ensure fair usage per client/IP

This helps maintain backend stability and avoids unexpected load spikes.

---

### ⏱️ Cron Job (Backend Revival – Every 14 Minutes)

A cron job runs **every 14 minutes** to ping the backend server.

**Purpose:**
- Prevents the backend from going idle or sleeping on free hosting platforms
- Keeps the server warm for faster API response times
- Ensures better reliability for mobile users

**What it does:**
- Sends a lightweight request to a health endpoint
- Confirms backend availability
- Logs the successful wake-up silently (no user impact)

---

## 📂 Project Structure

