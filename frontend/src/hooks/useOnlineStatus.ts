import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus(pingUrl = "/health", pingInterval = 10000) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const checkOnline = useCallback(async () => {
    try {
      const res = await fetch(pingUrl, { method: "GET", cache: "no-store" });
      setIsOnline(res.ok);
    } catch {
      setIsOnline(false);
    }
  }, [pingUrl]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkOnline();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(checkOnline, pingInterval);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkOnline, pingInterval]);

  return isOnline;
}
