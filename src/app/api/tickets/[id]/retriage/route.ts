import { NextResponse } from "next/server";
import { findTicket,touch } from "@/lib/store-server";
import { isCategory, isPriority } from "@/lib/validation";
import { simulate } from "@/lib/simulation";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  try {
    await simulate();
    const {id}=await params,t=findTicket(id);
    if(!t)return NextResponse.json({error:"Ticket not found"},{status:404});
    // A real adapter would use this server-only value. It is never serialized to the client.
    void process.env.TRIAGE_API_KEY;
    const candidate={category:t.category,priority:t.priority,summary:`Re-triaged: ${t.subject||"No subject"}`,decision:"manual_review"};
    if(!isCategory(candidate.category)||!isPriority(candidate.priority)||typeof candidate.summary!=="string"||candidate.summary.length>500||candidate.decision!=="manual_review"){
      t.triage_decision="manual_review";t.review_reason="AI returned invalid output";return NextResponse.json(touch(t));
    }
    t.summary=candidate.summary;t.triage_decision=candidate.decision;t.review_reason="Re-triage requires agent confirmation";
    return NextResponse.json(touch(t));
  } catch { return NextResponse.json({error:"Temporary API failure"},{status:503}); }
}
