import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

async function bootstrap() {
  // In ESM, static imports can run before `reflect-metadata` is initialized.
  // Dynamic import ensures metadata is available before loading decorated classes.
  const { AppModule } = await import("./app.module.js");

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

bootstrap();
