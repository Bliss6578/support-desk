import { notFound } from "next/navigation";
import { findTicket } from "@/lib/store-server";

export default async function TicketLayout({ children, params }:{ children:React.ReactNode; params:Promise<{id:string}> }) {
  const { id } = await params;
  if (!findTicket(id)) notFound();
  return children;
}
