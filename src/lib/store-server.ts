import { generateTickets } from "./mock-data";
import type { Ticket } from "./types";
const globalStore = globalThis as unknown as { tickets?: Ticket[]; lastExternalActivity?:number; externalSequence?:number };
export const tickets = globalStore.tickets ?? (globalStore.tickets = generateTickets());
export const findTicket = (id:string) => tickets.find(t=>t.id===id);
export const touch = (ticket:Ticket) => { ticket.updated_at=new Date().toISOString(); return ticket; };

export function simulateExternalActivity(now=Date.now()) {
  const last=globalStore.lastExternalActivity??now;
  if(globalStore.lastExternalActivity===undefined){globalStore.lastExternalActivity=now;return null}
  if(now-last<7000)return null;
  globalStore.lastExternalActivity=now;
  const sequence=(globalStore.externalSequence??0)+1;globalStore.externalSequence=sequence;
  if(sequence%2===1){
    const created=new Date(now).toISOString();
    const ticket:Ticket={id:`live-${now}-${sequence}`,external_id:`LIVE-${sequence}`,customer_id:`C-LIVE-${sequence}`,customer_plan:sequence%4===0?"enterprise":"pro",subject:`Live customer issue #${sequence}`,body:"This ticket arrived while the dashboard was open.",attachment_url:null,created_at:created,updated_at:created,status:"open",assigned_to:null,category:"other",priority:sequence%4===0?"P1":"P2",summary:"A newly arrived support request.",triage_decision:sequence%3===0?"manual_review":"auto_accept",review_reason:sequence%3===0?"New ticket selected for manual review":null};
    tickets.unshift(ticket);return ticket;
  }
  const candidate=tickets.find(t=>t.status==="open"&&!t.assigned_to&&t.id.startsWith("ticket-"));
  if(!candidate)return null;
  candidate.assigned_to="agent-2";candidate.status="in_progress";return touch(candidate);
}
