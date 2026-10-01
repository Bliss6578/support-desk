export const AGENTS = { "agent-1": "Priya", "agent-2": "Rahul", "agent-3": "Meera" } as const;
export type AgentId = keyof typeof AGENTS;
export const STATUSES = ["open", "in_progress", "resolved"] as const;
export const PRIORITIES = ["P0", "P1", "P2", "P3"] as const;
export const CATEGORIES = ["account_access", "billing", "bug", "feature_request", "other"] as const;
export const TRIAGE_DECISIONS = ["auto_accept", "manual_review"] as const;
export type TicketStatus = typeof STATUSES[number];
export type Priority = typeof PRIORITIES[number];
export type TriageDecision = typeof TRIAGE_DECISIONS[number];
export interface Ticket { id:string; external_id:string; customer_id:string; customer_plan:string; subject:string; body:string|null; attachment_url:string|null; created_at:string; updated_at:string; status:string; assigned_to:string|null; category:string; priority:string; ai_priority?:string|null; summary:string|null; triage_decision:string; review_reason?:string|null }
export interface TicketFilters { status:string; priority:string; category:string; triage_decision:string; search:string }
export interface TicketPage { items:Ticket[]; total:number; page:number; pageSize:number; nextCursor:string|null }
