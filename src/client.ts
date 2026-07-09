// Shared Resend client singleton.
//
// Extracted from a pattern independently duplicated 6 times across Veynoris
// (apps/api/src/lib/{email,onboarding-emails,case-notifications,support-notifications}.ts)
// and BeleggersApp (server/src/services/{email,backupService}.ts) — each file
// declared its own `let _resend: Resend | null; function getResend() { ... }`.
//
// Deliberately minimal: this does NOT decide what happens when no API key is
// available — Veynoris falls back to a placeholder string (never null),
// BeleggersApp returns null and logs a warning. Those are two different,
// each-legitimate behaviors, so the decision stays with the caller. This
// function only owns the one thing that was genuinely identical everywhere:
// construct once, cache, reuse.
import { Resend } from "resend";

let _client: Resend | null = null;

export function getResendClient(apiKey: string): Resend {
  if (!_client) _client = new Resend(apiKey);
  return _client;
}
