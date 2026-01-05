import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/index.js";
import { MealsController } from "./meals.controller.js";
import { MealsService } from "./meals.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
