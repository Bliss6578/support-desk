import { isPriority } from "./validation";
const HOURS = { P0:1, P1:4, P2:24, P3:72 } as const;
export type SlaState = { label:"LATE"|"AT RISK"|"ON TRACK"|"UNKNOWN"|"FUTURE"; remainingMs:number; deadline:number|null };
export function getSla(createdAt:string, priority:string, now=Date.now()): SlaState {
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created) || !isPriority(priority)) return {label:"UNKNOWN",remainingMs:0,deadline:null};
  if (created > now) return {label:"FUTURE",remainingMs:0,deadline:created + HOURS[priority]*3600000};
  const total = HOURS[priority]*3600000, deadline = created+total, remainingMs=deadline-now;
  return { label: remainingMs <= 0 ? "LATE" : remainingMs < total*.2 ? "AT RISK" : "ON TRACK", remainingMs, deadline };
}
export function formatDuration(ms:number){ if(ms<=0)return "0m"; const total=Math.floor(ms/60000); const d=Math.floor(total/1440),h=Math.floor(total%1440/60),m=total%60; return d?`${d}d ${h}h`:h?`${h}h ${m}m`:`${m}m`; }
