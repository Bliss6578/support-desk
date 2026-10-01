import { NextResponse } from "next/server";
import { findTicket, touch } from "@/lib/store-server";
import { validateTriage } from "@/lib/validation";
import { simulate } from "@/lib/simulation";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){ try{await simulate();const {id}=await params,t=findTicket(id); if(!t)return NextResponse.json({error:"Ticket not found"},{status:404}); const b=await req.json().catch(()=>({})); const error=validateTriage(t.customer_plan,b.category,b.priority,b.reason); if(error)return NextResponse.json({error},{status:422}); t.category=b.category;t.priority=b.priority;t.review_reason=b.reason.trim();t.triage_decision="auto_accept";return NextResponse.json(touch(t));}catch{return NextResponse.json({error:"Temporary API failure"},{status:503})} }
