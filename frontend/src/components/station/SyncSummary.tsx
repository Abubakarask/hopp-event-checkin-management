interface SyncResult {
  qrToken: string;
  success: boolean;
  guest?: { name: string; tierName?: string };
  conflict?: { stationName: string; checkedInAt: string };
  error?: string;
}

interface SyncSummaryProps {
  results: SyncResult[];
  onClose: () => void;
}

export default function SyncSummary({ results, onClose }: SyncSummaryProps) {
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Sync Complete</h2>
          <p className="text-sm text-gray-400 mt-1">{succeeded} succeeded, {failed} conflicted</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${r.success ? "bg-green-900/30" : "bg-red-900/30"}`}>
              <div>
                <div className="text-sm text-white">{r.guest?.name || r.qrToken}</div>
                {r.conflict && <div className="text-xs text-red-400">Already at {r.conflict.stationName}</div>}
                {r.error && <div className="text-xs text-yellow-400">{r.error}</div>}
              </div>
              <span className="text-lg">{r.success ? "\u2705" : "\u274C"}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-700">
          <button onClick={onClose} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
}
