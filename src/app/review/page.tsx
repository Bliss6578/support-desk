"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CATEGORIES,
  PRIORITIES,
  type Ticket,
  type TicketPage,
} from "@/lib/types";
import { isCategory, isPriority, isTriageDecision } from "@/lib/validation";
import { humanize } from "@/components/TicketRow";
import { notifyCounts } from "@/components/Header";
export default function Review() {
  const [items, setItems] = useState<Ticket[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [visibleCount, setVisibleCount] = useState(30);
  const since = useRef(new Date().toISOString());
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const all: Ticket[] = [];
      let cursor: string | null = null;
      do {
        const q = new URLSearchParams({
          triage_decision: "manual_review",
          pageSize: "1000",
        });
        if (cursor) q.set("cursor", cursor);
        const r = await fetch(`/api/tickets?${q}`);
        if (!r.ok) throw new Error();
        const page = (await r.json()) as TicketPage;
        all.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);
      setItems(all);
      setVisibleCount(30);
    } catch {
      if (!silent) setError("Could not load the review queue.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/tickets/updates?since=${encodeURIComponent(since.current)}`,
        );
        if (!response.ok) return;
        const update = (await response.json()) as { items: Ticket[] };
        since.current = new Date().toISOString();
        setItems((current) => {
          const next = new Map(current.map((ticket) => [ticket.id, ticket]));
          for (const ticket of update.items) {
            const needsReview =
              ticket.triage_decision === "manual_review" ||
              !isTriageDecision(ticket.triage_decision);
            if (needsReview) next.set(ticket.id, ticket);
            else next.delete(ticket.id);
          }
          return [...next.values()];
        });
        if (update.items.length) notifyCounts();
      } catch {}
    };
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || visibleCount >= items.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting)
          setVisibleCount((count) => Math.min(count + 30, items.length));
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [items.length, visibleCount]);
  const remove = (id: string) => {
    setItems((x) => x.filter((t) => t.id !== id));
    notifyCounts();
  };
  return (
    <div
      className="container review-page"
      style={{ paddingTop: 34, paddingBottom: 50 }}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">QUALITY CONTROL</p>
          <h1>AI Review</h1>
          <p>Review AI-flagged tickets before agents act on them.</p>
        </div>
        {!loading && !error && (
          <strong className="result-count">
            {items.length.toLocaleString()} tickets require manual review
          </strong>
        )}
      </div>
      {loading ? (
        <State text="Loading review queue…" />
      ) : error ? (
        <State
          text={error}
          action={
            <button className="btn" onClick={() => load()}>
              Retry
            </button>
          }
        />
      ) : !items.length ? (
        <State text="All caught up — no tickets need review." />
      ) : (
        <div className="review-list">
          {items.slice(0, visibleCount).map((t) => (
            <ReviewCard key={t.id} ticket={t} done={() => remove(t.id)} />
          ))}
          {visibleCount < items.length && (
            <div ref={loadMoreRef} className="load-more-sentinel">
              Loading more review tickets…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function ReviewCard({ ticket, done }: { ticket: Ticket; done: () => void }) {
  const [editing, setEditing] = useState(false),
    [category, setCategory] = useState(
      isCategory(ticket.category) ? ticket.category : "other",
    ),
    [priority, setPriority] = useState(
      isPriority(ticket.priority) ? ticket.priority : "P1",
    ),
    [reason, setReason] = useState(ticket.review_reason ?? ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const invalidAi =
    !isCategory(ticket.category) ||
    !isPriority(ticket.priority) ||
    !isTriageDecision(ticket.triage_decision) ||
    (ticket.customer_plan === "enterprise" &&
      (ticket.priority === "P2" || ticket.priority === "P3"));
  const submit = async (cat: string, pri: string, why: string) => {
    setError("");
    if (why.trim().length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    if (
      ticket.customer_plan === "enterprise" &&
      (pri === "P2" || pri === "P3")
    ) {
      setError("Enterprise tickets cannot be lower than P1.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/tickets/${ticket.id}/triage`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category: cat, priority: pri, reason: why }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      done();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="card review-card">
      <div className="review-card-header">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link className="review-title" href={`/tickets/${ticket.id}`}>
            {ticket.subject || "No subject"}
          </Link>
          {invalidAi && (
            <p className="ai-warning" role="status">
              Invalid AI output — human decision required
            </p>
          )}
        </div>
        <div className="review-actions">
          <button
            className="btn"
            disabled={busy || invalidAi}
            title={
              invalidAi
                ? "AI category, priority, or decision is invalid. Use Change Decision."
                : undefined
            }
            onClick={() =>
              submit(
                ticket.category,
                ticket.priority,
                "Accepted AI recommendation",
              )
            }
          >
            {busy ? "Saving…" : "Accept AI"}
          </button>
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => setEditing((v) => !v)}
          >
            Change Decision
          </button>
        </div>
      </div>
      <dl className="review-details">
        <ReviewField
          label="Customer plan"
          value={humanize(ticket.customer_plan)}
        />
        <ReviewField
          label="AI category"
          value={humanize(ticket.category)}
          invalid={!isCategory(ticket.category)}
        />
        <ReviewField
          label="AI priority"
          value={ticket.ai_priority ?? ticket.priority}
          invalid={!isPriority(ticket.priority)}
        />
        <ReviewField
          label="AI summary"
          value={ticket.summary || "No summary available."}
        />
        <ReviewField
          label="Review reason"
          value={humanize(ticket.review_reason || "Unspecified")}
        />
      </dl>
      {invalidAi && (
        <p className="invalid-help">
          Accept AI is unavailable because the recommendation fails validation.
          Use Change Decision.
        </p>
      )}
      {editing && (
        <div className="review-form">
          <label className="label">
            Category
            <select
              className="field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((x) => (
                <option key={x} value={x}>
                  {humanize(x)}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            Priority
            <select
              className="field"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="label">
            Reason
            <textarea
              className="field"
              rows={2}
              minLength={10}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button
            className="btn"
            disabled={busy}
            onClick={() => submit(category, priority, reason)}
          >
            {busy ? "Saving…" : "Save review"}
          </button>
        </div>
      )}
      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
function ReviewField({
  label,
  value,
  invalid = false,
}: {
  label: string;
  value: string;
  invalid?: boolean;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={invalid ? "invalid-value" : undefined}>{value}</dd>
    </div>
  );
}
function State({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 60, textAlign: "center" }}>
      <p>{text}</p>
      {action}
    </div>
  );
}
