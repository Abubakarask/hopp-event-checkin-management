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

  useEffect(() => {
    if (!eventId) return;

    const fetchStats = () => {
      api.getStats(eventId).then(setStats).catch(console.error);
    };

    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
      setRefreshKey((k) => k + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId]);

  const tiers = stats?.byTier.map((t: any) => ({ tierId: t.tierId, tierName: t.tierName })) || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Host Dashboard</h1>
          {!eventId && <span className="text-sm text-red-500">No event ID set. Run the seed and set localStorage.eventId</span>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <StatsCards stats={stats} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TierBreakdown tiers={stats?.byTier || []} />
          <StationBreakdown stations={stats?.byStation || []} />
        </div>
        <GuestTable eventId={eventId} tiers={tiers} refreshKey={refreshKey} />
      </main>
    </div>
  );
}
