import { readEvents } from './_lib/log';

/** GET /api/loom/events — read the log (for the initial fetch). */
export const onRequestGet: PagesFunction = async (context) => {
  const events = await readEvents(context.env);
  return Response.json(events);
};