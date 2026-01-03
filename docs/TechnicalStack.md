Here is your **full, finalized tech stack**, organized the way an **engineering manager or senior IC** would expect to see it. This reflects what you’ve actually chosen and built toward — not hypothetical tools.

---

# PulseLog — Full Tech Stack

## Product Type

**Cross-platform application**

- Web
- Mobile (native-like)
- Backend API
- Relational database

---

## Frontend

### Mobile App

- **Expo (React Native)**
- **TypeScript**
- **Expo Router** (file-based navigation)
- **Expo Camera** (barcode scanning)
- **Fetch / Axios** (API calls)

**Why this matters**

- Real mobile app, not a web wrapper
- Uses production-grade RN tooling
- Expo handles native complexity while still teaching real patterns

---

### Web App

- **Next.js (App Router)**
- **TypeScript**
- **React**
- **Clerk React SDK**
- **Server Components + Client Components**

**Why this matters**

- Modern React stack used in industry
- App Router mirrors current big-tech patterns
- SSR/edge-ready architecture

---

## Authentication

### Identity Provider

- **Clerk**

  - Google OAuth
  - Unified identity across web + mobile
  - JWT-based sessions

**Auth flow**

```
User → Clerk OAuth → JWT → API verifies → userId attached to request
```

**Why this matters**

- Auth handled by a dedicated provider (real-world pattern)
- Backend remains auth-agnostic
- Clean separation of identity and data

---

## Backend

### API

- **NestJS**
- **TypeScript**
- **REST API**
- **Auth Guard / Middleware** (Clerk token verification)

**Responsibilities**

- Authentication verification
- Authorization (user owns data)
- Business logic (streaks, diary totals)
- DB access
- External API integration

**Why this matters**

- Explicit backend ownership
- Structured, modular architecture
- Mirrors real product teams

---

## Database

### Primary Database

- **PostgreSQL**
- **Hosted on Supabase**

**Used as**

- Managed Postgres (NOT Supabase Auth)
- Relational source of truth

### Schema Concepts

- `profiles`
- `foods`
- `meal_entries`
- `water_entries`
- `workouts`
- `goals`
- `streaks`

**Key DB features**

- Foreign key constraints
- Cascading deletes
- Indexed diary queries
- `timestamptz` for all events
- Explicit `local_date` for streak correctness

**Why this matters**

- Real relational modeling
- Strong data integrity
- Interview-ready schema design

---

## External APIs

### Food Database

- **Edamam Food Database API**

  - Food search
  - Nutrition data
  - Cached in DB to reduce cost + latency

### Barcode Scanning

- **Expo Camera**
- UPC/EAN scanned on device
- Lookup handled server-side

---

## Repo & Tooling

### Repository Structure

- **Monorepo**

  - `apps/web`
  - `apps/mobile`
  - `apps/api`
  - `packages/shared`
  - `docs/`

### Package Management

- **npm workspaces** (or pnpm equivalent)

### Shared Code

- Shared TypeScript types
- Shared enums (meal types, workout types)
- Shared validation schemas (future)

---

## Documentation & Process

### Product Docs

- **PRD.md**
- **ARCHITECTURE.md**
- **DECISIONS.md**

### Project Management

- **Jira (Kanban)**

  - Epics → Stories → Vertical slices
  - MVP vs Later labels

### Development Practices

- Feature-based modules
- One vertical slice at a time
- Always-working main branch

---

## Deployment (Planned / Typical)

### API

- Railway / Fly.io / Render

### Database

- Supabase managed Postgres

### Web

- Vercel

### Mobile

- Expo build / TestFlight / Play Store (later)

---

## Architectural Summary (one-liner)

> **PulseLog is a cross-platform fitness tracking app built with Expo and Next.js, authenticated via Clerk, powered by a NestJS API, and backed by a relational PostgreSQL database hosted on Supabase.**

This stack:

- is realistic
- is industry-relevant
- demonstrates full-stack ownership
- scales conceptually without overengineering
