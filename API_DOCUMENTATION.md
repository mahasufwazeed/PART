# PART – API Documentation & Service Reference

This document details the service layer, RPC functions, and client APIs for **PART – People At Right Time**.

---

## 1. Authentication Service (`authService`)

### `authService.register`
Registers a new user account and creates their initial profile.
* **Parameters**:
  - `email` (string): Valid email address.
  - `password` (string): Minimum 6 characters.
  - `fullName` (string): User's legal or public display name (2-60 chars).
  - `preferredLanguage` (`'en' | 'ta'`): Default 'en'.
* **Returns**: `{ user, profile, error? }`

### `authService.login`
Authenticates a user session with credentials.
* **Parameters**:
  - `email` (string)
  - `password` (string)
* **Returns**: `{ session: { user, profile } | null, error? }`

### `authService.getProfile`
Retrieves a user's public profile and rating metadata.
* **Parameters**: `userId` (string UUID)
* **Returns**: `Profile | null`

### `authService.completeOnboarding`
Completes first-time user profile onboarding.
* **Payload**:
  ```json
  {
    "full_name": "Ananya Ramaswamy",
    "bio": "Punctual delivery and home errand assistant.",
    "city": "Chennai",
    "general_location": "Velachery, Chennai",
    "preferred_language": "ta",
    "skills": ["Two-wheeler", "Reliable delivery"],
    "is_worker_available": true
  }
  ```

---

## 2. Task Marketplace Service (`taskService`)

### `taskService.createTask`
Creates and publishes a new task with geospatial coordinates.
* **Request Payload**:
  ```json
  {
    "title": "Pick up prescription medicines from Apollo Pharmacy",
    "description": "Pick up medicines from Roundtana and drop at 4th Avenue, Anna Nagar.",
    "category_id": "11111111-1111-4111-8111-111111111111",
    "budget_inr": 200,
    "estimated_duration_minutes": 30,
    "preferred_date": "2026-10-25",
    "preferred_time_window": "Morning 10 AM",
    "required_workers_count": 1,
    "required_skills": ["Two-wheeler"],
    "city": "Chennai",
    "locality": "Anna Nagar",
    "address_approximate": "Near Anna Nagar Roundtana",
    "address_exact": "Flat 3B, Sunshine Apts, 4th Avenue (Private)",
    "latitude": 13.0850,
    "longitude": 80.2101,
    "postal_code": "600040"
  }
  ```
* **Returns**: `{ task: Task, error?: string }`

### `taskService.getNearbyTasks` (Geospatial Discovery)
Queries open tasks in Chennai within a specified radius using Haversine calculation.
* **Parameters**:
  - `latitude` (number): Center GPS latitude.
  - `longitude` (number): Center GPS longitude.
  - `radiusKm` (number): Supported values: 1, 3, 5, 10, 20 km (Default: 20).
  - `categoryId` (optional string UUID): Filter by category.
  - `searchQuery` (optional string): Full-text keyword match.
* **Returns**: `Task[]` with `distance_km` computed and public landmark only.

### `taskService.applyForTask`
Submits a worker application with an optional pitch.
* **Parameters**: `taskId`, `workerId`, `pitchMessage?`
* **Guarantees**:
  - Rejects if worker is the task requester.
  - Rejects if worker has already applied.
  - Rejects if task is not in `OPEN` status.

### `taskService.assignWorker` (Atomic Selection)
Assigns a worker to a task, starts a conversation, and transitions task status to `ASSIGNED`.
* **Parameters**: `taskId`, `workerId`, `applicationId?`, `requesterId`
* **Guarantees**:
  - Enforces database row-level locking.
  - Prevents race conditions and over-booking.
  - Automatically provisions participant access in chat.

### `taskService.startTask`
Transitions task from `ASSIGNED` to `IN_PROGRESS`.

### `taskService.submitCompletion`
Worker uploads completion notes and photos (`IN_PROGRESS` -> `COMPLETION_SUBMITTED`).

### `taskService.confirmCompletion`
Requester confirms delivery (`COMPLETION_SUBMITTED` -> `COMPLETED`).
Enables payment settlement and reciprocal ratings.

---

## 3. Real-Time Chat Service (`chatService`)

### `chatService.getOrCreateTaskConversation`
Retrieves or initializes the chat thread between task participants.
* **Security**: Only the task requester and assigned worker can access this conversation.

### `chatService.sendMessage`
Sends a message into the conversation.
* **Payload**:
  ```json
  {
    "conversationId": "conv-fa0001",
    "senderId": "user-uuid",
    "content": "I have arrived at the location."
  }
  ```

---

## 4. Payment & Earnings Service (`paymentService`)

### `paymentService.recordPayment`
Records settlement of task compensation.
* **Parameters**:
  - `taskId`: UUID of completed task.
  - `payerId`: Requester user ID.
  - `payeeId`: Worker user ID.
  - `totalAmountInr`: Gross budget (e.g., ₹500).
  - `paymentMethod`: `'CASH_ON_COMPLETION' | 'SANDBOX_ONLINE' | 'RAZORPAY'`
  - `platformFeePercent`: Default 10%.
* **Returns**:
  ```json
  {
    "payment": {
      "total_amount_inr": 500,
      "platform_fee_inr": 50,
      "worker_amount_inr": 450,
      "status": "SUCCESS",
      "payment_method": "CASH_ON_COMPLETION"
    }
  }
  ```

### `paymentService.getWorkerEarnings`
Computes worker earnings statement:
* `totalEarnedInr`: Confirmed net take-home earnings.
* `pendingPaymentInr`: Pending settlements.
* `completedTasksCount`: Count of verified gigs.
* `platformFeesPaidInr`: Total 10% platform service fees paid.

---

## 5. Review Service (`reviewService`)

### `reviewService.submitReview`
* **Parameters**: `taskId`, `reviewerId`, `revieweeId`, `roleReviewed`, `rating` (1-5), `feedback`.
* **Enforcement**: Only permitted if task status is `COMPLETED`. Automatically recalculates user average rating.

---

## 6. Dispute & Trust Service (`disputeService`)

### `disputeService.raiseDispute`
Escalates issue to admin moderation (`status = 'DISPUTED'`).

### `disputeService.resolveDispute`
Admin decision (`RESOLVED_PAY_WORKER` or `RESOLVED_REFUND`).
Automatically releases funds or executes cancellation.
