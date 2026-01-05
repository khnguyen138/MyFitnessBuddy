import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { PrismaService } from "../../src/prisma/index.js";
import { createTestApp } from "../helpers/create-test-app.js";

test("Meals API E2E workflow: POST -> GET -> PATCH -> DELETE", async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip("DATABASE_URL is not set; skipping e2e test");
    return;
  }

  const prevBypass = process.env.AUTH_BYPASS;
  process.env.AUTH_BYPASS = "true";

  const { app, moduleRef, userId } = await createTestApp();
  const prisma = moduleRef.get(PrismaService);

  const date = "2026-01-04";
  const authHeader = { "x-test-user-id": userId };

  // Ensure FK requirements are satisfied (meal_entries.user_id -> profiles.user_id)
  await prisma.profiles.upsert({
    where: { user_id: userId },
    update: {},
    create: { user_id: userId },
  });

  t.after(async () => {
    // Clean up anything created during the test for this user.
    await prisma.meal_entries.deleteMany({ where: { user_id: userId } });
    await prisma.streaks.deleteMany({ where: { user_id: userId } });
    await prisma.goals.deleteMany({ where: { user_id: userId } });
    await prisma.profiles.deleteMany({ where: { user_id: userId } });
    await app.close();
    if (prevBypass === undefined) delete process.env.AUTH_BYPASS;
    else process.env.AUTH_BYPASS = prevBypass;
  });

  // 1) POST /meals
  const created = await request(app.getHttpServer())
    .post("/meals")
    .set(authHeader)
    .send({
      local_date: date,
      meal: "lunch",
      label_snapshot: "Chicken Salad",
      serving_quantity: 1,
      kcal: 350,
    })
    .expect(201)
    .then((r: any) => r.body);

  assert.equal(created.user_id, userId);
  assert.equal(created.meal, "lunch");
  assert.equal(created.label_snapshot, "Chicken Salad");
  assert.ok(created.id);

  const createdId = created.id as string;

  // 2) GET /meals?date=YYYY-MM-DD
  const list = await request(app.getHttpServer())
    .get(`/meals?date=${date}`)
    .set(authHeader)
    .expect(200)
    .then((r: any) => r.body);

  assert.ok(Array.isArray(list));
  assert.equal(list.length, 1);
  assert.equal(list[0].id, createdId);

  // 3) PATCH /meals/:id
  const updated = await request(app.getHttpServer())
    .patch(`/meals/${createdId}`)
    .set(authHeader)
    .send({ label_snapshot: "Chicken Salad (updated)", kcal: 400 })
    .expect(200)
    .then((r: any) => r.body);

  assert.equal(updated.id, createdId);
  assert.equal(updated.label_snapshot, "Chicken Salad (updated)");
  // prisma Decimal serializes as string in JSON
  assert.equal(updated.kcal, "400");

  // 4) DELETE /meals/:id
  const del = await request(app.getHttpServer())
    .delete(`/meals/${createdId}`)
    .set(authHeader)
    .expect(200)
    .then((r: any) => r.body);

  assert.deepEqual(del, { deleted: true });

  // 5) GET again -> empty
  const listAfter = await request(app.getHttpServer())
    .get(`/meals?date=${date}`)
    .set(authHeader)
    .expect(200)
    .then((r: any) => r.body);

  assert.ok(Array.isArray(listAfter));
  assert.equal(listAfter.length, 0);
});
