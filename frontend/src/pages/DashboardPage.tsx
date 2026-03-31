import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useEventId } from "../hooks/useEventId";
import StatsCards from "../components/dashboard/StatsCards";
import TierBreakdown from "../components/dashboard/TierBreakdown";
import StationBreakdown from "../components/dashboard/StationBreakdown";
import GuestTable from "../components/dashboard/GuestTable";

export default function DashboardPage() {
  const eventId = useEventId();
  const [stats, setStats] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchStats = () => {
      setIsRefreshing(true);
      api.getStats(eventId)
         .then((data) => {
            setStats(data);
            setLastUpdated(new Date());
         })
         .catch(console.error)
         .finally(() => setIsRefreshing(false));
    };

    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
      setRefreshKey((k) => k + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId]);

  const tiers = stats?.byTier || null;
  const stations = stats?.byStation || null;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Host Dashboard</h1>
            {lastUpdated && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
          {!eventId && <span className="text-sm text-red-500">No event ID set. Run the seed and set localStorage.eventId</span>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <StatsCards stats={stats} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TierBreakdown tiers={tiers} />
          <StationBreakdown stations={stations} />
        </div>
        <GuestTable eventId={eventId} tiers={tiers || []} refreshKey={refreshKey} />
      </main>
    </div>
  );
}
