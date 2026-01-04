import { Controller, Get } from "@nestjs/common";
import { UserId } from "./auth/index.js";

@Controller("me")
export class MeController {
  @Get()
  getMe(@UserId() userId: string | undefined) {
    return { userId };
  }
}
