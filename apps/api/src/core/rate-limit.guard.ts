import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { RequestWithAuth } from "../auth/auth.types.js";

interface RateLimitState {
  readonly windowStartMs: number;
  readonly count: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;

function getClientIp(req: RequestWithAuth): string {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = forwardedValue?.split(",")[0]?.trim();
  return ip || req.ip || req.socket?.remoteAddress || "unknown";
}

function getRateLimitKey(req: RequestWithAuth): string {
  const testHeader = req.headers["x-test-user-id"];
  const testUserId = Array.isArray(testHeader) ? testHeader[0] : testHeader;
  const userId = req.auth?.userId ?? testUserId;
  if (userId) return `user:${userId}`;
  return `ip:${getClientIp(req)}`;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly states = new Map<string, RateLimitState>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const key = getRateLimitKey(req);
    const nowMs = Date.now();
    const state = this.states.get(key);
    if (!state || nowMs - state.windowStartMs >= WINDOW_MS) {
      this.states.set(key, { windowStartMs: nowMs, count: 1 });
      return true;
    }
    if (state.count >= MAX_REQUESTS_PER_WINDOW) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((WINDOW_MS - (nowMs - state.windowStartMs)) / 1000)
      );
      throw new HttpException(
        {
          message: "Rate limit exceeded",
          retry_after_seconds: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    this.states.set(key, {
      windowStartMs: state.windowStartMs,
      count: state.count + 1,
    });
    return true;
  }
}
