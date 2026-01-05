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

function parseInstantISO(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(
      "logged_at must be a valid ISO 8601 datetime"
    );
  }
  return d;
}

function requireValidTimeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(0));
    return timeZone;
  } catch {
    throw new BadRequestException("Invalid timezone");
  }
}

function getLocalDateFromInstant(instant: Date, timeZone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(instant);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) {
    throw new BadRequestException("Failed to compute local date");
  }
  return parseDateOnlyYYYYMMDD(`${year}-${month}-${day}`);
}

function dateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysUTC(d: Date, deltaDays: number): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + deltaDays)
  );
}

function isBeforeDayUTC(a: Date, b: Date): boolean {
  return dateKeyUTC(a) < dateKeyUTC(b);
}

@Injectable()
export class MealsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateMealEntryDto) {
    const loggedAt = parseInstantISO(dto.logged_at);

    return await this.prisma.$transaction(async (tx) => {
      const profile = await tx.profiles.upsert({
        where: { user_id: userId },
        update: { updated_at: new Date() },
        create: { user_id: userId },
        select: { timezone: true },
      });
      const timeZone = requireValidTimeZone(profile.timezone);
      const localDate = getLocalDateFromInstant(loggedAt, timeZone);
      if (dto.local_date !== undefined) {
        const requestedLocalDate = parseDateOnlyYYYYMMDD(dto.local_date);
        if (dateKeyUTC(requestedLocalDate) !== dateKeyUTC(localDate)) {
          throw new BadRequestException(
            "local_date does not match logged_at in user's timezone"
          );
        }
      }

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
          logged_at: loggedAt,
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

    const loggedAt = dto.logged_at ? parseInstantISO(dto.logged_at) : undefined;
    if (dto.local_date !== undefined && !dto.logged_at) {
      throw new BadRequestException(
        "local_date is derived; provide logged_at to change the day"
      );
    }
    const localDate = loggedAt
      ? await this.getUserLocalDateFromLoggedAt(userId, loggedAt)
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
        logged_at: loggedAt,
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
    const didCreateCredit = await this.createStreakCreditIfNeeded(
      tx,
      userId,
      localDate
    );
    if (!didCreateCredit) return;

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

    // If the user is backfilling a past date, persist the credit but do not mutate
    // the current/best streak counters (avoids expensive recomputation for MVP).
    if (
      streak.last_credited_date &&
      isBeforeDayUTC(localDate, streak.last_credited_date)
    ) {
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

  private async createStreakCreditIfNeeded(
    tx: Prisma.TransactionClient,
    userId: string,
    localDate: Date
  ): Promise<boolean> {
    try {
      await tx.streak_credits.create({
        data: {
          user_id: userId,
          local_date: localDate,
          credited_at: new Date(),
        },
      });
      return true;
    } catch (err: unknown) {
      const prismaError = err as { code?: string };
      // Unique violation (user_id, local_date) => already credited; idempotent no-op.
      if (prismaError.code === "P2002") return false;
      throw err;
    }
  }

  private async getUserLocalDateFromLoggedAt(
    userId: string,
    loggedAt: Date
  ): Promise<Date> {
    const profile = await this.prisma.profiles.findUnique({
      where: { user_id: userId },
      select: { timezone: true },
    });
    const timeZone = requireValidTimeZone(profile?.timezone ?? "UTC");
    return getLocalDateFromInstant(loggedAt, timeZone);
  }
}
