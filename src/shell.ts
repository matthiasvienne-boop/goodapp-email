// HTML email shell. Extracted from Veynoris' `baseLayout()`, which was
// byte-identical across apps/api/src/lib/case-notifications.ts and
// apps/api/src/lib/support-notifications.ts except for the footer sentence —
// confirmed by direct comparison before extracting, not assumed.
//
// Deliberately NOT used to replace apps/api/src/lib/onboarding-emails.ts's
// `emailWrapper()` (different title font-size, different footer markup
// including a link, different footer container styling) or
// apps/api/src/lib/email.ts's 10 inline shells (no existing duplication
// between them to justify collapsing) — those stay as-is. See
// goodapp_online/docs/DECISIONS.md for the reasoning.
export interface EmailShellOptions {
  appName: string;
  title: string;
  body: string;
  footerText: string;
  headerColor?: string;
  /**
   * Breedte van de kaart in pixels. Standaard 560.
   *
   * Toegevoegd voor de Founder Daily (FOS-73), een intern rapport met tabellen
   * erin dat op 560 pixels lang en smal wordt. Klantmails blijven op 560: daar
   * is smal juist goed, en breder leest slecht op een telefoon.
   *
   * Een getal en geen percentage, met opzet. Outlook rekent een percentage
   * binnen een geneste tabel niet betrouwbaar uit, en dit ís een geneste tabel.
   */
  breedte?: number;
}

export function renderEmailShell(options: EmailShellOptions): string {
  const headerColor = options.headerColor ?? "#4f46e5";
  // 560 blijft de standaard omdat deze shell ooit byte-voor-byte geverifieerd
  // is tegen de layoutfuncties die hij verving (zie RELEASE.md). Elke aanroep
  // zonder breedte hoort dus exact dezelfde HTML te geven als voorheen.
  const breedte = options.breedte ?? 560;
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="${breedte}" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:${headerColor};padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">${options.appName}</p>
          <p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">${options.title}</p>
        </td></tr>
        <tr><td style="padding:32px;">${options.body}</td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">${options.footerText}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
