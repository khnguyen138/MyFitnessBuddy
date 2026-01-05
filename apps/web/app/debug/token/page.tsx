import { TokenViewer } from "./TokenViewer";

export default function DebugTokenPage() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>Debug: Clerk Token</h1>
      <TokenViewer />
    </main>
  );
}
