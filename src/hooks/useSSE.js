import { useEffect } from "react";

/**
 * Subscribe to server-sent events from /api/events.
 * @param {Record<string, () => void>} handlers - map of event name → callback
 */
export function useSSE(handlers) {
  useEffect(() => {
    const es = new EventSource("/api/events");

    for (const [event, fn] of Object.entries(handlers)) {
      es.addEventListener(event, fn);
    }

    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
