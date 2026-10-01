import { beforeEach, describe, expect, it } from "vitest";
import { PATCH as patchStatus } from "./tickets/[id]/status/route";
import { PATCH as patchTriage } from "./tickets/[id]/triage/route";
import { POST as claimTicket } from "./tickets/[id]/claim/route";
import { GET as listTickets } from "./tickets/route";
import { findTicket, tickets } from "@/lib/store-server";
import { NextRequest } from "next/server";

const context = (id: string) => ({ params: Promise.resolve({ id }) });
const jsonRequest = (body: unknown, method = "PATCH") => new Request("http://localhost/api/test", {
  method, headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});

describe("Route Handler validation cannot be bypassed", () => {
  beforeEach(() => {
    const enterprise = findTicket("case-2001-a");
    if (enterprise) { enterprise.status = "open"; enterprise.assigned_to = null; enterprise.priority = "P0"; }
  });

  it("rejects an enterprise downgrade sent directly to the API", async () => {
    const response = await patchTriage(jsonRequest({ category:"billing", priority:"P2", reason:"Direct hostile request" }), context("case-2001-a"));
    expect(response.status).toBe(422);
    expect(findTicket("case-2001-a")?.priority).toBe("P0");
  });

  it("rejects an invalid status transition sent directly to the API", async () => {
    const response = await patchStatus(jsonRequest({ status:"resolved" }), context("case-2001-a"));
    expect(response.status).toBe(422);
    expect(findTicket("case-2001-a")?.status).toBe("open");
  });

  it("rejects an unknown agent sent directly to the API", async () => {
    const response = await claimTicket(jsonRequest({ agentId:"agent-99" }, "POST"), context("case-2001-a"));
    expect(response.status).toBe(400);
    expect(findTicket("case-2001-a")?.assigned_to).toBeNull();
  });

  it("keeps cursor pagination stable when a ticket is inserted at the top", async () => {
    const first=await listTickets(new NextRequest("http://localhost/api/tickets?pageSize=2"));
    const firstPage=await first.json();
    const inserted={...tickets[20],id:"cursor-concurrency-test",external_id:"CURSOR-TEST"};
    tickets.unshift(inserted);
    try{
      const next=await listTickets(new NextRequest(`http://localhost/api/tickets?pageSize=2&cursor=${firstPage.nextCursor}`));
      const nextPage=await next.json();
      const ids=nextPage.items.map((ticket:{id:string})=>ticket.id);
      expect(ids).not.toContain(firstPage.items[0].id);
      expect(ids).not.toContain(firstPage.items[1].id);
    }finally{const index=tickets.findIndex(ticket=>ticket.id===inserted.id);if(index>=0)tickets.splice(index,1)}
  });
});
