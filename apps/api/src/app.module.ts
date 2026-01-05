import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/index.js";
import { MealsModule } from "./modules/meals/index.js";
import { PrismaModule } from "./prisma/index.js";
import { HealthController } from "./health.controller.js";
import { MeController } from "./me.controller.js";

@Module({
  imports: [AuthModule, PrismaModule, MealsModule],
  controllers: [HealthController, MeController],
})
export class AppModule {}
