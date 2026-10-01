# Assignment Compliance Checklist

Reviewed against all nine pages of `Frontend-Internship.pdf` on 2026-10-01. Status reflects the final repository, not intended future work.

## Stack and API

- **PASS** - Next.js App Router, React, TypeScript, Tailwind CSS, Redux Toolkit, and React Redux.
- **PASS** - Deterministic generator produces 5,000 tickets, including faithful assignment fixtures with unique internal IDs.
- **PASS** - List, detail, claim, status, triage, retriage, and update Route Handlers exist.
- **PASS** - Search covers subject/body; status, priority, category, AI decision, assignment, page, and page-size filters are server-side.
- **PASS** - Valid agents, status transitions, categories, priorities, reason length, and enterprise floor are enforced by Route Handlers and route-level tests.
- **PASS** - Demo latency/failures are enabled by default; tests disable randomness through `NODE_ENV=test`. Claim conflicts include an ownership re-check after latency.
- **PASS** - The updates endpoint automatically alternates new arrivals with remote claim/status activity after seven seconds; five-second polling observes an event every 5-10 seconds.

## Ticket list and SLA

- **PASS** - Required columns, filters, search, URL persistence/shareability, Redux filter mirror, loading/error/empty states, and retry are present.
- **PASS** - Search is debounced by 300 ms.
- **PASS** - SLA rules, one-second countdown, late/at-risk/on-track states, invalid dates, and future dates are handled.
- **PASS** - `TicketRow` and `Deadline` are memoized; only deadline components own one-second timer state.
- **PASS** - Uses cursor-safe incremental loading on one scrolling page. New top insertions cannot shift offsets, and loaded IDs are deduplicated.
- **PASS** - The wide table scrolls horizontally on 375 px screens and long text cannot expand the layout.

## Ticket detail and safety

- **PASS** - Required ticket/customer/AI/priority/deadline data is displayed with fallbacks.
- **PASS** - Customer and AI markup renders as text; no `dangerouslySetInnerHTML` exists.
- **PASS** - Only HTTP(S) attachments are clickable and external links use `noopener noreferrer`.
- **PASS** - Claim is optimistic, has a synchronous double-submit lock, preserves only the prior assignment for rollback, and distinguishes HTTP 409.
- **PASS** - Status UI offers only the valid next transition and has a synchronous double-submit lock; the API repeats validation.
- **PASS** - Detail polling detects remote assignment/status changes.
- **PASS** - Re-run AI calls a server Route Handler; the secret is never public. Candidate output is validated before use.
- **PASS** - The dynamic route's server layout invokes Next.js `notFound()` before the client detail screen renders.

## AI review and shared state

- **PASS** - Manual-review tickets show the required fields; accept/change actions enforce inline reason and enterprise checks.
- **PASS** - Successful review removes the item immediately and header counts are refreshed.
- **PASS** - Review queue and header totals poll every five seconds.
- **PASS** - Current agent and active filters are the only Redux state; agent selection is persisted in localStorage.
- **PARTIAL** - Header counts use filtered server totals and refresh on actions, rollback, agent changes, and five-second polling. A simulated failed count request preserves the last known value, so “always correct” is eventually consistent rather than absolute.
- **PASS** - Review follows the cursor until all manual-review tickets are loaded; the 1,000-item page size keeps the normal fixture set to one request.

## Live updates, bulk actions, performance, and submission

- **PASS** - List polls updates every five seconds, cleans intervals, and waits for “Show” before refreshing visible rows.
- **PASS** - Cursor pagination remains stable under concurrent top insertions and has a regression test.
- **PASS** - Bulk selection supports claim and next-status changes with one request per ticket, `Promise.allSettled`, per-item results, optimistic UI, and rollback only for failed items.
- **PASS** - Bundle-conscious implementation, memoization, debounce, and bounded incremental rendering are present. Final production mobile Lighthouse Performance is 98.
- **PASS** - Lighthouse HTML, JSON, and screenshot evidence are included under `artifacts/lighthouse/`.
- **PASS** - README includes setup, commands, environment variables, architecture, security, and limitations.
- **PASS** - More than three deterministic useful tests exist, including direct API-bypass attempts.
- **FAIL** - This directory has no Git metadata, so regular commits and a GitHub repository cannot be verified.
- **FAIL** - No live deployment link is included (optional in the brief).

## Supplied fixtures

- **PASS** - T-2001 through T-2012 are included with the assignment values, except T-2012's invalid `maybe` is normalized to manual review with an explanatory reason at the trust boundary.
- **PASS** - Duplicate external IDs use separate internal IDs; XSS/prompt-like strings remain data; unsafe URLs are blocked; invalid AI output is reviewable; long/empty/Unicode/future/unknown-agent/legacy-status cases degrade safely.
