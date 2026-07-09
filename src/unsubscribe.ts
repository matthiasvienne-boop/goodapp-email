// Shared helper utility. Extracted from Veynoris'
// apps/api/src/lib/email.ts `sendSurveyInvitationEmail` — the only email
// function (of 36 across both products) that sets a List-Unsubscribe
// header today. Note: matches the existing implementation exactly,
// including that it does NOT set List-Unsubscribe-Post (so this is a
// mailto/link-style header, not RFC 8058 one-click unsubscribe) — that's
// the current behavior, preserved as-is, not a design endorsement.
export function buildListUnsubscribeHeader(url: string): Record<string, string> {
  return { "List-Unsubscribe": `<${url}>` };
}
