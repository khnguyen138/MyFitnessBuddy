import { UnauthorizedException } from "@nestjs/common";

/**
 * Ensure a request has an authenticated user id.
 */
export function requireUserId(userId: string | undefined): string {
  if (!userId) throw new UnauthorizedException();
  return userId;
}
