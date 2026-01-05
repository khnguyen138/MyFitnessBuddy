import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/index.js";
import { WaterController } from "./water.controller.js";
import { WaterService } from "./water.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [WaterController],
  providers: [WaterService],
  exports: [WaterService],
})
export class WaterModule {}
