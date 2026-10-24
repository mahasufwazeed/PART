# PART – Complete Authentication & Google OAuth Setup Guide

This guide details the complete production setup and configuration instructions for the **PART (People At Right Time)** authentication system.

---

## 1. Authentication Architecture Overview

PART implements a modern, secure, mobile-first authentication experience built with:
* **Supabase Authentication**: Secure JWT handling, session refresh, email/password registration, password recovery flow, and OAuth 2.0.
* **Google OAuth 2.0**: One-tap sign-in with automatic profile linking, preventing duplicate user records.
* **Dual User Activity Roles**: Seamless switching between **Task Poster** ("I Need Help") and **Task Worker** ("I Want to Earn") on a single account.
* **Supabase Storage**: Dedicated `avatars` bucket with Row Level Security allowing authenticated users to upload and update their profile photos.
* **PostGIS & Location Integration**: Automatic post-auth neighborhood location detection and selection.

---

## 2. Route Directory

| Route Path | Description | Access Level |
|---|---|---|
| `/signup` | User registration with Full Name, Email, Mobile, Password, Confirm Password, Google OAuth, and Terms acceptance | Public |
| `/login` | User authentication with Email, Password, Remember Me, returnTo preservation, and Google OAuth | Public |
| `/forgot-password` | Password reset request generating a recovery email via Supabase Auth | Public |
| `/update-password` | Set new password after clicking the recovery email link | Public (Token Verified) |
| `/auth/callback` | Google OAuth redirect destination handling token exchange and profile establishment | Public (OAuth Handler) |
| `/profile` | Profile photo upload (Supabase Storage), email verification badge, role switcher, and saved addresses | Protected |
| `/` | Hyperlocal Task Marketplace Homepage | Authenticated (or auto-redirects to `/login`) |

---

## 3. Environment Variables

Ensure your `.env`, `mobile/.env`, and production environments contain:

```env
# Supabase Project Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wfjbetswwgfyqmsoltva.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ixrkqzZpp3txZ9ZrwBY63A_O4UNxG4f
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ixrkqzZpp3txZ9ZrwBY63A_O4UNxG4f

# Geoapify Geocoding & Routing API Key
NEXT_PUBLIC_GEOAPIFY_API_KEY=2de1be4fe30a4f60a1b12fb57cb6a2f1
```

> **Security Note**: Never expose Supabase service-role keys to browser client bundles. The application exclusively uses publishable/anon keys alongside PostgreSQL Row Level Security (RLS) policies.

---

## 4. Google Cloud Console OAuth 2.0 Configuration

Follow these steps to configure Google OAuth credentials:

### Step 1: Create OAuth 2.0 Client Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create your Google Cloud Project (e.g. `part-marketplace`).
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   * Set User Type to **External**.
   * App Name: `PART – People At Right Time`
   * User support email: Select your admin email.
   * Developer contact information: Enter your email.
   * Save and continue.
4. Navigate to **APIs & Services** > **Credentials**:
   * Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   * Application type: **Web application**.
   * Name: `PART Web Client`.

### Step 2: Configure Authorized URIs
* **Authorized JavaScript origins**:
  * `http://localhost:3000` (Local Development)
  * `http://localhost:3001` (Admin Portal)
  * `https://wfjbetswwgfyqmsoltva.supabase.co`
  * `https://your-production-domain.com` (Production)
* **Authorized redirect URIs (MANDATORY)**:
  * `https://wfjbetswwgfyqmsoltva.supabase.co/auth/v1/callback`

> **CRITICAL**: The redirect URI in Google Cloud Console must point directly to your Supabase project callback: `https://<project-ref>.supabase.co/auth/v1/callback`. Do not enter `http://localhost:3000` as the Google redirect URI, as Supabase acts as the OAuth broker.

5. Click **Create** and copy your **Client ID** and **Client Secret**.

---

## 5. Supabase Dashboard Google Provider Configuration

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard/project/wfjbetswwgfyqmsoltva).
2. Go to **Authentication** > **Providers**.
3. Locate **Google** and expand the settings:
   * Toggle **Enable Google provider** to `ON`.
   * Paste your **Client ID** from Google Cloud Console.
   * Paste your **Client Secret** from Google Cloud Console.
   * Click **Save**.
4. Go to **Authentication** > **URL Configuration**:
   * **Site URL**: `http://localhost:3000` (or your production URL)
   * **Redirect URLs**: Add the following URLs:
     * `http://localhost:3000/auth/callback`
     * `http://localhost:3000/update-password`
     * `https://your-production-domain.com/auth/callback`
     * `https://your-production-domain.com/update-password`
   * Click **Save**.

---

## 6. Database Migration (SQL Execution)

Apply migration file:
`supabase/migrations/20261024000004_auth_and_profiles.sql`

In your Supabase SQL Editor:
1. Open the SQL Editor tab.
2. Paste the contents of `20261024000004_auth_and_profiles.sql`.
3. Click **Run**.

This migration configures:
1. Extended `public.profiles` fields (`email`, `default_role`).
2. Updated `public.handle_new_user()` trigger to automatically create or link user profiles upon Google OAuth or Email signup.
3. Supabase Storage bucket `avatars` with public read access and user-scoped write/update RLS policies.
4. Profile update security ensuring users cannot elevate their own administrative privileges.

---

## 7. Dual User Role Workflow

A single account in PART supports both activities without requiring multiple logins:
* **Task Poster**:
  * Tap "I Need Help (Poster)" in Profile or Quick Action Card.
  * Access Post Task wizard (`/post`), review worker applications, and settle payments.
* **Task Worker**:
  * Tap "I Want to Earn (Helper)" in Profile.
  * Browse nearby tasks on MapLibre GL map, submit bids, share live tracking, and view earnings.

Both modes are persisted to the user profile under `default_role`.

---

## 8. Verification & Test Suite

Run the full automated test suite verifying all 52 test specifications:

```bash
npm run test
```

All 7 test suites pass cleanly:
* `tests/authSystem.test.ts` (16 tests: Signup, Login, Password Reset, Google OAuth, Role Switching, Storage)
* `tests/locationSystem.test.ts` (13 tests: PostGIS radial discovery, Live Tracking, Geoapify Routing)
* `tests/stateMachine.test.ts` (7 tests: Lifecycle state transitions)
* `tests/marketplaceWorkflow.test.ts` (5 tests: Full end-to-end task flow)
* `tests/schemas.test.ts` (5 tests: Zod form constraints)
* `tests/feeCalculator.test.ts` (4 tests: Platform escrow math)
* `tests/geo.test.ts` (2 tests: Spherical Haversine calculation)
