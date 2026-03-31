import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useEventId } from "../hooks/useEventId";
import {
  queueScan,
  getUnsyncedScans,
  markSynced,
  getPendingCount,
  clearSyncedScans,
} from "../lib/offlineQueue";
import StationHeader from "../components/station/StationHeader";
import ScanInput from "../components/station/ScanInput";
import ScanResult, { type ScanResultData } from "../components/station/ScanResult";
import ManualLookup from "../components/station/ManualLookup";
import RecentScans, { type RecentScan } from "../components/station/RecentScans";
import SyncSummary from "../components/station/SyncSummary";

export default function StationPage() {
  const eventId = useEventId();
  const { stationId } = useParams<{ stationId: string }>();
  const isOnline = useOnlineStatus();
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [stationName, setStationName] = useState("Check-in Station");
  const [syncResults, setSyncResults] = useState<any[] | null>(null);
  const [totalCheckins, setTotalCheckins] = useState(0);

  useEffect(() => {
    if (!eventId || !isOnline) return;
    api.getStats(eventId).then((stats) => {
      const station = stats.byStation.find((s: any) => s.stationId === stationId);
      if (station) {
        setStationName(station.stationName);
        setTotalCheckins(station.count);
      }
    }).catch(() => {});
  }, [stationId, isOnline]);

  useEffect(() => {
    getPendingCount().then(setPendingCount);
  }, [scanResult]);

  useEffect(() => {
    if (!isOnline || !stationId || !eventId) return;

    const sync = async () => {
      const unsynced = await getUnsyncedScans();
      if (unsynced.length === 0) return;

      try {
        const data = await api.batchCheckin({
          stationId,
          eventId: eventId,
          scans: unsynced.map((s) => ({ qrToken: s.qrToken, clientTime: s.clientTime })),
        });

        await markSynced(unsynced.map((s) => s.id));
        await clearSyncedScans();
        setPendingCount(0);
        setSyncResults(data.results);
      } catch (err) {
        console.error("Batch sync failed, preserving offline queue for retry:", err);
      }
    };

    sync();
  }, [isOnline, stationId]);

  const handleScan = useCallback(async (qrToken: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

    if (!isOnline) {
      await queueScan(qrToken, stationId!);
      const count = await getPendingCount();
      setPendingCount(count);
      setScanResult({ type: "queued", message: "Scan queued — will sync when back online" });
      setRecentScans((prev) => [{ id: crypto.randomUUID(), guestName: "Queued scan", tierName: "—", time: timeStr, status: "queued" as const }, ...prev].slice(0, 5));
      return;
    }

    try {
      const result = await api.checkin({ qrToken, stationId: stationId!, eventId: eventId });

      if (result.success) {
        setScanResult({ type: "success", guestName: result.guest.name, tierName: result.guest.tierName });
        setTotalCheckins((c) => c + 1);
        setRecentScans((prev) => [{ id: crypto.randomUUID(), guestName: result.guest.name, tierName: result.guest.tierName, time: timeStr, status: "success" as const }, ...prev].slice(0, 5));
      } else if (result.conflict) {
        const conflictTime = new Date(result.conflict.checkedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
        setScanResult({ type: "conflict", guestName: result.guest.name, tierName: result.guest.tierName, message: `Already checked in at ${result.conflict.stationName} at ${conflictTime}` });
        setRecentScans((prev) => [{ id: crypto.randomUUID(), guestName: result.guest.name, tierName: result.guest.tierName, time: timeStr, status: "conflict" as const }, ...prev].slice(0, 5));
      } else {
        setScanResult({ type: "error", guestName: result.guest?.name, message: result.error });
        setRecentScans((prev) => [{ id: crypto.randomUUID(), guestName: result.guest?.name || "Unknown", tierName: result.guest?.tierName || "—", time: timeStr, status: "error" as const }, ...prev].slice(0, 5));
      }
    } catch (err: any) {
      setScanResult({ type: "error", message: err.message || "Check-in failed" });
    }
  }, [isOnline, stationId]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <StationHeader stationName={stationName} isOnline={isOnline} pendingCount={pendingCount} />
      <ScanResult result={scanResult} onDismiss={() => setScanResult(null)} />
      <ScanInput onScan={handleScan} />
      <ManualLookup eventId={eventId} onSelect={handleScan} isOnline={isOnline} />
      <div className="px-4 mt-6 flex gap-4">
        <div className="flex-1 bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{totalCheckins}</div>
          <div className="text-xs text-gray-400 mt-1">Station Total</div>
        </div>
      </div>
      <RecentScans scans={recentScans} />
      {syncResults && <SyncSummary results={syncResults} onClose={() => setSyncResults(null)} />}
    </div>
  );
}
