import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/index.js";
import { DiaryController } from "./diary.controller.js";
import { DiaryService } from "./diary.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}
