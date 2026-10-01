# SupportDesk

A polished support-ticket operations dashboard built for a frontend engineering assignment. Agents can search and filter a deterministic 5,000-ticket data set, claim tickets, move them through a guarded status workflow, inspect SLA deadlines, and review AI triage decisions.

**Live deployment:** [support-desk-ten-liard.vercel.app](https://support-desk-ten-liard.vercel.app/tickets)

## Features

- Server-filtered, cursor-safe infinite ticket list with 300 ms debounced search and shareable URL filters
- Bulk claim and status advancement with per-ticket results and failed-item-only rollback
- Optimistic ticket claiming with conflict-specific rollback and double-submit protection
- Server-enforced status transitions and enterprise priority floor
- AI review workflow, safe retriage proxy, live-update polling, and responsive layouts
- Defensive rendering for XSS payloads, invalid dates, unknown enum values, unsafe URLs, duplicate external IDs, and long/empty text
- Memoized ticket rows and isolated one-second deadline timers

## Tech stack

Next.js App Router, React, TypeScript, Tailwind CSS, Redux Toolkit, React Redux, Lucide React, and Vitest. The fake backend uses Next.js Route Handlers and a process-global in-memory store.

## Run locally

```bash
npm install
npm run dev
npm run build
npm test
npm run lint
```

Open `http://localhost:3000`. Optional environment variables:

```bash
TRIAGE_API_KEY=server-only-secret
SIMULATE_API_FAILURES=true
```

`TRIAGE_API_KEY` is read only by the server-side retriage Route Handler. Never prefix it with `NEXT_PUBLIC_`. Random 0.3–1.5 second latency, 10% general failures, and 25% simulated claim conflicts are an opt-in QA mode enabled with `SIMULATE_API_FAILURES=true`. They are off in production by default and always disabled under tests so the deployed demo and test suite remain deterministic.

## Architecture

Route Handlers own authoritative ticket mutation and validation. `src/lib/store-server.ts` keeps the generated ticket collection in server memory. Redux stores only the selected agent and URL-derived active filters; fetched server data and transient form/request state stay local. The ticket list, detail view, and review queue poll the updates endpoint every five seconds. List changes remain buffered until the agent chooses to show them.

## Known limitations

The in-memory store resets when the server process restarts and is unsuitable for multi-instance production hosting. Re-triage uses a deterministic, validated local response in place of a real provider. See `REQUIREMENTS.md` for the strict final compliance audit. Current Lighthouse evidence is stored in `artifacts/lighthouse/`; the latest mobile production-build scores are Performance 99, Accessibility 100, Best Practices 96, and SEO 100.

See [DECISIONS.md](./DECISIONS.md) for security, data-quality, and scope decisions.
