# PART – Production Deployment Guide

This guide describes the complete procedure for deploying **PART – People At Right Time** to production environments for its Chennai market launch.

---

## 1. Production Architecture Overview

* **Database & Auth**: Supabase Cloud (Managed PostgreSQL 15+ with PostGIS)
* **Mobile Client**: Android APK/AAB (Google Play Store) and iOS IPA (Apple App Store) via Expo Application Services (EAS)
* **Admin Dashboard**: Vercel / Cloudflare Pages / AWS Amplify
* **File Storage**: Supabase Storage (`task-attachments`, `completion-evidence`, `profile-avatars`)
* **Push Notifications**: Expo Notifications Service + FCM (Firebase Cloud Messaging)

---

## 2. Step 1: Supabase Production Deployment

### 1. Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Select **South Asia (Mumbai) [ap-south-1]** as the region for optimal sub-20ms latency to Chennai.
3. Save the database password securely.

### 2. Apply Database Migrations
Run the migration scripts in sequential order:
```bash
# Push schema migrations
supabase link --project-ref <your-project-id>
supabase db push
```
Or paste the migration files into the Supabase SQL Editor:
1. `supabase/migrations/20261024000000_initial_schema.sql`
2. `supabase/migrations/20261024000001_rls_policies.sql`
3. `supabase/migrations/20261024000002_functions_triggers.sql`
4. `supabase/seed.sql`

### 3. Create Storage Buckets
In the Supabase Dashboard -> **Storage**:
* Create public bucket `task-attachments` (Max size: 10MB)
* Create public bucket `completion-evidence` (Max size: 10MB)
* Create public bucket `profile-avatars` (Max size: 5MB)
* Set RLS policies on `storage.objects` so authenticated users can only upload files associated with their own tasks or profiles.

---

## 3. Step 2: Mobile App Production Build (Expo EAS)

### 1. Configure EAS
Ensure EAS CLI is installed:
```bash
npm install -g eas-cli
eas login
```

### 2. Build for Android (Google Play Store)
```bash
cd mobile
# Build Android App Bundle (AAB) for Play Store
eas build --platform android --profile production
```

### 3. Build for iOS (Apple App Store)
```bash
eas build --platform ios --profile production
```

### 4. Play Store Submission Checklist
* **Location Permission Justification**: Submit a video demonstrating that location is requested solely to display nearby tasks within 1–20 km, without continuous background tracking.
* **Privacy Policy URL**: Host the privacy policy stating how user names and approximate localities are shared.
* **Indian Emergency Contacts**: Clearly display in-app emergency guidance (Police: 100, Women Helpline: 1091, PART 24/7 Support).

---

## 4. Step 3: Web Admin Deployment (Vercel)

### 1. Build Verification
```bash
npm --workspace=admin run build
```

### 2. Deploy to Vercel
```bash
cd admin
npx vercel --prod
```

### 3. Production Environment Variables in Vercel Dashboard
* `VITE_SUPABASE_URL`: `https://<your-project>.supabase.co`
* `VITE_SUPABASE_ANON_KEY`: `<your-production-anon-key>`

---

## 5. Step 4: Live Payment Gateway Onboarding (Razorpay)

For transitioning from MVP cash/sandbox settlements to live online payouts:
1. Complete legal merchant onboarding with an RBI-authorized Indian payment aggregator (e.g. Razorpay / Cashfree).
2. Configure webhook endpoints in your Supabase Edge Functions:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
3. Verify webhook signatures using the `RAZORPAY_KEY_SECRET` before updating transaction states in `payments` and `payment_events`.
4. Ensure 10% platform fee split or direct merchant collection is documented in user terms of service.
