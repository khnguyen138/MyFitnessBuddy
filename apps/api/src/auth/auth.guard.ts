import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyToken } from "@clerk/backend";
import { IS_PUBLIC_KEY } from "./auth.constants.js";
import type { RequestWithAuth } from "./auth.types.js";

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const klass = context.getClass();
    const isPublic =
      Reflect.getMetadata?.(IS_PUBLIC_KEY, handler) ??
      Reflect.getMetadata?.(IS_PUBLIC_KEY, klass);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<RequestWithAuth>();

    // Test-only bypass (E2E): lets automated tests run without a real Clerk JWT.
    // Enable by setting AUTH_BYPASS=true and passing x-test-user-id header.
    if (process.env.AUTH_BYPASS === "true") {
      const header = req.headers["x-test-user-id"];
      const userId = Array.isArray(header) ? header[0] : header;
      if (!userId) {
        throw new UnauthorizedException("Missing x-test-user-id header");
      }
      req.auth = { userId, claims: {} as any };
      return true;
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader)
      throw new UnauthorizedException("Missing Authorization header");

    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const [type, token] = (headerValue ?? "").split(" ");
    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException(
        "Authorization header must be: Bearer <token>"
      );
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new Error("CLERK_SECRET_KEY is missing");

    let claims: unknown;
    try {
      claims = await verifyToken(token, { secretKey });
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const userId = (claims as any).sub as string | undefined; // Clerk userId is typically in `sub`
    if (!userId) throw new UnauthorizedException("Invalid token (missing sub)");

    req.auth = { userId, claims: claims as any };
    return true;
  }
}
