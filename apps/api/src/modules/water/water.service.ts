import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../prisma/index.js";
import type { CreateWaterEntryDto } from "./water.dto.js";

function parseDateOnlyYYYYMMDD(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException("Date must be YYYY-MM-DD");
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException("Invalid date");
  }
  return d;
}

@Injectable()
export class WaterService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWaterEntryDto) {
    const localDate = parseDateOnlyYYYYMMDD(dto.local_date);

    return await this.prisma.water_entries.create({
      data: {
        user_id: userId,
        local_date: localDate,
        amount_ml: dto.amount_ml,
      },
    });
  }

  async findByDate(userId: string, date: string) {
    const localDate = parseDateOnlyYYYYMMDD(date);

    return await this.prisma.water_entries.findMany({
      where: {
        user_id: userId,
        local_date: localDate,
      },
      orderBy: { logged_at: "asc" },
    });
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.water_entries.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) throw new NotFoundException("Water entry not found");

    await this.prisma.water_entries.delete({ where: { id } });
    return { deleted: true };
  }
}
