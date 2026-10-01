import { NextResponse } from "next/server";
import { findTicket, touch } from "@/lib/store-server";
import { isValidTransition } from "@/lib/validation";
import { simulate } from "@/lib/simulation";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){ try{await simulate();const {id}=await params,t=findTicket(id); if(!t)return NextResponse.json({error:"Ticket not found"},{status:404}); const body=await req.json().catch(()=>({})); if(!isValidTransition(t.status,body.status))return NextResponse.json({error:`Invalid status transition: ${t.status} to ${String(body.status)}`},{status:422}); t.status=body.status; return NextResponse.json(touch(t));}catch{return NextResponse.json({error:"Temporary API failure"},{status:503})} }
