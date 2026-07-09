// Base template component. Extracted from Veynoris'
// apps/api/src/lib/onboarding-emails.ts `ctaButton()` — the only existing
// implementation (used by that file's 5 onboarding functions), generalized
// only to make the color configurable instead of hardcoding it, matching
// the same default @goodapp/email/shell uses.
export interface CtaButtonOptions {
  label: string;
  href: string;
  color?: string;
}

export function ctaButton(options: CtaButtonOptions): string {
  const color = options.color ?? "#4f46e5";
  return `<a href="${options.href}" style="display:inline-block;background:${color};color:#ffffff;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">${options.label} →</a>`;
}
