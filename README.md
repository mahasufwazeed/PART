# PART – People At Right Time
> **Right People. Right Time. Right Work.**
> Production-Oriented Hyperlocal Task Marketplace for Chennai & Beyond

[![Tests](https://img.shields.io/badge/Tests-23%20Passed-emerald.svg)](./TEST_REPORT.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-indigo.svg)](./DATABASE_SCHEMA.md)
[![License](https://img.shields.io/badge/License-Proprietary-slate.svg)](#)

---

## 1. Product Overview

**PART (People At Right Time)** is a production-engineered hyperlocal gig economy and peer-to-peer task marketplace. Built specifically for an initial launch in **Chennai, Tamil Nadu, India**, PART connects local residents, students, freelancers, part-time workers, and small business owners with verified nearby help in minutes.

### Initial Market Focus
* **Primary Launch City**: Chennai (Velachery, Anna Nagar, T. Nagar, Adyar, OMR - Thoraipakkam, Tambaram, Mylapore, Guindy, etc.)
* **Currency**: Indian Rupee (₹ INR)
* **Languages**: English and Tamil (தமிழ்)
* **Target Audience**: College students, local residents, small merchants, delivery partners, and neighborhood handymen.

---

## 2. Key Architecture & Features

### Cross-Platform Architecture
* **Mobile App (`mobile/`)**: Modern responsive mobile client powered by React, Tailwind CSS, Zustand, TanStack Query, React Hook Form, and Zod validation, pre-configured with Expo native metadata (`app.json`).
* **Admin Console (`admin/`)**: Mission-control administration web dashboard for system supervisors (User verification, task takedowns, dispute adjudication, transaction ledgers, analytics).
* **Shared Engine (`shared/`)**: Shared types, Zod validation schemas, pure state machine engine, Haversine geospatial proximity engine, and transparent platform fee calculator.
* **Database & Security (`supabase/`)**: Normalized PostgreSQL schema with 23 tables, strict Row-Level Security (RLS) policies, atomic assignment stored procedures with row-level locks, and PostGIS/Haversine search functions.

### Core Marketplace Capabilities
1. **Nearby Geospatial Discovery**: High-efficiency proximity search supporting radius filters (1km, 3km, 5km, 10km, 20km) around Chennai localities.
2. **Server-Enforced Task State Machine**:
   $$\text{DRAFT} \rightarrow \text{OPEN} \rightarrow \text{ASSIGNED} \rightarrow \text{IN\_PROGRESS} \rightarrow \text{COMPLETION\_SUBMITTED} \rightarrow \text{COMPLETED}$$
   Separate paths for $\text{CANCELLED}$ and $\text{DISPUTED}$. Users cannot jump or bypass states.
3. **Location Privacy Protection**: Exact house addresses are strictly masked and only disclosed to the confirmed assigned worker.
4. **Race-Condition Safe Worker Selection**: Database row locks prevent double-booking or over-assignment beyond capacity.
5. **Real-Time In-App Chat**: Direct messaging between confirmed task participants with message timestamps, read receipts, and safety encryption.
6. **Transparent Payment Settlement**:
   - Cash on Completion (standard local Chennai model)
   - Sandbox Online Payment (UPI / Card simulation)
   - Transparent 10% platform fee breakdown (configurable by admin)
7. **Two-Way Trust & Safety**: Mutual 1–5 star ratings and reviews enabled strictly after verified completion. Integrated report & dispute escalation workflows.

---

## 3. Repository Structure

```
part-marketplace/
├── supabase/
│   ├── migrations/
│   │   ├── 20261024000000_initial_schema.sql     # 23 normalized tables, triggers, enums
│   │   ├── 20261024000001_rls_policies.sql        # Comprehensive Row-Level Security
│   │   └── 20261024000002_functions_triggers.sql  # get_nearby_tasks, assign_worker_to_task
│   └── seed.sql                                   # Realistic Chennai seed profiles & tasks
├── shared/
│   ├── src/
│   │   ├── types/index.ts                         # Complete TypeScript entity definitions
│   │   ├── schemas/index.ts                       # Zod validation schemas
│   │   ├── constants/                             # Chennai localities, 7 categories, theme
│   │   ├── utils/                                 # State machine, Haversine geo, fee calculator
│   │   └── supabase/                              # Universal client, mock store, services
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── components/                            # Role switcher, Header, TaskCard, MapView, Nav
│   │   ├── screens/                               # Home, Explore, Post, Activity, Profile, Modals
│   │   ├── store/                                 # Zustand global store
│   │   └── App.tsx                                # Screen navigator and layout container
│   ├── app.json                                   # Expo app configuration
│   └── package.json
├── admin/
│   ├── src/
│   │   ├── components/                            # Sidebar, Header, MetricCard
│   │   ├── pages/                                 # Overview, Users, Tasks, Disputes, Payments, Settings
│   │   └── App.tsx
│   └── package.json
├── tests/                                         # Automated Unit & E2E Test Suite (Vitest)
│   ├── stateMachine.test.ts
│   ├── feeCalculator.test.ts
│   ├── geo.test.ts
│   ├── schemas.test.ts
│   └── marketplaceWorkflow.test.ts
├── .env.example
├── DEVELOPMENT_SETUP.md
├── DATABASE_SCHEMA.md
├── API_DOCUMENTATION.md
├── SECURITY_CHECKLIST.md
├── TEST_REPORT.md
└── DEPLOYMENT_GUIDE.md
```

---

## 4. Quickstart

### Prerequisites
* **Node.js**: v20+ (`node -v`)
* **npm**: v10+

### Installation & Test Run
```bash
# 1. Install all dependencies across workspaces
npm install

# 2. Run automated test suite (Unit & End-to-End Journeys)
npm run test

# 3. Start Mobile Application (Port 3000)
npm run dev:mobile

# 4. In a separate terminal, start Admin Console (Port 3001)
npm run dev:admin
```

Open your browser:
* **Mobile App Preview**: [http://localhost:3000](http://localhost:3000)
* **Admin Dashboard**: [http://localhost:3001](http://localhost:3001)
