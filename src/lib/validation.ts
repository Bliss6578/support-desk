import { AGENTS, CATEGORIES, PRIORITIES, STATUSES, TRIAGE_DECISIONS, type AgentId, type Priority, type TicketStatus, type TriageDecision } from "./types";
export const isAgentId = (v: unknown): v is AgentId => typeof v === "string" && v in AGENTS;
export const isPriority = (v: unknown): v is string => typeof v === "string" && PRIORITIES.includes(v as Priority);
export const isCategory = (v: unknown): v is string => typeof v === "string" && CATEGORIES.includes(v as never);
export const isStatus = (v: unknown): v is TicketStatus => STATUSES.includes(v as TicketStatus);
export const isTriageDecision = (v: unknown): v is TriageDecision => TRIAGE_DECISIONS.includes(v as TriageDecision);
const transitions: Record<TicketStatus, TicketStatus> = { open:"in_progress", in_progress:"resolved", resolved:"open" };
export const isValidTransition = (from:string, to:string) => isStatus(from) && isStatus(to) && transitions[from] === to;
export const nextStatus = (status:string) => isStatus(status) ? transitions[status] : null;
export const validateTriage = (plan:string, category:unknown, priority:unknown, reason:unknown) => {
  if (!isCategory(category)) return "Choose a valid category.";
  if (!isPriority(priority)) return "Choose a valid priority.";
  if (typeof reason !== "string" || reason.trim().length < 10) return "Reason must be at least 10 characters.";
  if (plan === "enterprise" && (priority === "P2" || priority === "P3")) return "Enterprise tickets cannot be lower than P1.";
  return null;
};
