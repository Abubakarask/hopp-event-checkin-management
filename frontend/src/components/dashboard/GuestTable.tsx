import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  tierName: string;
  tierId: string;
  status: string;
  qrToken: string;
  checkedInAt: string | null;
  checkinStationName: string | null;
}

interface GuestTableProps {
  eventId: string;
  tiers: Array<{ tierId: string; tierName: string }>;
  refreshKey: number;
}

export default function GuestTable({ eventId, tiers, refreshKey }: GuestTableProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    const params: Record<string, string> = { eventId, page: page.toString(), limit: limit.toString(), sortBy, sortOrder };
    if (search) params.search = search;
    if (statusFilter && statusFilter !== "ALL") params.status = statusFilter;
    if (tierFilter) params.tier = tierFilter;

    const data = await api.getGuests(params);
    setGuests(data.guests);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  }, [eventId, page, limit, search, statusFilter, tierFilter, sortBy, sortOrder]);

  useEffect(() => { fetchGuests(); }, [fetchGuests, refreshKey]);

  const handleSort = (column: string) => {
    if (sortBy === column) { setSortOrder((o) => (o === "asc" ? "desc" : "asc")); }
    else { setSortBy(column); setSortOrder("asc"); }
    setPage(1);
  };

  const handleStatusChange = async (guestId: string, newStatus: string) => {
    setUpdating(guestId);
    try {
      await api.updateGuestStatus(guestId, newStatus);
      await fetchGuests();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally { setUpdating(null); }
  };

  const handleExport = () => {
    const params: Record<string, string> = { eventId };
    if (search) params.search = search;
    if (statusFilter && statusFilter !== "ALL") params.status = statusFilter;
    if (tierFilter) params.tier = tierFilter;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    window.open(api.getGuestExportUrl(params), "_blank");
  };

  const displayStatus = (guest: Guest) => guest.checkedInAt ? "CHECKED_IN" : guest.status;

  const statusColor = (status: string) => {
    switch (status) {
      case "CHECKED_IN": return "bg-green-100 text-green-700";
      case "CONFIRMED": return "bg-blue-100 text-blue-700";
      case "WAITLISTED": return "bg-yellow-100 text-yellow-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <span className="text-gray-300 ml-1">&udarr;</span>;
    return <span className="ml-1">{sortOrder === "asc" ? "\u2191" : "\u2193"}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search name, email, phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="WAITLISTED">Waitlisted</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Tiers</option>
          {tiers.map((t) => <option key={t.tierId} value={t.tierId}>{t.tierName}</option>)}
        </select>
        <button onClick={handleExport} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Export CSV</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort("name")}>Name <SortIcon column="name" /></th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort("tier")}>Tier <SortIcon column="tier" /></th>
              <th className="px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort("status")}>Status <SortIcon column="status" /></th>
              <th className="px-4 py-3">Checked In</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => {
              const status = displayStatus(guest);
              return (
                <tr key={guest.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{guest.name}</td>
                  <td className="px-4 py-3 text-gray-600">{guest.email}</td>
                  <td className="px-4 py-3 text-gray-600">{guest.phone || "—"}</td>
                  <td className="px-4 py-3">{guest.tierName}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(status)}`}>{status}</span></td>
                  <td className="px-4 py-3 text-gray-600">
                    {guest.checkedInAt ? `${new Date(guest.checkedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} @ ${guest.checkinStationName}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {!guest.checkedInAt && (
                      <select value={guest.status} onChange={(e) => handleStatusChange(guest.id, e.target.value)} disabled={updating === guest.id} className="text-xs px-2 py-1 border rounded disabled:opacity-50">
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="WAITLISTED">Waitlisted</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded text-xs">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span>per page</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        </div>
      </div>
    </div>
  );
}
