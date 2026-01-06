import test from "node:test";
import assert from "node:assert/strict";

import { BadRequestException } from "@nestjs/common";

import { DiaryService } from "../../src/modules/diary/diary.service.js";

function createMockPrisma() {
  const mock = {
    meal_entries: { findMany: async (_args: unknown) => [] },
    water_entries: { findMany: async (_args: unknown) => [] },
    goals: { findUnique: async (_args: unknown) => null },
    streaks: { findUnique: async (_args: unknown) => null },
  };
  return mock;
}

test("DiaryService.getDiaryForDate validates date format", async () => {
  const prisma = createMockPrisma();
  const svc = new DiaryService(prisma as any);

  await assert.rejects(
    () => svc.getDiaryForDate("user_1", "01-04-2026"),
    (err) => {
      assert.ok(err instanceof BadRequestException);
      return true;
    }
  );
});
