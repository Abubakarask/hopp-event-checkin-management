export interface RecentScan {
  id: string;
  guestName: string;
  tierName: string;
  time: string;
  status: "success" | "conflict" | "error" | "queued";
}

interface RecentScansProps {
  scans: RecentScan[];
}

const STATUS_BADGE = {
  success: "bg-green-900/50 text-green-400",
  conflict: "bg-red-900/50 text-red-400",
  error: "bg-yellow-900/50 text-yellow-400",
  queued: "bg-orange-900/50 text-orange-400",
};

const STATUS_LABEL = {
  success: "OK",
  conflict: "Duplicate",
  error: "Rejected",
  queued: "Queued",
};

export default function RecentScans({ scans }: RecentScansProps) {
  if (scans.length === 0) return null;

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-gray-400 uppercase tracking-wider">Recent Activity</h3>
        <span className="text-xs text-gray-500">Last 5 scans</span>
      </div>
      <div className="space-y-2">
        {scans.map((scan) => (
          <div key={scan.id} className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg">
            <div>
              <div className="text-sm text-white">{scan.guestName}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">{scan.tierName}</span>
                <span className="text-xs text-gray-500">{scan.time}</span>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[scan.status]}`}>{STATUS_LABEL[scan.status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
