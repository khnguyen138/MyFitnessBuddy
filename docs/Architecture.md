# Architecture

## Overview

MyFitnessFriend is a **web + mobile fitness tracking application** built with a clear separation of concerns between clients, authentication, business logic, and data storage.

The system is designed to:

- minimize client-side complexity
- centralize business logic
- support multiple clients (web and mobile) consistently
- remain simple enough for a solo developer while reflecting real-world architecture patterns

At a high level:

```
Web App (Next.js) ─┐
                   ├──▶ API (NestJS) ───▶ Postgres (Supabase)
Mobile App (Expo) ─┘        ▲
                            │
                        Auth (Clerk)
```

---

## High-Level Components

### Clients

- **Web:** Next.js (App Router)
- **Mobile:** Expo (React Native + Expo Router)

Responsibilities:

- UI rendering
- User interactions
- Calling backend APIs
- Holding minimal state (no business logic)

Clients **do not** access the database directly.

---

### Authentication (Clerk)

Clerk is used as the **single authentication provider** for both web and mobile.

Responsibilities:

- Google OAuth login
- Session management
- Issuing JWTs for authenticated users

Why Clerk:

- Unified auth across web + mobile
- OAuth handled externally
- No custom auth logic in backend
- Clean separation of identity from data storage

The authenticated `userId` provided by Clerk is the **source of truth for user identity** across the system.

---

### Backend API (NestJS)

The backend is a **REST API** built with NestJS.

Responsibilities:

- Verifying Clerk JWTs on every request
- Enforcing user-level access control
- Handling all business logic
- Coordinating database reads/writes
- Integrating with external APIs (food search, barcode lookup)

The API is the **only service** allowed to interact with the database directly.

This keeps:

- security centralized
- business rules consistent
- clients simple and thin

---

### Database (Supabase Postgres)

Supabase is used strictly as a **hosted PostgreSQL database**.

Responsibilities:

- Persisting application data
- Supporting relational queries for diary views and history

Supabase Auth is **not used**.

All database access occurs through the backend using a service-level connection.
User-level access control is enforced in the API layer using the Clerk `userId`.

---

## Data Flow

### Authentication Flow

1. User signs in via Clerk on web or mobile
2. Clerk issues a session JWT
3. Client attaches JWT to API requests
4. API verifies token and extracts `userId`
5. `userId` is used for all authorization decisions

---

### Meal Logging Flow (Example)

1. User searches or scans food on client
2. Client sends request to API:

   ```
   POST /meals/entry
   ```

3. API:

   - verifies Clerk token
   - validates request payload
   - writes meal entry to database

4. API returns updated diary data
5. Client updates UI immediately

---

## Core Domain Model

### User Identity

- Users are identified by `clerk_user_id`
- Stored explicitly in all user-owned tables
- No reliance on database-level auth context

---

### Core Tables (Simplified)

- `profiles` – user preferences and goals
- `foods` – cached API foods + custom foods
- `meal_entries` – logged meals with servings and calories
- `water_entries` – hydration logs
- `workouts` – workout type and duration
- `goals` – calorie and water targets
- `streaks` – derived consistency data (v1+)

All time-based data uses explicit timestamps and respects the user’s local timezone.

---

## Streak Logic

- A streak increments when **at least one meal is logged in a calendar day**
- Calendar day is determined by the user’s **local timezone**
- Editing or deleting meals does **not** remove streak credit
- Streaks represent **habit intent**, not data accuracy

Streak computation is handled in the backend to ensure consistency across clients.

---

## Design Principles

### Thin Clients

Clients do not:

- calculate streaks
- aggregate totals
- enforce access rules

They only:

- display data
- collect user input
- send requests

---

### Centralized Business Logic

All rules live in one place (the API):

- meal logging behavior
- streak definitions
- data validation
- authorization

This prevents logic drift between web and mobile.

---

### Explicit Boundaries

- Auth ≠ Database
- Clients ≠ Business logic
- Database ≠ Authorization

Each layer has a single responsibility.

---

## Scalability Considerations

The architecture supports future growth without rework:

- Additional clients (desktop, integrations)
- Background jobs (streak checks, reminders)
- Notifications
- Analytics and insights

None of these require changes to the fundamental system boundaries.

---

## Tradeoffs & Rationale

### Why API-first instead of direct Supabase access

- Avoids client-side database exposure
- Allows use of Clerk instead of Supabase Auth
- Keeps logic testable and debuggable
- Mirrors common production architectures

### Why REST instead of GraphQL

- Simpler mental model
- Easier debugging
- Well-suited for CRUD + aggregation workflows

---

## Non-Goals (Current Architecture)

- Offline-first data sync
- Real-time subscriptions
- Client-side database access
- Microservices

These are intentionally deferred to keep complexity aligned with project scope.

---

## Summary

MyFitnessFriend uses a **clean, layered architecture** that:

- supports web and mobile equally
- keeps auth, logic, and data clearly separated
- scales without premature complexity
- reflects real-world engineering patterns

This architecture prioritizes **clarity, correctness, and maintainability** over novelty.
