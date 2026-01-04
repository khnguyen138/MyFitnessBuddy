import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ClerkAuthGuard } from "./auth.guard.js";

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
  exports: [],
})
export class AuthModule {}
