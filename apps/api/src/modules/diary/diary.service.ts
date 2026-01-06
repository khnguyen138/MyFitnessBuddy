import { Injectable, Inject } from "@nestjs/common";

import { PrismaService } from "../../prisma/index.js";
import { parseDateOnlyYYYYMMDD } from "../../shared/date/parse-date-only-yyyy-mm-dd.js";
import type {
  goals as GoalsRow,
  meal_entries as MealEntryRow,
  streaks as StreakRow,
  water_entries as WaterEntryRow,
} from "../../generated/prisma/client.js";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

interface DiaryMeals {
  readonly breakfast: readonly MealEntryRow[];
  readonly lunch: readonly MealEntryRow[];
  readonly dinner: readonly MealEntryRow[];
  readonly snack: readonly MealEntryRow[];
}

interface DiaryTotals {
  readonly kcal: number;
  readonly protein_g: number;
  readonly carbs_g: number;
  readonly fat_g: number;
}

interface DiaryWater {
  readonly total_ml: number;
  readonly goal_ml: number | null;
  readonly entries: readonly WaterEntryRow[];
}

interface DiaryStreak {
  readonly current: number;
  readonly best: number;
}

interface DiaryGoals {
  readonly calorie_goal: number | null;
  readonly water_goal_ml: number | null;
}

interface DiaryForDate {
  readonly date: string;
  readonly meals: DiaryMeals;
  readonly totals: DiaryTotals;
  readonly water: DiaryWater;
  readonly streak: DiaryStreak;
  readonly goals: DiaryGoals;
}

function isMealType(value: string): value is MealType {
  return (MEAL_TYPES as readonly string[]).includes(value);
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && "toString" in value)
    return Number(String(value));
  return Number(value);
}

@Injectable()
export class DiaryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getDiaryForDate(userId: string, date: string): Promise<DiaryForDate> {
    const localDate = parseDateOnlyYYYYMMDD(date);

    const [mealEntries, waterEntries, goals, streak] = await Promise.all([
      this.prisma.meal_entries.findMany({
        where: { user_id: userId, local_date: localDate },
        orderBy: { logged_at: "asc" },
      }),
      this.prisma.water_entries.findMany({
        where: { user_id: userId, local_date: localDate },
        orderBy: { logged_at: "asc" },
      }),
      this.prisma.goals.findUnique({ where: { user_id: userId } }),
      this.prisma.streaks.findUnique({ where: { user_id: userId } }),
    ]);

    const meals = this.groupMealsByType(mealEntries);
    const totals = this.calculateMealTotals(mealEntries);
    const water = this.buildWaterSection({ waterEntries, goals });
    const responseStreak = this.buildStreakSection(streak);

    return {
      date,
      meals,
      totals,
      water,
      streak: responseStreak,
      goals: {
        calorie_goal: goals?.calorie_goal ?? null,
        water_goal_ml: goals?.water_goal_ml ?? null,
      },
    };
  }

  private groupMealsByType(mealEntries: readonly MealEntryRow[]): DiaryMeals {
    const mealsByType: Record<MealType, MealEntryRow[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const entry of mealEntries) {
      if (isMealType(entry.meal)) mealsByType[entry.meal].push(entry);
    }
    return mealsByType;
  }

  private calculateMealTotals(
    mealEntries: readonly MealEntryRow[]
  ): DiaryTotals {
    return mealEntries.reduce<DiaryTotals>(
      (acc, entry) => {
        const kcal = toNumber(entry.kcal);
        const protein = toNumber(entry.protein_g);
        const carbs = toNumber(entry.carbs_g);
        const fat = toNumber(entry.fat_g);
        return {
          kcal: acc.kcal + kcal,
          protein_g: acc.protein_g + protein,
          carbs_g: acc.carbs_g + carbs,
          fat_g: acc.fat_g + fat,
        };
      },
      { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );
  }

  private buildWaterSection(input: {
    readonly waterEntries: readonly WaterEntryRow[];
    readonly goals: GoalsRow | null;
  }): DiaryWater {
    const totalMl = input.waterEntries.reduce(
      (acc: number, entry) => acc + entry.amount_ml,
      0
    );
    return {
      total_ml: totalMl,
      goal_ml: input.goals?.water_goal_ml ?? null,
      entries: input.waterEntries,
    };
  }

  private buildStreakSection(streak: StreakRow | null): DiaryStreak {
    return {
      current: streak?.current_streak ?? 0,
      best: streak?.best_streak ?? 0,
    };
  }
}
