interface StationHeaderProps {
  stationName: string;
  isOnline: boolean;
  pendingCount: number;
}

export default function StationHeader({ stationName, isOnline, pendingCount }: StationHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
      <h1 className="text-lg font-bold text-white truncate">{stationName}</h1>
      <div className="flex items-center gap-2">
        {!isOnline && pendingCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium bg-orange-600 text-white rounded-full">
            {pendingCount} pending
          </span>
        )}
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${isOnline ? "bg-green-900/50 text-green-400" : "bg-orange-900/50 text-orange-400"}`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-orange-400 animate-pulse"}`} />
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>
    </header>
  );
}
