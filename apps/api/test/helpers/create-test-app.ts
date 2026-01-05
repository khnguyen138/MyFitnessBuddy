import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";

// NOTE: imports in this repo use `.js` specifiers; tsx will resolve them to TS sources at runtime.
import { AppModule } from "../../src/app.module.js";

export async function createTestApp(opts?: { userId?: string }) {
  const userId = opts?.userId ?? `test_user_${crypto.randomUUID()}`;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();
  return { app, moduleRef, userId };
}
