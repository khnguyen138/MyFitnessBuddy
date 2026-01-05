import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/index.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { CreateMealEntryDto, UpdateMealEntryDto } from "./meals.dto.js";

function parseDateOnlyYYYYMMDD(value: string): Date {
  // Interpret as UTC midnight to avoid local timezone shifting the date.
  // (DB column is DATE, so time-of-day is irrelevant.)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException("Date must be YYYY-MM-DD");
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException("Invalid date");
  }
  return d;
}

function dateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysUTC(d: Date, deltaDays: number): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + deltaDays)
  );
}

@Injectable()
export class MealsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateMealEntryDto) {
    const localDate = parseDateOnlyYYYYMMDD(dto.local_date);

    return await this.prisma.$transaction(async (tx) => {
      const created = await tx.meal_entries.create({
        data: {
          user_id: userId,
          local_date: localDate,
          meal: dto.meal,
          food_id: dto.food_id,
          label_snapshot: dto.label_snapshot,
          serving_quantity: dto.serving_quantity,
          serving_unit: dto.serving_unit,
          kcal: dto.kcal,
          protein_g: dto.protein_g,
          carbs_g: dto.carbs_g,
          fat_g: dto.fat_g,
        },
      });

      await this.creditStreakIfNeeded(tx, userId, localDate);
      return created;
    });
  }

  async findByDate(userId: string, date: string) {
    const localDate = parseDateOnlyYYYYMMDD(date);

    return await this.prisma.meal_entries.findMany({
      where: {
        user_id: userId,
        local_date: localDate,
      },
      orderBy: { logged_at: "asc" },
    });
  }

  async update(userId: string, id: string, dto: UpdateMealEntryDto) {
    const existing = await this.prisma.meal_entries.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) throw new NotFoundException("Meal entry not found");

    const localDate =
      dto.local_date !== undefined
        ? parseDateOnlyYYYYMMDD(dto.local_date)
        : undefined;

    return await this.prisma.meal_entries.update({
      where: { id },
      data: {
        local_date: localDate,
        meal: dto.meal,
        food_id: dto.food_id,
        label_snapshot: dto.label_snapshot,
        serving_quantity: dto.serving_quantity,
        serving_unit: dto.serving_unit,
        kcal: dto.kcal,
        protein_g: dto.protein_g,
        carbs_g: dto.carbs_g,
        fat_g: dto.fat_g,
        updated_at: new Date(),
      },
    });
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.meal_entries.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) throw new NotFoundException("Meal entry not found");

    await this.prisma.meal_entries.delete({ where: { id } });
    return { deleted: true };
  }

  private async creditStreakIfNeeded(
    tx: Prisma.TransactionClient,
    userId: string,
    localDate: Date
  ) {
    const streak = await tx.streaks.findUnique({ where: { user_id: userId } });

    // First ever streak record
    if (!streak) {
      await tx.streaks.create({
        data: {
          user_id: userId,
          current_streak: 1,
          best_streak: 1,
          last_credited_date: localDate,
          updated_at: new Date(),
        },
      });
      return;
    }

    // Only credit once per calendar day (based on the request's `local_date`)
    const todayKey = dateKeyUTC(localDate);
    const lastKey = streak.last_credited_date
      ? dateKeyUTC(streak.last_credited_date)
      : null;
    if (lastKey === todayKey) return;

    const yesterdayKey = dateKeyUTC(addDaysUTC(localDate, -1));
    const newCurrent = lastKey === yesterdayKey ? streak.current_streak + 1 : 1;
    const newBest = Math.max(streak.best_streak ?? 0, newCurrent);

    await tx.streaks.update({
      where: { user_id: userId },
      data: {
        current_streak: newCurrent,
        best_streak: newBest,
        last_credited_date: localDate,
        updated_at: new Date(),
      },
    });
  }
}
