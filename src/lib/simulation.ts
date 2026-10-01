export async function simulate(kind:"general"|"claim"="general"){
  // Failure injection is a local QA aid and must never be enabled implicitly
  // in a production deployment. Set the flag explicitly when testing it.
  if(process.env.NODE_ENV === "test" || process.env.SIMULATE_API_FAILURES !== "true") return;
  await new Promise(r=>setTimeout(r,300+Math.random()*1200));
  if(Math.random() < (kind === "claim" ? .25 : .1)) throw new Error(kind === "claim" ? "SIMULATED_CONFLICT" : "SIMULATED_FAILURE");
}
