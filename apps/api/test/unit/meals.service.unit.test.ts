import test from "node:test";
import assert from "node:assert/strict";

import { BadRequestException, NotFoundException } from "@nestjs/common";

import { MealsService } from "../../src/modules/meals/meals.service.js";

function createMockPrisma() {
  const mock = {
    meal_entries: {
      findMany: async (_args: any) => [],
      findFirst: async (_args: any) => null,
      update: async (_args: any) => ({ id: "x" }),
      delete: async (_args: any) => ({ id: "x" }),
    },
    $transaction: async (fn: any) => fn(mock),
    streaks: {
      findUnique: async (_args: any) => null,
      create: async (_args: any) => ({}),
      update: async (_args: any) => ({}),
    },
    streak_credits: {
      create: async (_args: any) => ({}),
    },
  };
  return mock;
}

test("MealsService.findByDate validates date format", async () => {
  const prisma = createMockPrisma();
  const svc = new MealsService(prisma as any);

  await assert.rejects(
    () => svc.findByDate("user_1", "01-04-2026"),
    (err) => {
      assert.ok(err instanceof BadRequestException);
      return true;
    }
  );
});

test("MealsService.update throws NotFound when entry not owned/found", async () => {
  const prisma = createMockPrisma();
  const svc = new MealsService(prisma as any);

  await assert.rejects(
    () => svc.update("user_1", "meal_1", {} as any),
    (err) => {
      assert.ok(err instanceof NotFoundException);
      return true;
    }
  );
});

test("MealsService.delete throws NotFound when entry not owned/found", async () => {
  const prisma = createMockPrisma();
  const svc = new MealsService(prisma as any);

  await assert.rejects(
    () => svc.delete("user_1", "meal_1"),
    (err) => {
      assert.ok(err instanceof NotFoundException);
      return true;
    }
  );
});
