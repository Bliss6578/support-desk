# Engineering Decisions

## Security and trust boundaries

`NEXT_PUBLIC_TRIAGE_API_KEY` was rejected because Next.js embeds public variables in browser bundles. Re-triage goes through a Route Handler that alone can read `process.env.TRIAGE_API_KEY`. The detail page includes the implemented Re-run AI control. The demo adapter returns a deterministic candidate and the Route Handler validates category, priority, summary shape, and decision before committing it.

Customer fields and AI summaries are untrusted strings. React text rendering is used; no `dangerouslySetInnerHTML` is present. This deliberately resolves the contradictory request to “show customer HTML exactly” in favor of preventing XSS. Attachment links pass through a strict URL parser and only `http:`/`https:` schemes become anchors, with `target="_blank"` and `rel="noopener noreferrer"`. `javascript:`, `data:`, `vbscript:`, malformed URLs, event handlers, iframes, and script markup never execute.

AI output is data, not authority. Categories, priorities, decisions, and review reasons are validated. Unsupported output is represented safely and routed to manual review. Summaries are rendered as text. Enterprise priority can never be set below P1; the API enforces the rule even if client validation is bypassed.

An unsafe implementation suggestion would be using `dangerouslySetInnerHTML` to preserve “exact HTML.” The malicious fixtures show that interpretation would enable XSS, so it was rejected.

## State and data flow

The server-memory ticket store is authoritative. A process-global array avoids regeneration during development reloads but resets on process restart. Redux contains only cross-page client concerns: current agent and active ticket filters. Forms, fetched pages, loading/error flags, and optimistic snapshots remain local because they have a clear owner and do not benefit from global coupling.

The URL is the persistence source for filters, making filtered views refresh-safe and shareable. The page derives Redux filters from query parameters in one direction; UI changes update the URL, avoiding two competing sources and synchronization loops.

Polling runs every five seconds: responsive enough for a support queue without creating needless load. The server lazily generates external activity after seven seconds, alternating new arrivals and remote claim/status changes, so polling observes activity every 5-10 seconds without a server timer that leaks during reloads. Pending updates accumulate by ID and remain behind an “N updated tickets — Show” banner until requested, so rows do not jump. Detail polling refreshes assignment and status; review and header counts also poll. Intervals are cleaned up. Production would use versioned events or WebSockets.

The requirement to “show all tickets on one page” conflicts with API pagination and a roughly 5,000-row performance target. The API retains pagination while the UI incrementally appends 25-row cursor pages on one scrolling screen. The cursor is the last internal ID, so new top insertions cannot cause offset skips or duplicates; the client also deduplicates IDs. `TicketRow` and `Deadline` are memoized; countdown state is isolated per deadline.

## Supplied edge cases

- **T-2001:** two records share the external ID but have unique `case-2001-a` and `case-2001-b` internal keys.
- **T-2002:** the supplied customer HTML/XSS strings render literally as text.
- **T-2003:** prompt-like text is treated as data; the `javascript:` attachment is blocked.
- **T-2004:** `platinum`, `urgent_billing`, `P5`, and a null summary display safely; invalid category/priority cannot be accepted and the edit form offers a valid fallback.
- **T-2005:** long subject text is truncated in the table and wraps on detail/review screens.
- **T-2006:** empty subject/body become “No subject” and “No message provided.”
- **T-2007:** Arabic Unicode is preserved; the date is parsed defensively; AI P3 and final enterprise P1 plus its reason are both shown.
- **T-2008:** the supplied 2027 future creation time is labeled `FUTURE`, never shown as a negative countdown.
- **T-2009:** `agent-99` displays as “Unknown agent.”
- **T-2010:** legacy `closed` displays but offers no transition action because it is outside the supported state machine.
- **T-2011:** malicious AI summary markup renders as text.
- **T-2012:** unsupported `maybe` is normalized at the fixture trust boundary into manual review with an explicit reason instead of being trusted.

## Simulation and failures

Latency/general failures/claim conflicts are reusable and enabled by default; `SIMULATE_API_FAILURES=false` disables them for a predictable demo, and `NODE_ENV=test` always disables them. Claiming saves only the prior assignment, applies one optimistic change, blocks repeat clicks with both a ref and disabled control, and rolls back only that assignment on failure. HTTP 409 receives specific messaging. The claim route re-checks ownership after simulated latency to avoid a time-of-check/time-of-use race. Status and re-triage actions also use synchronous refs to block rapid duplicate requests.

## Scope

Implemented after review: bulk claim/status actions with `Promise.allSettled` and failed-item rollback, cursor-safe incremental loading, a server `notFound()` boundary, automatic external activity, complete review-queue retrieval, and measured Lighthouse artifacts. Still skipped: a production database, authentication/authorization, a real AI provider call, end-to-end tests in CI, Git history, and deployment. Header counts use filtered server totals and five-second polling.

With one additional week: add PostgreSQL and optimistic concurrency/version columns, authentication and role checks, virtualization for very large loaded lists, WebSocket events, Playwright accessibility/security scenarios in CI, observability, rate limiting, and a validated real triage-provider adapter.
