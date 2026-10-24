# PART – Development Setup Guide

This document describes how to set up, run, test, and develop **PART (People At Right Time)** locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
* **Node.js**: v20.x or higher (`node -v`)
* **npm**: v10.x or higher (`npm -v`)
* **Git**: v2.x or higher
* *(Optional)* **Supabase CLI**: For local PostgreSQL cluster hosting (`npm install -g supabase`)
* *(Optional)* **Expo Go** or **Android Studio**: For running on physical Android devices or emulators.

---

## 2. Step-by-Step Installation

### Clone / Navigate to Project Root
```bash
cd C:\Users\moham\.gemini\antigravity-ide\scratch\part-marketplace
```

### Install Dependencies
```bash
npm install
```
This automatically links the monorepo workspaces:
- `@part/shared`
- `@part/mobile`
- `@part/admin`

---

## 3. Environment Configuration

Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```

### Environment Variables
| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Optional for sandbox | Your Supabase project URL (`https://xyz.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Optional for sandbox | Public anonymous API key with RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only | Secret service role key (Never expose to clients!) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Google Maps Platform API key for geocoding |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Optional | Razorpay sandbox test key ID (`rzp_test_...`) |

> **Note on Zero-Config Sandbox Mode**:
> If Supabase credentials are not yet configured, PART automatically activates its built-in high-fidelity local sandbox store. This allows you to test the complete user journeys (Posting, Applying, Worker Selection, In-App Chat, Cash on Completion, Ratings, and Admin Moderation) without any cloud dependency blockers!

---

## 4. Database Setup & Migrations

If using a Supabase Cloud instance or local Supabase:

### Using Supabase Web Dashboard SQL Editor:
Execute the migration scripts in the exact numerical order:
1. `supabase/migrations/20261024000000_initial_schema.sql` (Tables, constraints, enums)
2. `supabase/migrations/20261024000001_rls_policies.sql` (Row-Level Security policies)
3. `supabase/migrations/20261024000002_functions_triggers.sql` (Geospatial RPCs, triggers, row locks)
4. `supabase/seed.sql` (Chennai default settings, categories, and test tasks)

### Using Supabase CLI:
```bash
# Link project
supabase link --project-ref your-project-id

# Push migrations
supabase db push

# Apply seed data
supabase db reset
```

---

## 5. Running the Applications Locally

### Run Mobile Application
```bash
npm run dev:mobile
```
* **Local Web Preview**: Open [http://localhost:3000](http://localhost:3000)
* Features an interactive mobile frame with touch emulation, Chennai locality selector, bilingual toggle, and role switcher.

### Run Admin Mission Control
```bash
npm run dev:admin
```
* **Admin Dashboard URL**: Open [http://localhost:3001](http://localhost:3001)
* Features user verification, task takedowns, dispute resolution, payment ledger, and platform settings.

---

## 6. Running Automated Tests

Run the test suite powered by Vitest:
```bash
# Run all tests once
npm run test

# Run tests in watch mode during development
npm run test:watch
```

---

## 7. Mobile Native Builds (Expo EAS)

The project includes `mobile/app.json` configured for Android and iOS builds.

To build an Android APK for local testing:
```bash
cd mobile
npx eas-cli build --profile development --platform android
```
