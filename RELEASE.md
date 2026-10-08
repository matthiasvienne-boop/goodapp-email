# Release Guide — `@goodapp/email`

Second official GoodApp Platform package. Follows the template and process established by [`@goodapp/observability`](https://github.com/matthiasvienne-boop/goodapp-observability)'s own `RELEASE.md` — this document updates that template with what changed for a second package, and stays the reference for the third.

## Why this package exists

Veynoris and BeleggersApp each independently built a Resend client wrapper — six times total across six files, each a lazy-singleton (or, in BeleggersApp's case, a non-singleton) construction of the same shape, reading the same `RESEND_API_KEY` env var. Veynoris additionally duplicated one HTML layout shell three times, two of which turned out to be byte-identical except for one sentence. This package exists to collapse exactly that proven duplication — nothing more. The audit that produced it explicitly corrected an earlier, wrong assumption ("both products use the same table-based HTML approach") by reading the actual source: Veynoris is HTML-only, BeleggersApp is text-only, and most of the 17 audited categories had no real overlap to extract. See `goodapp_online/docs/SHARED-COMPONENTS.md` for the full audit.

## Public API

Single export surface — no subpath split, unlike `@goodapp/observability`. Email sending is backend-only for both current consumers, so there's no client/server distinction to make; the package is CJS-only (both consumers compile via plain `tsc`, no browser consumer exists).

- `getResendClient(apiKey: string): Resend` — lazy singleton, extracted from a pattern duplicated 6 times.
- `sendEmail(options): Promise<{ok, id?, error?}>` — new send abstraction, never throws, optional retry (default: off, matching every current call site), optional logger. Built to satisfy the package's design brief; not yet adopted by either product's existing 36 send functions (see `DECISIONS.md` in `goodapp_online/docs/` for why — the existing functions have three mutually-inconsistent error-handling behaviors, and migrating them onto one contract would have been a behavior change).
- `renderEmailShell(options): string` — HTML layout wrapper. Verified byte-identical, via exact string comparison against the original source, to two of Veynoris' three duplicated layout functions before extraction. The third (`onboarding-emails.ts`'s `emailWrapper`) was deliberately left alone — real structural differences (different title font size, different footer markup with a link), not just untested laziness.
- `ctaButton(options): string` — HTML button, extracted from its one existing usage.
- `buildListUnsubscribeHeader(url): Record<string,string>` — extracted from the one email function (of 36) that sets this header today.

Full usage examples: `README.md`.

## Semantic versioning policy

Identical to `@goodapp/observability`'s policy — see that package's `RELEASE.md` for the full text. Summary: strict SemVer, pre-1.0 breaking changes allowed freely, production consumers always pin to a resolved commit SHA rather than a tag.

## Backwards compatibility policy

Same as `@goodapp/observability`. One thing specific to this package worth stating explicitly: `sendEmail()`'s default behavior (no retry, `console` as the default logger if none is injected) must never change without a major version bump — a consumer who adopts it today with default options is trusting that silence.

## Release checklist

Follows `@goodapp/observability`'s checklist exactly, with one addition learned building this package:

1. From a clean state (`rm -rf node_modules dist && npm install`), confirm the build succeeds.
2. **Before typechecking any consumer via a `file:` link, remove this package's own `node_modules`.** `resend` has private class members, so TypeScript uses nominal typing for it — if this package has its own installed copy (needed to build itself) and a consumer has a separate copy, TypeScript sees two different `Resend` classes and refuses to treat them as compatible. This is a `file:`-testing-only artifact (confirmed by testing): a real git-dependency install only ships `dist/` per the `files` field, so the nested `node_modules` never reaches a real consumer. But during local `file:`-based validation, it produces a real, confusing type error unless you remove it first.
3. Bump `version`, commit, tag `vX.Y.Z`, push — tag pointer is never force-moved, ever, once pushed.
4. Fresh scratch-project validation against the real git dependency, in an isolated directory — proves the exact mechanism a Docker `npm ci` will exercise, including that the consumer supplies its own `resend` peer dependency correctly (this package does not bundle it).
5. Pin one consumer at a time to the resolved commit SHA, regenerate its lockfile, re-run its own typecheck/build/smoke validation.
6. Deploy one consumer at a time, never both on the first rollout of a new version.

## Rollback checklist

Identical to `@goodapp/observability`: change the pinned SHA back, reinstall, redeploy. Nothing to do in this repository.

## How future GoodApp packages should be created

Everything in `@goodapp/observability`'s `RELEASE.md` still applies. Two additions from building this second package:

1. **Verify duplication byte-for-byte before extracting a shared template/layout function**, not just "looks similar." Two of Veynoris' three layout functions were extractable because a direct string comparison proved them identical except one sentence; the third had real differences that would have been silently lost (or the shared function bloated with unnecessary parameters) if extraction had gone ahead on a "looks close enough" read. Write the comparison as an actual test — string equality against the original source, run before any production file is touched — not a visual skim.
2. **A package with a class-typed dependency (anything with private members, not just interfaces) needs its own `node_modules` removed before a consumer typechecks it via `file:`.** This isn't specific to `resend` — any dependency shaped like this will hit the same nominal-typing conflict during local `file:` testing. Document it in the package's own README so the next person (or agent) doesn't have to rediscover it.

## 0.2.0 — breedte op `renderEmailShell`

`EmailShellOptions.breedte?: number`, standaard 560. Toegevoegd voor de Founder
Daily (FOS-73): een intern rapport met tabellen erin dat op 560 pixels lang en
smal wordt. Klantmails blijven op 560 — daar is smal juist goed.

Een getal en geen percentage: Outlook rekent percentages binnen een geneste
tabel niet betrouwbaar uit, en dit ís een geneste tabel.

**Niet-brekend, en dat is hier getoetst in plaats van beloofd.** Dit document
stelde dat `renderEmailShell` byte-voor-byte geverifieerd was tegen de
layoutfuncties die ze verving, maar er stond geen enkele test naast om dat vast
te houden. Die staan er nu: `test/shell.test.js`, met een snapshot van de
560-uitvoer.

Dat snapshot is er na een eigen misser. De eerste drie toetsen vergeleken twee
aanroepen met elkáár en bleven groen toen ik de padding van de kop veranderde —
ze vingen een verkeerde breedte, maar niet een wijziging die béíde raakt. Het
snapshot vangt dat wel. Wordt het rood en is de wijziging bedoeld, dan hoort het
mee te veranderen in dezelfde commit, met in de boodschap waarom elke klantmail
van drie producten er anders uit gaat zien.

## 0.3.0 — `bcc` op `sendEmail`

`SendEmailOptions.bcc?: string | string[]` (PLAT-278, aanvraag van de Stroombuddy-sessie
voor STROOM-391). Wordt doorgegeven aan `resend.emails.send()`.

**Niet-brekend.** Zonder `bcc` bevat de aanroep naar Resend geen `bcc`-sleutel: de
payload is identiek aan 0.2.0. Dat is getoetst (`test/send-bcc.test.js`), want de belofte
bovenaan dit document is dat `sendEmail` zonder opties nooit van gedrag verandert.

**Het `bcc`-adres wordt niet gelogd**, ook niet bij een mislukte poging, en een retry stuurt
het opnieuw mee. Wie `bcc` gebruikt om een kopie naar zichzelf te sturen, moet het adres
dus niet óók in `to` zetten: dan ziet de ontvanger het.

`npm test` draaide `node --test test/`, en een map als argument werkt niet meer op Node 24
(het pakket pint Node 20). Het script noemt nu `test/*.test.js`.

Consumenten pinnen op de commit-SHA na de merge; zie de releasechecklist hierboven.
