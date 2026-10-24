# PART – Application Security Checklist & Audit Guide

This document details the security architecture, Row-Level Security (RLS) enforcement, location privacy controls, and transaction safety standards implemented for **PART – People At Right Time**.

---

## 1. Row-Level Security (RLS) Verification

| Table | RLS Status | Read Policy | Write / Update Policy |
|---|---|---|---|
| `profiles` | **ENABLED** | Authenticated users (public fields only) | Users update own row only (`auth.uid() = id`). Admins can update all. |
| `tasks` | **ENABLED** | Open tasks public; non-open visible only to requester, assigned worker, or admin | Insert: `auth.uid() = requester_id`. Update: requester or admin only. |
| `task_locations` | **ENABLED** | Approximate location visible to all; **exact address hidden** | Requester insert/update only. Exact address visible ONLY after assignment. |
| `task_applications` | **ENABLED** | Applicant, task requester, or admin | Worker can only insert/withdraw own application; requester can accept/reject. |
| `task_assignments` | **ENABLED** | Worker, requester, or admin | Created atomically via stored procedure; updated by participants/admin. |
| `conversations` | **ENABLED** | Conversation participants only | Participants created upon assignment. |
| `messages` | **ENABLED** | Conversation participants only | Sender must equal `auth.uid()` and be in `conversation_participants`. |
| `payments` | **ENABLED** | Payer, payee, or admin | Payer or system insert; status updates restricted to verified admin/webhook. |
| `reviews` | **ENABLED** | All users (public reviews) | Only participants of genuinely `COMPLETED` tasks can insert. |
| `disputes` | **ENABLED** | Participants or admin | Participants can insert; only admin can resolve/update. |
| `admin_audit_logs` | **ENABLED** | Admin only | Admin only (immutable). |

---

## 2. Location Privacy & Address Masking

Because PART connects individuals in Chennai, privacy and physical safety are critical:
1. **Public Discovery View**: Only displays the neighborhood locality (e.g. *"Anna Nagar"*, *"Velachery"*) and an approximate public landmark (e.g. *"Near Roundtana"*).
2. **Exact Residential Address Masking**: Exact house numbers, apartment names, and door codes (`address_exact`) are stored separately in `task_locations` and **filtered out** of all explore and discovery queries.
3. **Disclosed Exclusively upon Assignment**: Only when a requester explicitly selects and assigns a worker does the system reveal the exact address to that specific worker.
4. **No Continuous Background Tracking**: The app requests location only on demand for calculating distance filters (1–20 km) and never runs passive background GPS beacons.

---

## 3. Concurrency Control & Double-Booking Prevention

In high-traffic gig marketplaces, simultaneous applicant acceptance attempts can result in race conditions.
* **Database Row Locks**: The stored procedure `assign_worker_to_task` executes `SELECT * FROM tasks WHERE id = p_task_id FOR UPDATE;`.
* **Atomic Capacity Verification**: Validates `assigned_workers_count < required_workers_count` under the exclusive row lock before inserting into `task_assignments`.
* **Idempotent Unique Constraints**: `CONSTRAINT unique_task_worker_assignment UNIQUE (task_id, worker_id)` prevents accidental double assignment of the same worker.

---

## 4. Payment Integrity & No Fake Escrow Standards

1. **No Fake Escrow**: PART does not hold customer funds in unauthorized accounts.
2. **Cash on Completion**: For the MVP launch, users can inspect completed work and settle payment in person via cash.
3. **Sandbox Testing**: Online payments are clearly demarcated as sandbox test transactions and cannot be withdrawn as real currency.
4. **Transparent Fees**: The platform fee (10%) is disclosed to both requester and worker before task assignment or payment initiation.

---

## 5. Trust, Moderation & Reporting

* **Reciprocal Reviews**: Enabled **only** after a task transitions to `COMPLETED`. Both requester and worker rate each other (1–5 stars) to establish accountable reputations.
* **Prohibited Task Policies**: Automated moderation keywords and category safety guidelines prevent dangerous, illegal, or unethical tasks (e.g., academic surrogate testing, hazardous material transport).
* **Incident Escalation**: Users can flag tasks or report bad actors directly to the admin moderation team.

---

## 6. Secret Management

* **No Service Role Keys in Frontend**: The Supabase service-role key is strictly reserved for backend Edge Functions and migration scripts. Frontend bundles only receive the anonymous public key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`).
* **Environment Configuration**: Sensitive secrets are stored in `.env` and excluded via `.gitignore`.
