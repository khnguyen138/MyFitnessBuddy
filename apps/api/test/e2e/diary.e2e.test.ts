import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { PrismaService } from "../../src/prisma/index.js";
import { createTestApp } from "../helpers/create-test-app.js";

test("Diary API E2E: GET /diary aggregates meals, water, goals, streak", async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip("DATABASE_URL is not set; skipping e2e test");
    return;
  }

  const prevBypass = process.env.AUTH_BYPASS;
  process.env.AUTH_BYPASS = "true";

  const { app, moduleRef, userId } = await createTestApp();
  const prisma = moduleRef.get(PrismaService);

  const hasTimezoneColumn = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'timezone'
    ) as "exists"
  `
    .then((rows) => rows[0]?.exists === true)
    .catch(() => false);
  if (!hasTimezoneColumn) {
    t.skip(
      "DB schema is missing profiles.timezone; run the Supabase SQL migration for Change 2"
    );
    return;
  }

  const date = "2026-01-04";
  const authHeader = { "x-test-user-id": userId };

  await prisma.profiles.upsert({
    where: { user_id: userId },
    update: { timezone: "UTC" },
    create: { user_id: userId, timezone: "UTC" },
  });

  await prisma.goals.upsert({
    where: { user_id: userId },
    update: { calorie_goal: 2000, water_goal_ml: 2500 },
    create: { user_id: userId, calorie_goal: 2000, water_goal_ml: 2500 },
  });

  t.after(async () => {
    await prisma.water_entries.deleteMany({ where: { user_id: userId } });
    await prisma.meal_entries.deleteMany({ where: { user_id: userId } });
    await prisma.streak_credits.deleteMany({ where: { user_id: userId } });
    await prisma.streaks.deleteMany({ where: { user_id: userId } });
    await prisma.goals.deleteMany({ where: { user_id: userId } });
    await prisma.profiles.deleteMany({ where: { user_id: userId } });
    await app.close();
    if (prevBypass === undefined) delete process.env.AUTH_BYPASS;
    else process.env.AUTH_BYPASS = prevBypass;
  });

  const breakfastCreated = await request(app.getHttpServer())
    .post("/meals")
    .set(authHeader)
    .send({
      logged_at: `${date}T08:00:00.000Z`,
      meal: "breakfast",
      label_snapshot: "Oats",
      serving_quantity: 1,
      kcal: 350,
      protein_g: 15,
      carbs_g: 55,
      fat_g: 8,
    })
    .expect(201)
    .then((r: any) => r.body);

  const dinnerCreated = await request(app.getHttpServer())
    .post("/meals")
    .set(authHeader)
    .send({
      logged_at: `${date}T18:00:00.000Z`,
      meal: "dinner",
      label_snapshot: "Chicken Salad",
      serving_quantity: 1,
      kcal: 400,
      protein_g: 35,
      carbs_g: 20,
      fat_g: 18,
    })
    .expect(201)
    .then((r: any) => r.body);

  assert.ok(
    breakfastCreated?.id,
    `Expected breakfast created id: ${JSON.stringify(breakfastCreated)}`
  );
  assert.ok(
    dinnerCreated?.id,
    `Expected dinner created id: ${JSON.stringify(dinnerCreated)}`
  );
  assert.notEqual(
    breakfastCreated.id,
    dinnerCreated.id,
    `Expected different IDs for breakfast and dinner, got breakfast=${breakfastCreated.id} dinner=${dinnerCreated.id}`
  );
  assert.equal(
    dinnerCreated.user_id,
    userId,
    `Expected dinner user_id=${userId}, got: ${JSON.stringify(dinnerCreated)}`
  );
  assert.equal(
    dinnerCreated.meal,
    "dinner",
    `Expected dinner meal="dinner", got: ${JSON.stringify(dinnerCreated)}`
  );

  const createdMeals = await prisma.meal_entries.findMany({
    where: { id: { in: [breakfastCreated.id, dinnerCreated.id] } },
    orderBy: { logged_at: "asc" },
    select: { meal: true, local_date: true, logged_at: true },
  });
  const createdMealLocalDates = createdMeals.map((m) => ({
    meal: m.meal,
    loggedAt: m.logged_at.toISOString(),
    localDate: m.local_date.toISOString().slice(0, 10),
  }));
  assert.equal(
    createdMeals.length,
    2,
    `Expected 2 meals created, got ${createdMeals.length}: ${JSON.stringify(
      createdMealLocalDates
    )}`
  );
  assert.equal(
    createdMealLocalDates.filter((m) => m.localDate === date).length,
    2,
    `Expected both meals to have local_date=${date}, got: ${JSON.stringify(
      createdMealLocalDates
    )}`
  );

  await request(app.getHttpServer())
    .post("/water")
    .set(authHeader)
    .send({ local_date: date, amount_ml: 250 })
    .expect(201);

  await request(app.getHttpServer())
    .post("/water")
    .set(authHeader)
    .send({ local_date: date, amount_ml: 500 })
    .expect(201);

  const diary = await request(app.getHttpServer())
    .get(`/diary?date=${date}`)
    .set(authHeader)
    .expect(200)
    .then((r: any) => r.body);

  assert.equal(diary.date, date);
  assert.ok(diary.meals);
  assert.ok(Array.isArray(diary.meals.breakfast));
  assert.ok(Array.isArray(diary.meals.lunch));
  assert.ok(Array.isArray(diary.meals.dinner));
  assert.ok(Array.isArray(diary.meals.snack));
  assert.equal(diary.meals.breakfast.length, 1);
  assert.equal(diary.meals.dinner.length, 1);

  assert.deepEqual(diary.totals, {
    kcal: 750,
    protein_g: 50,
    carbs_g: 75,
    fat_g: 26,
  });

  assert.equal(diary.water.total_ml, 750);
  assert.equal(diary.water.goal_ml, 2500);
  assert.equal(diary.water.entries.length, 2);

  assert.equal(diary.goals.calorie_goal, 2000);
  assert.equal(diary.goals.water_goal_ml, 2500);

  assert.equal(diary.streak.current, 1);
  assert.equal(diary.streak.best, 1);
});
