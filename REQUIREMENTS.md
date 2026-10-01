# Assignment Compliance Checklist

Reviewed against all nine pages of `Frontend-Internship.pdf` on 2026-10-01. Status reflects the final repository, not intended future work.

## Stack and API

- **PARTIAL** - Next.js App Router, React, TypeScript, Tailwind CSS, Redux Toolkit, and React Redux are present. The final component system is custom rather than shadcn/ui; this avoids adding a dependency solely for branding compliance.
- **PASS** - Deterministic generator produces 5,000 tickets, including faithful assignment fixtures with unique internal IDs.
- **PASS** - List, detail, claim, status, triage, retriage, and update Route Handlers exist.
- **PASS** - Search covers subject/body; status, priority, category, AI decision, assignment, page, and page-size filters are server-side.
- **PASS** - Valid agents, status transitions, categories, priorities, reason length, and enterprise floor are enforced by Route Handlers and route-level tests.
- **PASS** - Assignment-style latency/failures are available through `SIMULATE_API_FAILURES=true`; tests always disable randomness. Production deliberately leaves destructive failure injection off. Claim conflicts still include an ownership re-check after latency and real ownership conflicts always return 409.
- **PASS** - The updates endpoint automatically alternates new arrivals with remote claim/status activity after seven seconds; five-second polling observes an event every 5-10 seconds.

## Ticket list and SLA

- **PASS** - Required columns, filters, search, URL persistence/shareability, Redux filter mirror, loading/error/empty states, and retry are present.
- **PASS** - Search is debounced by 300 ms.
- **PASS** - SLA rules, one-second countdown, late/at-risk/on-track states, invalid dates, and future dates are handled.
- **PASS** - `TicketRow` and `Deadline` are memoized; only deadline components own one-second timer state.
- **PASS** - Uses cursor-safe automatic infinite loading on one scrolling page. New top insertions cannot shift offsets, and loaded IDs are deduplicated.
- **PASS** - Responsive ticket cards replace the wide table on small screens and long text cannot expand the layout.

## Ticket detail and safety

- **PASS** - Required ticket/customer/AI/priority/deadline data is displayed with fallbacks.
- **PASS** - Customer and AI markup renders as text; no `dangerouslySetInnerHTML` exists.
- **PASS** - Only HTTP(S) attachments are clickable and external links use `noopener noreferrer`.
- **PASS** - Claim is optimistic, has a synchronous double-submit lock, preserves only the prior assignment for rollback, and distinguishes HTTP 409.
- **PASS** - Status UI offers only the valid next transition and has a synchronous double-submit lock; the API repeats validation.
- **PASS** - Detail polling uses the updates endpoint and detects remote assignment/status changes without overwriting an in-flight local mutation.
- **PASS** - Re-run AI calls a server Route Handler; the secret is never public. Candidate output is validated before use.
- **PASS** - The dynamic route's server layout invokes Next.js `notFound()` before the client detail screen renders.

## AI review and shared state

- **PASS** - Manual-review tickets show the required fields; accept/change actions enforce inline reason and enterprise checks.
- **PASS** - Successful review removes the item immediately and header counts are refreshed.
- **PASS** - Review queue changes come from the updates endpoint; header totals poll every five seconds.
- **PASS** - Current agent and active filters are the only Redux state; agent selection is persisted in localStorage.
- **PARTIAL** - Header counts use filtered server totals and refresh on actions, rollback, agent changes, and five-second polling. A simulated failed count request preserves the last known value, so “always correct” is eventually consistent rather than absolute.
- **PASS** - Review follows the cursor until all manual-review tickets are loaded, but renders cards incrementally in scroll-triggered batches.

## Live updates, bulk actions, performance, and submission

- **PASS** - List polls updates every five seconds, buffers both new and changed tickets by internal ID, cleans intervals, and waits for “Show” before refreshing visible rows.
- **PASS** - Cursor pagination remains stable under concurrent top insertions and has a regression test.
- **PASS** - Bulk selection supports claim and next-status changes with one request per ticket, `Promise.allSettled`, per-item results, optimistic UI, and rollback only for failed items.
- **PASS** - Bundle-conscious implementation, memoization, debounce, and bounded incremental rendering are present. Current production-build mobile Lighthouse scores are Performance 99, Accessibility 100, Best Practices 96, and SEO 100.
- **PASS** - Lighthouse HTML, JSON, and screenshot evidence are included under `artifacts/lighthouse/`.
- **PASS** - README includes setup, commands, environment variables, architecture, security, and limitations.
- **PASS** - More than three deterministic useful tests exist, including direct API-bypass attempts.
- **PASS** - The GitHub repository contains a sequence of implementation, quality, redesign, and production-fix commits.
- **PASS** - The README includes the public Vercel production link.

## Supplied fixtures

- **PASS** - T-2001 through T-2012 are included with the assignment values. T-2012's invalid raw `maybe` decision is preserved, identified as unsupported, and routed into manual review without silently normalizing the source value.
- **PASS** - Duplicate external IDs use separate internal IDs; XSS/prompt-like strings remain data; unsafe URLs are blocked; invalid AI output is reviewable; long/empty/Unicode/future/unknown-agent/legacy-status cases degrade safely.
