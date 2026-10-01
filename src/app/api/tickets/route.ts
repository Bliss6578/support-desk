import { NextRequest, NextResponse } from "next/server";
import { tickets } from "@/lib/store-server";
import { simulate } from "@/lib/simulation";
import { isTriageDecision } from "@/lib/validation";
export async function GET(req:NextRequest){
 try { await simulate(); const q=req.nextUrl.searchParams; const page=Math.max(1,Number(q.get("page"))||1), pageSize=Math.min(1000,Math.max(1,Number(q.get("pageSize"))||25));
  const fields=["status","priority","category","assigned_to"] as const; const decision=q.get("triage_decision");let list=tickets.filter(t=>fields.every(k=>!q.get(k)||t[k]===q.get(k))&&(!decision||(decision==="manual_review"?(t.triage_decision==="manual_review"||!isTriageDecision(t.triage_decision)):t.triage_decision===decision)));
  const search=q.get("search")?.trim().toLowerCase(); if(search) list=list.filter(t=>`${t.subject} ${t.body??""}`.toLowerCase().includes(search));
  const cursor=q.get("cursor"),cursorIndex=cursor?list.findIndex(t=>t.id===cursor):-1,start=cursorIndex>=0?cursorIndex+1:(page-1)*pageSize,items=list.slice(start,start+pageSize),nextCursor=start+items.length<list.length?(items.at(-1)?.id??null):null;
  return NextResponse.json({items,total:list.length,page,cursor:cursor??null,nextCursor,pageSize});
 } catch { return NextResponse.json({error:"Temporary API failure"},{status:503}); }
}
