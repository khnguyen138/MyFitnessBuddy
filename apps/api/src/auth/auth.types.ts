export type ClerkAuth = {
  userId: string;
  claims: Record<string, unknown>;
};

export type RequestWithAuth = {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
  originalUrl?: string;
  ip?: string;
  socket?: { remoteAddress?: string | undefined };
  auth?: ClerkAuth;
};
