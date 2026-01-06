import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AuthModule } from "./auth/index.js";
import { DiaryModule } from "./modules/diary/diary.module.js";
import { MealsModule } from "./modules/meals/meals.module.js";
import { WaterModule } from "./modules/water/water.module.js";
import { PrismaModule } from "./prisma/index.js";
import { HealthController } from "./health.controller.js";
import { MeController } from "./me.controller.js";
import { RateLimitGuard } from "./core/rate-limit.guard.js";
import { RequestLoggingInterceptor } from "./core/request-logging.interceptor.js";

@Module({
  imports: [AuthModule, PrismaModule, MealsModule, WaterModule, DiaryModule],
  controllers: [HealthController, MeController],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule {}
