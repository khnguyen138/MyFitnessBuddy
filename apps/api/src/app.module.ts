import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/index.js";
import { PrismaModule } from "./prisma/index.js";
import { HealthController } from "./health.controller.js";
import { MeController } from "./me.controller.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [HealthController, MeController],
})
export class AppModule {}
