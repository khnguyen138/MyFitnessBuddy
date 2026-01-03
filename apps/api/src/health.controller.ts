import { Controller, Get, Inject } from "@nestjs/common";
import { PrismaService } from "./prisma/index.js";

@Controller("health")
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return { ok: true };
  }

  @Get("db")
  async getDbHealth() {
    const res = await this.prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
    return { ok: true, db: res[0]?.ok === 1 };
  }
}
