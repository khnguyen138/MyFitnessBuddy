import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { UserId } from "../../auth/index.js";
import { requireUserId } from "../../shared/http/require-user-id.js";
import {
  CreateMealEntryDto,
  MealsByDateQueryDto,
  UpdateMealEntryDto,
} from "./meals.dto.js";
import { MealsService } from "./meals.service.js";

@Controller("meals")
export class MealsController {
  constructor(@Inject(MealsService) private readonly meals: MealsService) {}

  @Post()
  create(
    @UserId() userId: string | undefined,
    @Body() dto: CreateMealEntryDto
  ) {
    return this.meals.create(requireUserId(userId), dto);
  }

  @Get()
  findByDate(
    @UserId() userId: string | undefined,
    @Query() query: MealsByDateQueryDto
  ) {
    return this.meals.findByDate(requireUserId(userId), query.date);
  }

  @Patch(":id")
  update(
    @UserId() userId: string | undefined,
    @Param("id") id: string,
    @Body() dto: UpdateMealEntryDto
  ) {
    return this.meals.update(requireUserId(userId), id, dto);
  }

  @Delete(":id")
  delete(@UserId() userId: string | undefined, @Param("id") id: string) {
    return this.meals.delete(requireUserId(userId), id);
  }
}
