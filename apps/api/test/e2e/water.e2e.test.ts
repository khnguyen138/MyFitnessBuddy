import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { PrismaService } from "../../src/prisma/index.js";
import { createTestApp } from "../helpers/create-test-app.js";

test("Water API E2E workflow: POST -> GET -> DELETE", async (t) => {
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

  // Ensure FK requirements are satisfied (water_entries.user_id -> profiles.user_id)
  await prisma.profiles.upsert({
    where: { user_id: userId },
    update: {},
    create: { user_id: userId },
  });

  t.after(async () => {
    await prisma.water_entries.deleteMany({ where: { user_id: userId } });
    await prisma.streaks.deleteMany({ where: { user_id: userId } });
    await prisma.goals.deleteMany({ where: { user_id: userId } });
    await prisma.profiles.deleteMany({ where: { user_id: userId } });
    await app.close();
    if (prevBypass === undefined) delete process.env.AUTH_BYPASS;
    else process.env.AUTH_BYPASS = prevBypass;
  });

  const created = await request(app.getHttpServer())
    .post("/water")
    .set(authHeader)
    .send({ local_date: date, amount_ml: 250 })
    .expect(201)
    .then((r: any) => r.body);

  assert.equal(created.user_id, userId);
  assert.equal(created.amount_ml, 250);
  assert.ok(created.id);
  const createdId = created.id as string;

  const list = await request(app.getHttpServer())
    .get(`/water?date=${date}`)
    .set(authHeader)
    .expect(200)
    .then((r: any) => r.body);

  assert.ok(Array.isArray(list));
  assert.equal(list.length, 1);
  assert.equal(list[0].id, createdId);

  const del = await request(app.getHttpServer())
    .delete(`/water/${createdId}`)
    .set(authHeader)
    .expect(200)
    .then((r: any) => r.body);

  assert.deepEqual(del, { deleted: true });

  const listAfter = await request(app.getHttpServer())
    .get(`/water?date=${date}`)
    .set(authHeader)
    .expect(200)
    .then((r: any) => r.body);

  assert.ok(Array.isArray(listAfter));
  assert.equal(listAfter.length, 0);
});


