"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64Url = parts[1] ?? "";
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function TokenViewer() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isLoaded) return;
      if (!isSignedIn) return;

      try {
        const t = await getToken({ skipCache: true });
        if (cancelled) return;

        const nextToken = t ?? "";
        setToken(nextToken);

        const payload = decodeJwtPayload(nextToken);
        const exp = typeof payload?.exp === "number" ? payload.exp : null;
        setExpiresAt(exp);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }

    run();
    const interval = setInterval(run, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded) return <div>Loading auth…</div>;
  if (!isSignedIn) return <div>Sign in first, then refresh.</div>;
  if (error) return <pre>Token error: {error}</pre>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p>
        Copy this token and use it as{" "}
        <code>Authorization: Bearer &lt;token&gt;</code> when calling your API.
      </p>
      <p style={{ fontFamily: "monospace", opacity: 0.8 }}>
        {expiresAt
          ? `Expires at: ${new Date(
              expiresAt * 1000
            ).toLocaleTimeString()} (auto-refreshes every 30s)`
          : "Expires at: unknown (auto-refreshes every 30s)"}
      </p>
      <textarea
        readOnly
        value={token}
        style={{ width: "100%", minHeight: 240, fontFamily: "monospace" }}
      />
    </div>
  );
}
