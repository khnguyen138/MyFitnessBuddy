export interface FetchWithTimeoutInput {
  readonly url: string;
  readonly init?: RequestInit;
  readonly timeoutMs: number;
}

export const executeFetchWithTimeout = async (
  input: FetchWithTimeoutInput
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    return await fetch(input.url, { ...input.init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};


