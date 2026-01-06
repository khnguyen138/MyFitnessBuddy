import { BadRequestException } from "@nestjs/common";

/**
 * Parse a YYYY-MM-DD date string into a Date at UTC midnight.
 *
 * We interpret as UTC to avoid local timezone shifting the calendar day.
 * The DB column is DATE, so time-of-day is irrelevant.
 */
export function parseDateOnlyYYYYMMDD(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException("Date must be YYYY-MM-DD");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException("Invalid date");
  }
  return date;
}
