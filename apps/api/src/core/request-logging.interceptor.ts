import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import type { RequestWithAuth } from "../auth/auth.types.js";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const res = context.switchToHttp().getResponse<{ statusCode?: number }>();
    const startedAtMs = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAtMs;
          const userId = req.auth?.userId;
          const method = (req.method ?? "UNKNOWN").toUpperCase();
          const url = req.originalUrl ?? req.url ?? "";
          const statusCode = res.statusCode ?? 0;
          this.logger.log(
            JSON.stringify({
              method,
              url,
              statusCode,
              durationMs,
              userId,
            })
          );
        },
      })
    );
  }
}


