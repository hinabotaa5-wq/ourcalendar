// Pages Function: forward same-origin /api/* calls to the deployed Worker.
// The web app calls relative /api paths; Pages and Workers are separate
// origins, so this minimal proxy is the only wiring between them.
const WORKER_ORIGIN = "https://ourcalendar-api.n5-works.workers.dev";

interface PagesContext {
  request: Request;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const incoming = new URL(context.request.url);
  const target = WORKER_ORIGIN + incoming.pathname + incoming.search;
  return fetch(new Request(target, context.request));
}
