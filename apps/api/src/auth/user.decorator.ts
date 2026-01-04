import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestWithAuth } from "./auth.types.js";

export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<RequestWithAuth>();
    return req.auth?.userId;
  }
);
