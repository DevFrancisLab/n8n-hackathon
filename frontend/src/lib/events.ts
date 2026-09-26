import type { TrackEventInput, AppEvent } from "@/types";
import { buildEvent, deliverEvent } from "@/lib/api/events";

/**
 * The only function UI code should call when a customer does something.
 *
 * trackEvent({ event: "MOVIE_VIEWED", customerId, movieId, metadata })
 *
 * Flow today: component -> trackEvent -> local log
 * Flow later: component -> trackEvent -> Django POST /api/events -> n8n
 */
export function trackEvent(input: TrackEventInput): AppEvent | null {
  const event = buildEvent(input);
  if (!event) return null;
  deliverEvent(event);
  return event;
}
