# QVeue – Smart Queue Management System
**"Know your place. Know your wait."**

QVeue is a production-grade, full-stack digital queue management platform engineered for hospitals, commercial banks, customer service centers, and modern service organizations. It eliminates physical waiting lobby congestion by providing customers with digital tokens, live queue position tracking, dynamic estimated wait times, and proactive auditory & push notifications.

---

## 🌟 Key Highlights & Features

### 1. Digital Queue Registration & Token Generation
- **Unique Daily Sequential Tokens:** Standardized per-service zero-padded tokens (e.g., `Q-024`, `C-005`, `P-012`, `A-001`).
- **Multi-Tenant / Multi-Facility:** Built-in support for **Hospitals** (*General Consultation, Pharmacy, Laboratory*), **Banks** (*Cash Counter, Account Services, Loan Services*), and **Service Centers** (*Technical Support, Hardware Repair, Documentation*).

### 2. Real-Time Queue Tracking
- **Zero Static Fakes:** Powered by **Socket.IO WebSockets** with instant sub-second synchronization across all connected clients.
- When staff clicks **"Call Next"**:
  - `Current Token` updates immediately (`Q-018` → `Q-019`).
  - All waiting customers behind in line have their `People Ahead` decreased instantly (`5` → `4`).
  - `Estimated Waiting Time` dynamically recalculates in real-time.
  - Public display boards and staff counters reflect the new token without refreshing.

### 3. Dynamic Waiting-Time Estimation Engine
- **Base Mathematical Formulation:**
  $$\text{Estimated Wait Time} = \frac{\text{Customers Ahead} \times \text{Average Service Time}}{\max(1, \text{Active Open Counters})}$$
- **Moving Average Adaptation:** Dynamically blends configured target service duration with rolling averages calculated from recent actual completion intervals `(completedAt - calledAt)`.
- **Extensible AI/ML Prediction Hook:** Includes `AIWaitTimePredictorInterface` ready for neural network / regression model integration (factoring in time-of-day, staff speed factor, and queue surge).

### 4. Proactive Multi-Channel Notifications & Audio Chimes
- **Web Audio API Synthesizer:** Native harmonic service bell chime (*659 Hz → 880 Hz*) and double-beep alerts for approaching turns without external audio files.
- **Approaching Turn Alerts:** Dispatches alert toasts and notifications when customers reach $\le 2$ people ahead.
- **Calling Alerts:** Announces assigned desk ("Now Serving Q-024 – Please proceed to Counter 1").
- **Mock Adapters:** Pre-architected SMS, WhatsApp, and Email dispatch interfaces.

### 5. Role-Based Dashboards & Interfaces
- **Customer Hub:** Live ticket tracking card, queue progress bar, "Leave/Cancel Queue" button, visit history, and notification drawer.
- **Staff Terminal:** High-contrast ergonomic controls for service operators:
  - **Call Next Customer**
  - **Recall** (Re-trigger announcement chime)
  - **Skip** (Flag absent customers)
  - **Complete** (Mark service done)
  - **Pause / Resume Queue** (Take breaks or suspend arrivals)
  - Live waiting queue table with sequence position.
- **Admin Command Center:**
  - KPI Stat Cards: `ACTIVE QUEUES`, `WAITING CUSTOMERS`, `SERVED TODAY`, `ACTIVE COUNTERS`, `AVG WAIT TIME`, `AVG SERVICE TIME`.
  - Recharts Area Chart: Hourly customer volume distribution (09:00 - 17:00).
  - Departmental Throughput breakdown chart.
  - Live Queues Master Monitor across all organizations.
  - CRUD operations for Organizations, Services, Counters, and User Directory.

---

## 🏗️ System Architecture & Tech Stack

```
QVeue Full-Stack Architecture
├── Frontend (React 18 + Vite + Tailwind CSS + Lucide Icons + Recharts)
│   ├── Context: AuthContext (JWT), SocketContext (Real-time), NotificationContext (Alerts & Audio)
│   ├── Layouts: MainLayout (Public), DashboardLayout (Role-based Sidebar)
│   └── Pages: Customer Portal, Staff Desk, Admin Command Center
│
└── Backend (Node.js + Express.js + Socket.IO + Mongoose / Resilient Document Store)
    ├── Services: waitTimeService, tokenGeneratorService, notificationService
    ├── Controllers: auth, org, service, counter, queue, notification, admin
    └── Database: Dual-mode connector (MongoDB natively + Resilient JSON document store fallback)
```

---

## ⚡ Pre-Configured Demo Credentials

The platform includes seed data so you can test all roles immediately:

| Role | Name | Email | Password | Pre-seeded State |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | Shankar | `shankar@example.com` | `customer123` | Active Token **Q-024** at CityCare Hospital |
| **Staff** | Dr. Sarah Patel | `sarah.patel@citycare.org` | `staff123` | Assigned to **Counter 1** (General Consultation) |
| **Staff** | Mark Adams | `mark.adams@apexbank.com` | `staff123` | Assigned to **Cash Counter 1** (Apex Global Bank) |
| **Staff** | Lisa Chen | `lisa.chen@quickfix.com` | `staff123` | Assigned to **Support Counter 1** (QuickFix Tech) |
| **Admin** | Eleanor Vance | `admin@qveue.com` | `admin123` | Full access to KPI Analytics & Management |

> **Tip:** You can also use the **Demo Role Switcher bar** at the very top of the app to switch between roles with a single click!

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+ or v20+)
- NPM
- MongoDB (Optional: either MongoDB Atlas or local MongoDB; if no local daemon is running, the app automatically initializes a persistent local engine)

### 1. Environment Configuration
Check `backend/.env` (a template is provided in `backend/.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/qveue
JWT_SECRET=qveue_jwt_super_production_secret_key_2026
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```
> For **MongoDB Atlas**, simply replace `MONGODB_URI` with your connection string:
> `mongodb+srv://<username>:<password>@cluster0.mongodb.net/qveue?retryWrites=true&w=majority`

### 2. Start the Backend Server
```bash
cd backend
npm install
npm run seed     # Pre-populates realistic demo data into MongoDB
npm start        # Starts Express + Socket.IO + MongoDB on http://localhost:5000
```

### 3. Run MongoDB Integration & Verification Tests
```bash
cd backend
node test_mongodb_integration.js   # Verifies connection, registration, queue joining, duplicate prevention, and authorization
```

### 4. Start the Frontend Development Server
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:3000
```

Open your browser at `http://localhost:3000`.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new customer account | Public |
| `POST` | `/api/auth/login` | Authenticate and retrieve JWT | Public |
| `POST` | `/api/auth/quick-demo-login` | Instant demo login for evaluation | Public |
| `GET` | `/api/organizations` | List all active organizations | Public |
| `GET` | `/api/services/org/:orgId` | List services for an organization | Public |
| `POST` | `/api/queues/join` | Join queue and generate digital token | Customer |
| `GET` | `/api/queues/active/my-tickets` | Get customer's live tickets with queue position | Customer |
| `GET` | `/api/queues/staff/my-queue` | Get staff member's live service queue | Staff / Admin |
| `POST` | `/api/queues/:queueId/next` | Staff calls next customer | Staff / Admin |
| `POST` | `/api/queues/:queueId/recall` | Re-announces current customer token | Staff / Admin |
| `POST` | `/api/queues/:queueId/skip` | Marks current customer as skipped | Staff / Admin |
| `POST` | `/api/queues/:queueId/complete`| Marks current customer service completed | Staff / Admin |
| `POST` | `/api/queues/:queueId/pause` | Temporarily pause queue admissions | Staff / Admin |
| `POST` | `/api/queues/:queueId/resume` | Resume paused queue | Staff / Admin |
| `GET` | `/api/admin/analytics` | Get aggregate KPIs, hourly chart, and queues monitor | Admin |

---

## 🧪 Verification Walkthrough

1. **Open Customer View:** Go to `http://localhost:3000` and switch to **Customer (Shankar)**.
2. **Observe Active Ticket:** View Token **Q-024**, Currently Serving **Q-018**, People Ahead **5**, Estimated Wait **15-18 min**.
3. **Open Staff Terminal:** In a second tab (or using the role bar), switch to **Staff (Dr. Sarah Patel)**.
4. **Call Next:** Click **Call Next**. The terminal advances to Token **Q-019**.
5. **Real-Time Synchronisation:** Customer screen instantly updates to **People Ahead: 4**, Estimated Wait adjusts down, and audio chime alerts the user!

---

## 📱 24. QR Code-Based Queue Entry System

QVeue includes a complete, mobile-first **QR Code Queue Entry System** designed to eliminate physical waiting area congestion and manual searching. Customers join their desired queue in seconds simply by scanning a QR code with their phone camera.

### 🏢 Hierarchical QR Code Architecture

| Scope | URL Scheme | Physical Placement | Customer Experience |
| :--- | :--- | :--- | :--- |
| **Organization Level** | `https://qveue.app/join/{orgId}` | Facility Entrance, Main Reception Desk | Displays facility welcome screen with live department cards (General Consultation, Pharmacy, Laboratory, Billing, Registration) showing real-time waiting counts and one-tap join buttons. |
| **Service Level** | `https://qveue.app/join/{orgId}/{serviceId}` | Counter desk, Service room door, Kiosk standee | Opens directly to that department's queue registration card with live wait metrics and immediate "JOIN QUEUE" action. |

### 🛠️ Admin Capabilities
1. **Generate Unique QR Codes:** Instant generation for each organization and individual service category.
2. **High-Resolution View:** Crisp SVG/Canvas rendering preview inside the Admin Console.
3. **Download as PNG:** High-resolution transparent/bordered PNG export (`Organization_Service_QR.png`) for marketing collateral and signage.
4. **Print Physical Counter Standees:** Built-in print layout formatted for counter standees, lobby posters, and reception desks (`@media print` optimized).
5. **Regenerate QR Codes:** One-click rotation with unique version salts (`?v=...`) to invalidate compromised or superseded physical signs without breaking backend integrity.

### 📲 The Customer 6-Step QR Flow
```
[ Step 1: Arrive & Scan ] ──► [ Step 2: Instant Load ] ──► [ Step 3: View Status ]
Customer arrives at           Phone camera opens web      Displays facility, service,
entrance or counter desk      app without app download    "Join this queue?", wait stats

[ Step 4: Simple Info ]  ──► [ Step 5: Token Issued ] ──► [ Step 6: Remote Tracking ]
Enters Name & optional phone  Receives unique token       Leaves waiting room; tracks line
(no unnecessary data)        (e.g., Q-024, Now Serving)   in real-time via WebSockets
```

#### Pre-Join Status Card (Mobile-First)
```text
┌─────────────────────────────┐
│            QVeue            │
│                             │
│       CityCare Hospital     │
│                             │
│    General Consultation     │
│                             │
│     24 people waiting       │
│                             │
│       [ JOIN QUEUE ]        │
│                             │
└─────────────────────────────┘
```

#### Post-Join Live Ticket Card (Mobile-First)
```text
┌─────────────────────────────┐
│            QVeue            │
│                             │
│       YOUR TOKEN            │
│          Q-024              │
│                             │
│     NOW SERVING: Q-018      │
│                             │
│       PEOPLE AHEAD: 5       │
│                             │
│       EST. WAIT: 18 MIN     │
│                             │
│        ● QUEUE LIVE         │
│                             │
└─────────────────────────────┘
```

---

## 🔒 QR Code Security Architecture

To protect customer privacy and prevent queue manipulation, QVeue enforces strict security guidelines:

1. **Zero Sensitive Data Exposure:**
   - QR codes **never** embed customer Personally Identifiable Information (PII), database credentials, internal server IPs, or private authentication tokens.
   - QR codes strictly contain public routing endpoints (`https://qveue.app/join/{organizationId}/{serviceId}`).
2. **Cryptographic Salt & Token Invalidation:**
   - QR codes support versioned salts (`?v={timestamp_or_nonce}`). If a physical counter sign is stolen, relocated, or photographed maliciously, administrators can click **Regenerate** to issue a new URL and immediately retire the old code.
3. **Active Status Verification:**
   - The backend validates that both the organization and requested service are active (`status === 'active'`) and operating during valid queue hours. Inactive or paused services reject admission attempts.
4. **Anti-Flooding & Duplicate Ticket Prevention:**
   - Server-side validation prevents automated bot spam and prohibits duplicate active tickets for the same telephone number or user ID in the same service queue.
5. **HTTPS / TLS Enforcement:**
   - In production, all QR destinations enforce secure HTTPS connections with HSTS headers to prevent man-in-the-middle (MITM) attacks and phishing redirects.
6. **Frictionless Guest Privacy:**
   - Customers are not forced to create complex passwords or provide sensitive identity documents at the entrance. Only a name and optional mobile phone (for SMS alerts) are collected over encrypted POST requests.

