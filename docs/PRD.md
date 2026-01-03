# Product Requirements Document (PRD)

## Product Name

**MyFitnessFriend** (working name)

## Product Type

Web + Mobile Application

---

## 1. Introduction / Overview

MyFitnessFriend is a **simple, low-friction fitness and nutrition tracking application** designed for gym-goers and people who want to maintain consistency without the complexity of existing tools.

Most calorie and fitness apps overwhelm users with excessive detail, configuration, and rigid workflows. MyFitnessFriend focuses on **speed, clarity, and habit formation**, making it easy to log meals, water, and workouts in seconds while still providing meaningful daily insights.

The product prioritizes **tracking over judgment**, helping users stay consistent ratheryes than perfect.

---

## 2. Goals / Objectives

### Primary Goals

- Reduce friction in daily calorie and habit tracking
- Enable users to log meals in **under 30 seconds**
- Encourage consistency through visible streaks
- Provide a clear daily overview without overwhelming the user

### Success Metrics (Initial)

- User logs at least **one meal per day on 5+ days per week**
- Median meal-logging time < **30 seconds**
- Water intake logged on **4+ days per week**
- Streak retention of **7+ consecutive days** for active users

_(Metrics will be refined post-MVP once usage data exists.)_

---

## 3. Target Audience / User Personas

### Primary Persona: Regular Gym-Goer

- Already tracks fitness loosely or inconsistently
- Wants faster logging than existing apps
- Values habit consistency over precision
- Logs meals and workouts daily but avoids complex workflows

### Secondary Persona: Fitness Beginner

- Just starting calorie and habit tracking
- Intimidated by feature-heavy apps
- Needs a simple, forgiving system to build consistency

---

## 4. Core Product Philosophy

- **Speed-first, accuracy-optional**
- **Tracking-first, non-judgmental**
- **Opinionated defaults, flexible details**
- **Habits over perfection**

---

## 5. User Stories / Use Cases (v1)

### 5.1 Daily Meal Logging

**As a gym-goer**,
I want to log a meal by searching for a food and selecting a serving size,
so that I can track calories quickly without friction.

**Acceptance Criteria**

- Food search returns relevant results quickly
- Serving size selection is required before adding
- Meal is assigned to breakfast/lunch/dinner/snack
- Daily totals update immediately

---

### 5.2 Barcode-Based Meal Logging

**As a gym-goer**,
I want to scan a barcode, select a serving size, and add the food,
so packaged food logging is faster than manual search.

**Acceptance Criteria**

- Barcode lookup returns food if available
- Serving size can be adjusted
- Fallback to manual search or custom food if barcode fails

---

### 5.3 Custom Food Creation

**As a gym-goer**,
I want to create custom foods when search fails,
so I can log homemade or uncommon meals easily.

**Acceptance Criteria**

- User can define calories and optional macros
- Custom foods appear in future searches
- Custom foods behave the same as API foods

---

### 5.4 Water Tracking

**As a gym-goer**,
I want to log water intake quickly,
so hydration tracking does not interrupt my day.

**Acceptance Criteria**

- Preset quick-add water buttons
- Daily water goal progress visible
- Updates apply immediately

---

### 5.5 Workout Logging

**As a gym-goer**,
I want to log workout type and duration,
so I can track consistency without detailed programming.

**Acceptance Criteria**

- Predefined workout types (push/pull/legs/cardio)
- Duration required
- Workout appears in daily diary

---

### 5.6 Daily Streak Tracking

**As a gym-goer**,
I want my streak to increase when I log at least one meal per day,
so I stay motivated to maintain consistency.

**Acceptance Criteria**

- Streak increments once per calendar day (local timezone)
- Editing or deleting meals does not remove streak credit
- Streak is clearly visible in the app

---

### 5.7 Daily Diary Overview

**As a gym-goer**,
I want to see a daily overview of meals, calories, water, and workouts,
so I understand my day at a glance.

**Acceptance Criteria**

- Meal sections with entries
- Calorie total vs goal
- Water progress vs goal
- Workout summary

---

### 5.8 Historical Viewing

**As a gym-goer**,
I want to view previous days’ logs and streak history,
so I can reflect on consistency over time.

**Acceptance Criteria**

- Users can navigate to past dates
- Past days are read-only by default

---

## 6. Functional Requirements

### Authentication

- OAuth login via Google
- Single identity across web and mobile
- Auth handled by Clerk

### Core Features

- Food search via external API
- Barcode scanning
- Custom food creation
- Meal categorization
- Water tracking
- Workout logging
- Daily aggregates
- Streak tracking
- Historical diary viewing

### Data Handling

- All entries associated with authenticated user
- All timestamps stored with timezone awareness
- Consistent behavior across web and mobile

---

## 7. Non-Functional Requirements

### Performance

- Food search results < 500ms (excluding external API latency)
- Diary loads < 1s for daily view

### Security

- Authenticated access required for all user data
- Server-side validation of user identity
- No client-side direct DB access

### Reliability

- Data consistency across devices
- Graceful handling of late or edited entries

### Usability

- Minimal taps to log food or water
- Clear, uncluttered UI
- No punitive messaging

---

## 8. Technical Architecture & Stack

### Frontend

- **Mobile:** Expo (React Native) + TypeScript
- **Web:** Next.js (App Router) + TypeScript

### Authentication

- **Clerk**

  - Google OAuth
  - Shared identity across web and mobile
  - JWT-based session validation

### Backend

- **NestJS (Node.js + TypeScript)**

  - REST API
  - Auth middleware validating Clerk tokens
  - Business logic ownership

### Database

- **Supabase (PostgreSQL)**

  - Used as hosted Postgres
  - Accessed only via backend (service role)
  - Tables: users, foods, meal_entries, water_entries, workouts, goals, streaks

### External Integrations

- Food database API (e.g., Edamam)
- Barcode scanning via Expo Camera

### Infrastructure

- API hosted on Railway / Fly.io / Render
- Supabase for DB hosting
- Environment-based secret management

---

## 9. Explicitly Out of Scope (v1)

- Push or Slack notifications
- Social features or sharing
- AI coaching or recommendations
- Detailed workout programming (sets/reps)
- Macro optimization or diet plans

---

## 10. Open Questions / Future Considerations

- Should workouts contribute to streaks in future versions?
- Should streaks be customizable per user?
- Should offline logging be supported?
- When to introduce notifications without adding pressure?
- Potential data visualization enhancements

---

## 11. Next Steps

- Finalize DB schema
- Implement authentication flows
- Build Diary MVP (meal + water logging)
- Add food search and barcode scanning
- Implement streak logic
- Ship MVP and gather usage data
