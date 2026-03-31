import { useState, useEffect } from "react";
import { api } from "../../lib/api";

interface ManualLookupProps {
  eventId: string;
  onSelect: (qrToken: string) => void;
  isOnline: boolean;
}

interface GuestResult {
  id: string;
  name: string;
  email: string;
  tierName: string;
  status: string;
  qrToken: string;
  checkedInAt: string | null;
}

export default function ManualLookup({ eventId, onSelect, isOnline }: ManualLookupProps) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GuestResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search || search.length < 2 || !isOnline) { setResults([]); return; }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.getGuests({ eventId, search, limit: "5" });
        setResults(data.guests);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, eventId, isOnline]);

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="mx-4 mt-4 w-[calc(100%-2rem)] flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-750 transition-colors">
        <span className="text-lg">&#128269;</span>
        <div className="text-left">
          <div className="text-sm font-medium">Manual Lookup</div>
          <div className="text-xs text-gray-500">Search by name / email</div>
        </div>
      </button>
    );
  }

  return (
    <div className="mx-4 mt-4 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-gray-700">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..." autoFocus className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm" />
        <button onClick={() => { setExpanded(false); setSearch(""); setResults([]); }} className="text-gray-400 hover:text-white text-sm px-2">Close</button>
      </div>

      {!isOnline && <div className="px-3 py-2 text-xs text-orange-400">Manual lookup unavailable offline</div>}
      {loading && <div className="px-3 py-2 text-xs text-gray-400">Searching...</div>}

      {results.map((guest) => (
        <button key={guest.id} onClick={() => { onSelect(guest.qrToken); setExpanded(false); setSearch(""); setResults([]); }} disabled={!!guest.checkedInAt} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-0 disabled:opacity-50">
          <div className="text-left">
            <div className="text-sm text-white">{guest.name}</div>
            <div className="text-xs text-gray-400">{guest.email}</div>
          </div>
          <div className="text-right">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{guest.tierName}</span>
            {guest.checkedInAt && <div className="text-xs text-red-400 mt-0.5">Checked in</div>}
          </div>
        </button>
      ))}
    </div>
  );
}
