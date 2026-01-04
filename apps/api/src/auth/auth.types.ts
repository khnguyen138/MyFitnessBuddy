export type ClerkAuth = {
  userId: string;
  claims: Record<string, unknown>;
};

export type RequestWithAuth = {
  headers: Record<string, string | string[] | undefined>;
  auth?: ClerkAuth;
};
