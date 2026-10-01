import { NextResponse } from "next/server";
import { findTicket } from "@/lib/store-server";
import { simulate } from "@/lib/simulation";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){ try{await simulate();const {id}=await params,t=findTicket(id); return t?NextResponse.json(t):NextResponse.json({error:"Ticket not found"},{status:404});}catch{return NextResponse.json({error:"Temporary API failure"},{status:503})} }
