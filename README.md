# @goodapp/email

Shared Resend client singleton, an email-sending abstraction, and HTML layout helpers for GoodApp products. Second official GoodApp Platform package, built following the process and template established by [`@goodapp/observability`](https://github.com/matthiasvienne-boop/goodapp-observability).

**Status: Draft.** Built, locally validated (byte-for-byte fidelity against the original source it was extracted from), locally integrated into both Veynoris and BeleggersApp via minimal client-construction swaps — not yet published to GitHub, not yet consumed in production. See [GoodApp OS's PACKAGE-STANDARD.md](../goodapp_online/docs/PACKAGE-STANDARD.md) for the platform-wide standard this follows, and [SHARED-COMPONENTS.md](../goodapp_online/docs/SHARED-COMPONENTS.md) for the full audit and integration record.

## What's in it

Backend-only (email sending is server-side in both current consumers) — a single export surface, no subpath split needed, CJS-only build (both consumers compile via plain `tsc`/CommonJS, neither has a browser consumer for this package).

```ts
import {
  getResendClient,           // lazy singleton — construct once, cache, reuse
  sendEmail,                 // higher-level send abstraction: never throws, optional retry, optional logger
  renderEmailShell,          // HTML layout wrapper, extracted from a 2x-duplicated pattern
  ctaButton,                 // HTML button component
  buildListUnsubscribeHeader,// List-Unsubscribe header builder
} from "@goodapp/email";
```

### `getResendClient(apiKey: string): Resend`

The one thing genuinely identical across all 6 places both products constructed a Resend client: lazy singleton, construct once, reuse. Deliberately does **not** decide what happens when no key is available — Veynoris falls back to a placeholder string (never null), BeleggersApp returns null and logs a warning. Those are two different, each-legitimate behaviors; the decision stays with the caller.

### `sendEmail(options): Promise<{ok, id?, error?}>`

A complete send abstraction — never throws, optional `logger` (any object with `info`/`warn`/`error`), optional `maxRetries`/`retryDelayMs` (both default to no retry, matching every current call site's actual behavior). **Not yet adopted by either product's existing 36 email-sending functions** — those have three different, mutually-inconsistent error-handling behaviors today (propagate / silently swallow / catch-and-log), and migrating all of them onto one contract in this pass would have been a behavior change, not an extraction. This function is available, tested infrastructure for new code and future adoption.

### `renderEmailShell(options): string`

Extracted from Veynoris' `baseLayout()`, confirmed byte-identical across `case-notifications.ts` and `support-notifications.ts` (differing only in the footer sentence) before extracting — verified with an exact string-equality test, not assumed. **Deliberately not** used to replace `onboarding-emails.ts`'s `emailWrapper()` (different title font size, different footer markup with a link, different footer container styling) or `email.ts`'s 10 inline shells (no existing duplication between them to justify collapsing). See [DECISIONS.md](../goodapp_online/docs/DECISIONS.md).

### `ctaButton(options): string`

Extracted from `onboarding-emails.ts`'s only usage, generalized to make the color configurable.

### `buildListUnsubscribeHeader(url): Record<string,string>`

Extracted from the one email function (of 36 across both products) that sets a `List-Unsubscribe` header today. Matches the existing implementation exactly — including that it does not set `List-Unsubscribe-Post`, so it's a link-style header, not RFC 8058 one-click unsubscribe. That's the current behavior, preserved as-is.

## What's deliberately *not* in it

- **All 36 individual email-sending functions** (23 in Veynoris, 13 in BeleggersApp) — subject lines, HTML/text bodies, business vocabulary (role labels, plan labels, case priorities, ticket statuses). Pure product copy, stays in each product per [PACKAGE-STANDARD.md](../goodapp_online/docs/PACKAGE-STANDARD.md) chapter 15.
- **Retry logic beyond the opt-in `maxRetries` on `sendEmail()`** — neither product had retry logic to extract; nothing was force-added to existing call sites.
- **Rate limiting** — both products only rate-limit at the Express route layer (generic anti-abuse), not email-specific; that stays in each product's routes.
- **Webhook/inbound bounce-and-complaint handling** — Veynoris' `webhooks-resend.ts` is tightly coupled to its own Prisma models (`SurveyInvitation`, `Contact`); BeleggersApp has none. Considered for this package, deferred — see [DECISIONS.md](../goodapp_online/docs/DECISIONS.md).
- **Attachment generation** — BeleggersApp's `backupService.ts` generates a `pg_dump`/gzip attachment; that generation logic is backup-specific business logic and stays local. `sendEmail()`'s options structurally accept an `attachments` passthrough (zero business logic, just an options field), but nothing currently uses it.
- **Branding values** (app name, colors, footer boilerplate) — inherently product-specific, passed as parameters, never hardcoded in the package.

## Install

Same pattern as `@goodapp/observability`:

```json
"@goodapp/email": "file:/Users/matthiasvienne/goodapp-email"
```
locally, or once published:
```json
"@goodapp/email": "github:matthiasvienne-boop/goodapp-email#<resolved-commit-sha>"
```

**Known local-testing gotcha, worth remembering for every future package:** if you `npm install` inside this package's own directory (to build/test it standalone), it gets its own nested `node_modules/resend`. If a consumer then links to this repo via `file:`, TypeScript can see *two* different `Resend` class declarations (this package's copy vs. the consumer's own) and refuses to treat them as the same type — `resend`'s `Resend` class has private members, so TypeScript uses nominal (not structural) typing for it. This is a `file:`-testing-only artifact: a real git-dependency install only ships `dist/` (per `"files": ["dist"]`), so the nested `node_modules` never reaches the consumer, and the conflict disappears. Confirmed by deleting this package's local `node_modules` and re-running both consumers' typecheck — clean in both cases. If you hit this while testing another package via `file:`, remove that package's own `node_modules` before typechecking, and reinstall it before you need to rebuild the package itself.

## Compatibility

Node ≥ 20, TypeScript ≥ 5.4, `module:"commonjs"`/node10 resolution (both current consumers' exact setup) — no ESM build, no browser consumer exists for this package today. `resend >=6.12.0` peer dependency (Veynoris uses `^6.12.4`, BeleggersApp `^6.12.2`, both compatible).

## License

[MIT](./LICENSE) — same reasoning as `@goodapp/observability`: this package is, and must remain, generic infrastructure with no business logic.
