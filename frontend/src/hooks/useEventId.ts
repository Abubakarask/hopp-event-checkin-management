import { useState, useEffect } from "react";

export function useEventId(): string {
  const [eventId, setEventId] = useState(() => localStorage.getItem("eventId") || "");

  useEffect(() => {
    if (eventId) return;

    fetch("/api/stats/event")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          localStorage.setItem("eventId", data.id);
          setEventId(data.id);
        }
      })
      .catch(() => {});
  }, [eventId]);

  return eventId;
}
