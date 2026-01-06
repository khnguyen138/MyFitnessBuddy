import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from "@nestjs/common";

import { UserId } from "../../auth/index.js";
import { requireUserId } from "../../shared/http/require-user-id.js";
import { CreateWaterEntryDto, WaterByDateQueryDto } from "./water.dto.js";
import { WaterService } from "./water.service.js";

@Controller("water")
export class WaterController {
  constructor(@Inject(WaterService) private readonly water: WaterService) {}

  @Post()
  create(
    @UserId() userId: string | undefined,
    @Body() dto: CreateWaterEntryDto
  ) {
    return this.water.create(requireUserId(userId), dto);
  }

  @Get()
  findByDate(
    @UserId() userId: string | undefined,
    @Query() query: WaterByDateQueryDto
  ) {
    return this.water.findByDate(requireUserId(userId), query.date);
  }

  @Delete(":id")
  delete(@UserId() userId: string | undefined, @Param("id") id: string) {
    return this.water.delete(requireUserId(userId), id);
  }
}
