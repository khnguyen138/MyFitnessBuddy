import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Inject,
  Patch,
  UnauthorizedException,
} from "@nestjs/common";
import { IsString } from "class-validator";
import { UserId } from "./auth/index.js";
import { PrismaService } from "./prisma/index.js";

class UpdateTimezoneDto {
  @IsString()
  timezone!: string;
}

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new UnauthorizedException();
  return userId;
}

function requireValidTimeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(0));
    return timeZone;
  } catch {
    throw new BadRequestException("Invalid timezone");
  }
}

@Controller("me")
export class MeController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  getMe(@UserId() userId: string | undefined) {
    return { userId };
  }

  @Patch("timezone")
  async updateTimezone(
    @UserId() userId: string | undefined,
    @Body() dto: UpdateTimezoneDto
  ) {
    const actualUserId = requireUserId(userId);
    const timeZone = requireValidTimeZone(dto.timezone);
    const updated = await this.prisma.profiles.upsert({
      where: { user_id: actualUserId },
      update: { timezone: timeZone, updated_at: new Date() },
      create: { user_id: actualUserId, timezone: timeZone },
      select: { user_id: true, timezone: true, updated_at: true },
    });
    return { user_id: updated.user_id, timezone: updated.timezone };
  }
}
