"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Inbox, ShieldCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAgent } from "@/store/store";
import { AGENTS, type AgentId, type TicketPage } from "@/lib/types";
export const notifyCounts = () =>
  window.dispatchEvent(new Event("tickets-changed"));
export function Header() {
  const agent = useAppSelector((s) => s.agent.current),
    dispatch = useAppDispatch(),
    path = usePathname(),
    [counts, setCounts] = useState({ mine: 0, review: 0 });
  useEffect(() => {
    const saved = localStorage.getItem("support-agent") as AgentId;
    if (saved && saved in AGENTS) dispatch(setAgent(saved));
  }, [dispatch]);
  useEffect(() => {
    localStorage.setItem("support-agent", agent);
    const load = async () => {
      try {
        const [a, b] = await Promise.all([
          fetch(`/api/tickets?assigned_to=${agent}&pageSize=1`),
          fetch(`/api/tickets?triage_decision=manual_review&pageSize=1`),
        ]);
        if (!a.ok || !b.ok) return;
        const mine = ((await a.json()) as TicketPage).total ?? 0;
        const review = ((await b.json()) as TicketPage).total ?? 0;
        setCounts({ mine, review });
      } catch {}
    };
    load();
    const timer = setInterval(load, 5000);
    window.addEventListener("tickets-changed", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("tickets-changed", load);
    };
  }, [agent]);
  return (
    <header className="app-header">
      <div className="container header-inner">
        <Link href="/tickets" className="brand" aria-label="SupportDesk home">
          <span className="brand-mark">
            <Inbox size={16} />
          </span>
          <span>SupportDesk</span>
        </Link>
        <nav className="main-nav" aria-label="Primary">
          <Link
            className={path.startsWith("/tickets") ? "active" : undefined}
            href="/tickets"
          >
            Tickets
          </Link>
          <Link
            className={path.startsWith("/review") ? "active" : undefined}
            href="/review"
          >
            AI Review
          </Link>
        </nav>
        <div className="header-metrics desktop">
          <span className="metric">
            <Inbox size={15} />
            <span>My Tickets</span>
            <strong>{counts.mine.toLocaleString()}</strong>
          </span>
          <span className="metric">
            <ShieldCheck size={15} />
            <span>To Review</span>
            <strong>{counts.review.toLocaleString()}</strong>
          </span>
        </div>
        <label className="agent-control">
          <span className="avatar">{AGENTS[agent].charAt(0)}</span>
          <span className="agent-name">{AGENTS[agent]}</span>
          <span className="sr-only">Current agent</span>
          <select
            className="agent-select"
            aria-label="Current agent"
            value={agent}
            onChange={(e) => dispatch(setAgent(e.target.value as AgentId))}
          >
            {Object.entries(AGENTS).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
