"use client";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { TicketRow } from "@/components/TicketRow";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFilters } from "@/store/store";
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  type Ticket,
  type TicketFilters,
  type TicketPage,
} from "@/lib/types";
import { nextStatus } from "@/lib/validation";
import { notifyCounts } from "@/components/Header";
const empty: TicketFilters = {
  status: "",
  priority: "",
  category: "",
  triage_decision: "",
  search: "",
};
import { RotateCcw } from "lucide-react";
import { TicketCard, humanize } from "@/components/TicketRow";
export default function TicketsPage() {
  return (
    <Suspense fallback={<State text="Loading tickets…" />}>
      <TicketsContent />
    </Suspense>
  );
}
function TicketsContent() {
  const searchParams = useSearchParams(),
    router = useRouter(),
    path = usePathname(),
    dispatch = useAppDispatch(),
    agent = useAppSelector((s) => s.agent.current);
  const filters = useMemo(
    () => ({
      ...empty,
      ...Object.fromEntries(
        Object.keys(empty).map((k) => [k, searchParams.get(k) ?? ""]),
      ),
    }),
    [searchParams],
  );
  const [search, setSearch] = useState(filters.search),
    [data, setData] = useState<TicketPage | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [loadingMore, setLoadingMore] = useState(false),
    [pending, setPending] = useState<Ticket[]>([]),
    [selected, setSelected] = useState<Set<string>>(new Set()),
    [bulkBusy, setBulkBusy] = useState(false),
    [bulkResults, setBulkResults] = useState<string[]>([]);
  const since = useRef(new Date().toISOString());
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    setSearch(filters.search);
    dispatch(setFilters(filters));
  }, [filters, dispatch]);
  const hasFilters = Object.values(filters).some(Boolean);
  const update = useCallback(
    (key: string, value: string) => {
      const q = new URLSearchParams(searchParams);
      if (value) q.set(key, value);
      else q.delete(key);
      if (key !== "page") q.delete("page");
      router.replace(q.size ? `${path}?${q}` : path);
    },
    [searchParams, router, path],
  );
  useEffect(() => {
    const id = setTimeout(() => {
      if (search !== filters.search) update("search", search);
    }, 300);
    return () => clearTimeout(id);
  }, [search, filters.search, update]);
  const load = useCallback(
    async (reset = true, cursor?: string | null) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError("");
      try {
        const q = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && q.set(k, v));
        q.set("pageSize", "25");
        if (cursor) q.set("cursor", cursor);
        const r = await fetch(`/api/tickets?${q}`);
        if (!r.ok) throw new Error("Could not load tickets");
        const next = (await r.json()) as TicketPage;
        setData((previous) => {
          if (reset || !previous) return next;
          const ids = new Set(previous.items.map((t) => t.id));
          return {
            ...next,
            items: [
              ...previous.items,
              ...next.items.filter((t) => !ids.has(t.id)),
            ],
          };
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load tickets");
      } finally {
        if (reset) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [filters],
  );
  useEffect(() => {
    setSelected(new Set());
    load(true);
  }, [load]);
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(
          `/api/tickets/updates?since=${encodeURIComponent(since.current)}`,
        );
        if (!r.ok) return;
        const json = await r.json();
        since.current = new Date().toISOString();
        setPending((current) => {
          const merged = new Map(current.map((t) => [t.id, t]));
          for (const ticket of json.items as Ticket[])
            merged.set(ticket.id, ticket);
          return [...merged.values()];
        });
        if ((json.items as Ticket[]).length) notifyCounts();
      } catch {}
    };
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !data?.nextCursor || loadingMore || loading || error) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) load(false, data.nextCursor);
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [data?.nextCursor, error, load, loading, loadingMore]);
  const showUpdates = () => {
    setPending([]);
    setSelected(new Set());
    load(true);
  };
  const selectTicket = useCallback(
    (id: string, checked: boolean) =>
      setSelected((current) => {
        const next = new Set(current);
        if (checked) next.add(id);
        else next.delete(id);
        return next;
      }),
    [],
  );
  const runBulk = async (kind: "claim" | "status") => {
    if (!data || !selected.size || bulkBusy) return;
    setBulkBusy(true);
    setBulkResults([]);
    const chosen = data.items.filter((t) => selected.has(t.id)),
      before = new Map(chosen.map((t) => [t.id, t]));
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((t) =>
              !selected.has(t.id)
                ? t
                : kind === "claim"
                  ? { ...t, assigned_to: agent }
                  : { ...t, status: nextStatus(t.status) ?? t.status },
            ),
          }
        : current,
    );
    const settled = await Promise.allSettled(
      chosen.map(async (ticket) => {
        const status = nextStatus(ticket.status);
        if (kind === "status" && !status)
          throw new Error("No valid next status");
        const r = await fetch(
          `/api/tickets/${ticket.id}/${kind === "claim" ? "claim" : "status"}`,
          {
            method: kind === "claim" ? "POST" : "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(
              kind === "claim" ? { agentId: agent } : { status },
            ),
          },
        );
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Request failed");
        return body as Ticket;
      }),
    );
    setData((current) => {
      if (!current) return current;
      const resultById = new Map<string, Ticket>(),
        failed = new Set<string>();
      settled.forEach((result, index) => {
        const id = chosen[index].id;
        if (result.status === "fulfilled") resultById.set(id, result.value);
        else failed.add(id);
      });
      return {
        ...current,
        items: current.items.map(
          (t) =>
            resultById.get(t.id) ??
            (failed.has(t.id) ? (before.get(t.id) ?? t) : t),
        ),
      };
    });
    setBulkResults(
      settled.map(
        (result, index) =>
          `${chosen[index].external_id}: ${result.status === "fulfilled" ? "succeeded" : result.reason instanceof Error ? result.reason.message : "failed"}`,
      ),
    );
    setSelected(new Set());
    setBulkBusy(false);
    notifyCounts();
  };
  const resetFilters = () => {
    setSearch("");
    router.replace(path);
  };
  return (
    <div className="container" style={{ paddingTop: 34, paddingBottom: 50 }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPERATIONS</p>
          <h1>Tickets</h1>
          <p>Find, triage, and resolve customer issues.</p>
        </div>
        <strong className="result-count">
          {(data?.total ?? 0).toLocaleString()} tickets
        </strong>
      </div>
      {pending.length > 0 && (
        <div className="new-ticket-banner">
          <button className="btn" onClick={showUpdates}>
            {pending.length} ticket{" "}
            {pending.length === 1 ? "update" : "updates"}
            {" — Show"}
          </button>
        </div>
      )}
      <section className="card filter-card">
        <div className="filters-grid">
          <label className="label search-filter">
            Search
            <div className="search-control">
              <Search size={17} aria-hidden="true" />
              <input
                className="field"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject or body"
              />
            </div>
          </label>
          <Filter
            label="Status"
            value={filters.status}
            values={STATUSES}
            onChange={(v) => update("status", v)}
          />
          <Filter
            label="Priority"
            value={filters.priority}
            values={PRIORITIES}
            onChange={(v) => update("priority", v)}
          />
          <Filter
            label="Category"
            value={filters.category}
            values={CATEGORIES}
            onChange={(v) => update("category", v)}
          />
          <Filter
            label="AI decision"
            value={filters.triage_decision}
            values={["auto_accept", "manual_review"]}
            onChange={(v) => update("triage_decision", v)}
          />
        </div>
        {hasFilters && (
          <div className="active-filters">
            <span>Filters:</span>
            {Object.entries(filters)
              .filter(([, value]) => value)
              .map(([key, value]) => (
                <button
                  key={key}
                  className="filter-chip"
                  onClick={() =>
                    key === "search" ? setSearch("") : update(key, "")
                  }
                >
                  {humanize(value)} <span aria-hidden="true">×</span>
                  <span className="sr-only">Remove {humanize(key)} filter</span>
                </button>
              ))}
            <button className="reset-link" onClick={resetFilters}>
              <RotateCcw size={14} />
              Reset filters
            </button>
          </div>
        )}
      </section>
      {selected.size > 0 && (
        <section className="card bulk-toolbar">
          <strong>{selected.size} selected</strong>
          <button
            className="btn"
            disabled={bulkBusy}
            onClick={() => runBulk("claim")}
          >
            Claim
          </button>
          <button
            className="btn secondary"
            disabled={bulkBusy}
            onClick={() => runBulk("status")}
          >
            Change status
          </button>
          <button
            className="btn ghost"
            disabled={bulkBusy}
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </section>
      )}
      {bulkResults.length > 0 && (
        <section
          className="card"
          aria-live="polite"
          style={{ padding: 14, marginBottom: 14 }}
        >
          <strong>Bulk results</strong>
          <ul>
            {bulkResults.map((result) => (
              <li key={result}>{result}</li>
            ))}
          </ul>
        </section>
      )}
      {loading ? (
        <TicketSkeleton />
      ) : error ? (
        <section className="card state-panel" role="alert">
          <strong>Tickets could not be loaded</strong>
          <p>{error}</p>
          <button className="btn" onClick={() => load(true)}>
            Retry
          </button>
        </section>
      ) : !data?.items.length ? (
        <section className="card state-panel">
          <strong>No tickets found</strong>
          <p>No tickets match the current filters.</p>
          {hasFilters && (
            <button className="btn secondary" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </section>
      ) : (
        <>
          <section
            className="card ticket-table-wrap"
            style={{ overflowX: "auto" }}
          >
            <table className="ticket-table">
              <thead>
                <tr>
                  <th style={{ padding: 12 }}>
                    <input
                      aria-label="Select all loaded tickets"
                      type="checkbox"
                      checked={
                        data.items.length > 0 &&
                        data.items.every((t) => selected.has(t.id))
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? new Set(data.items.map((t) => t.id))
                            : new Set(),
                        )
                      }
                    />
                  </th>
                  {[
                    "Subject",
                    "Plan",
                    "Category",
                    "Priority",
                    "Status",
                    "Agent",
                    "Created",
                    "Deadline",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px",
                        fontSize: 12,
                        color: "var(--muted)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <TicketRow
                    key={t.id}
                    ticket={t}
                    selected={selected.has(t.id)}
                    onSelect={selectTicket}
                  />
                ))}
              </tbody>
            </table>
          </section>
          <section className="mobile-ticket-list" aria-label="Tickets">
            {data.items.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                selected={selected.has(t.id)}
                onSelect={selectTicket}
              />
            ))}
          </section>
        </>
      )}
      {!error && data?.nextCursor && (
        <div
          ref={loadMoreRef}
          className="load-more-sentinel"
          aria-live="polite"
        >
          {loadingMore ? "Loading more tickets…" : "Scroll to load more"}
        </div>
      )}
    </div>
  );
}
function Filter({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="label">
      {label}
      <select
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {v.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
function State({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <p>{text}</p>
      {action}
    </div>
  );
}
function TicketSkeleton() {
  return (
    <section className="card state-panel" aria-label="Loading tickets">
      <strong>Loading tickets</strong>
      <div
        style={{
          display: "grid",
          gap: 14,
          maxWidth: 780,
          margin: "22px auto 0",
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 18, width: `${92 - i * 5}%` }}
          />
        ))}
      </div>
    </section>
  );
}
