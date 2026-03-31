interface StationData {
  stationName: string;
  type: string;
  count: number;
}

interface StationBreakdownProps {
  stations: StationData[];
}

export default function StationBreakdown({ stations }: StationBreakdownProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">By Station</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2">Station</th>
            <th className="pb-2">Type</th>
            <th className="pb-2 text-right">Check-ins</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station) => (
            <tr key={station.stationName} className="border-b last:border-0">
              <td className="py-2 font-medium">{station.stationName}</td>
              <td className="py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${station.type === "VIP" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>{station.type}</span>
              </td>
              <td className="py-2 text-right">{station.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
