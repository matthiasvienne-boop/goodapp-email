// Email-sending abstraction. Built new for this package (there was no
// existing shared "send" primitive to extract — both products call
// `resend.emails.send()` directly, each with its own ad hoc error handling).
//
// Deliberately NOT adopted by either product's existing send functions in
// this pass — see goodapp_online/docs/DECISIONS.md for why: Veynoris'
// email.ts propagates errors, its case-notifications.ts/support-notifications.ts
// silently swallow them, and onboarding-emails.ts catches-and-logs; forcing
// all of that onto one contract now would be a behavior change, not an
// extraction. This function is available, tested infrastructure for future
// adoption and for new email code.
//
// Never throws. Retry is opt-in (maxRetries defaults to 0 — no retry,
// matching every current call site's actual behavior today) so adopting
// this function with default options changes nothing about failure modes.
import { getResendClient } from "./client";

export interface EmailLogger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export interface SendEmailOptions {
  apiKey?: string;
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: { filename: string; content: string }[];
  /** Number of additional attempts after the first failure. Default 0 (no retry). */
  maxRetries?: number;
  /** Delay in ms between retry attempts. Default 500. */
  retryDelayMs?: number;
  logger?: EmailLogger;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const log = options.logger ?? console;
  const apiKey = options.apiKey ?? process.env.RESEND_API_KEY;

  if (!apiKey) {
    log.warn("[goodapp/email] RESEND_API_KEY ontbreekt — e-mail niet verstuurd", { to: options.to, subject: options.subject });
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  const resend = getResendClient(apiKey);
  const attempts = 1 + Math.max(0, options.maxRetries ?? 0);
  const delayMs = options.retryDelayMs ?? 500;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await resend.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        headers: options.headers,
        attachments: options.attachments,
      } as Parameters<typeof resend.emails.send>[0]);

      if (result.error) {
        lastError = result.error;
        log.error("[goodapp/email] verzenden mislukt", { to: options.to, subject: options.subject, attempt, error: result.error });
      } else {
        log.info("[goodapp/email] verzonden", { to: options.to, subject: options.subject, id: result.data?.id });
        return { ok: true, id: result.data?.id };
      }
    } catch (err) {
      lastError = err;
      log.error("[goodapp/email] verzenden mislukt", { to: options.to, subject: options.subject, attempt, error: (err as Error)?.message ?? err });
    }

    if (attempt < attempts) await sleep(delayMs);
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  return { ok: false, error: message };
}
