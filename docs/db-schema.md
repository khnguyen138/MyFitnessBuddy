## Database Schema (Postgres / Supabase)

### profiles

- user_id (text, PK)
- display_name (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### foods

- id (uuid, PK)
- user_id (text, FK → profiles.user_id, nullable)
- source (text)
- external_id (text)
- label (text)
- kcal (numeric)
- protein_g (numeric)
- carbs_g (numeric)
- fat_g (numeric)

### meal_entries

- id (uuid, PK)
- user_id (text, FK → profiles.user_id)
- local_date (date)
- meal (breakfast | lunch | dinner | snack)
- food_id (uuid, FK → foods.id)
- kcal (numeric)
- logged_at (timestamptz)

### water_entries

- id (uuid, PK)
- user_id (text, FK → profiles.user_id)
- local_date (date)
- amount_ml (int)

### workouts

- id (uuid, PK)
- user_id (text, FK → profiles.user_id)
- workout (push | pull | legs | cardio | other)
- duration_min (int)

### streaks

- user_id (text, PK, FK → profiles.user_id)
- current_streak (int)
- best_streak (int)
- last_credited_date (date)
