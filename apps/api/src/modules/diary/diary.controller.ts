import { Controller, Get, Inject, Query } from "@nestjs/common";

import { UserId } from "../../auth/index.js";
import { requireUserId } from "../../shared/http/require-user-id.js";
import { DiaryByDateQueryDto } from "./diary.dto.js";
import { DiaryService } from "./diary.service.js";

@Controller("diary")
export class DiaryController {
  constructor(@Inject(DiaryService) private readonly diary: DiaryService) {}

  @Get()
  getDiaryForDate(
    @UserId() userId: string | undefined,
    @Query() query: DiaryByDateQueryDto
  ) {
    return this.diary.getDiaryForDate(requireUserId(userId), query.date);
  }

  @Get("test")
  getSmokeTest(@UserId() userId: string | undefined) {
    requireUserId(userId);
    return { ok: true };
  }
}
