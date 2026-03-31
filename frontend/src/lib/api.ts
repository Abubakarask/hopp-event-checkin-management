const BASE_URL = "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }

  return res.json();
}

export const api = {
  checkin(data: { qrToken: string; stationId: string; eventId: string }) {
    return request<any>("/checkin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  batchCheckin(data: {
    stationId: string;
    eventId: string;
    scans: Array<{ qrToken: string; clientTime: string }>;
  }) {
    return request<any>("/checkin/batch", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getGuests(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/guests?${qs}`);
  },

  updateGuestStatus(guestId: string, status: string) {
    return request<any>(`/guests/${guestId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  getGuestExportUrl(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    return `${BASE_URL}/guests/export?${qs}`;
  },

  getStats(eventId: string) {
    return request<any>(`/stats?eventId=${eventId}`);
  },
};
