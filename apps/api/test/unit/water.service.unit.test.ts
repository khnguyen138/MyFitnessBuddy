import test from "node:test";
import assert from "node:assert/strict";

import { BadRequestException, NotFoundException } from "@nestjs/common";

import { WaterService } from "../../src/modules/water/water.service.js";

function createMockPrisma() {
  const mock = {
    water_entries: {
      findMany: async (_args: unknown) => [],
      findFirst: async (_args: unknown) => null,
      create: async (_args: unknown) => ({ id: "x" }),
      delete: async (_args: unknown) => ({ id: "x" }),
    },
  };
  return mock;
}

test("WaterService.findByDate validates date format", async () => {
  const prisma = createMockPrisma();
  const svc = new WaterService(prisma as any);

  await assert.rejects(
    () => svc.findByDate("user_1", "01-04-2026"),
    (err) => {
      assert.ok(err instanceof BadRequestException);
      return true;
    }
  );
});

test("WaterService.delete throws NotFound when entry not owned/found", async () => {
  const prisma = createMockPrisma();
  const svc = new WaterService(prisma as any);

  await assert.rejects(
    () => svc.delete("user_1", "water_1"),
    (err) => {
      assert.ok(err instanceof NotFoundException);
      return true;
    }
  );
});
