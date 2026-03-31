interface TierData {
  tierName: string;
  confirmed: number;
  checkedIn: number;
  total: number;
}

interface TierBreakdownProps {
  tiers: TierData[] | null;
}

export default function TierBreakdown({ tiers }: TierBreakdownProps) {
  if (!tiers) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between border-b pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">By Tier</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2">Tier</th>
            <th className="pb-2 text-right">Confirmed</th>
            <th className="pb-2 text-right">Checked In</th>
            <th className="pb-2 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.tierName} className="border-b last:border-0">
              <td className="py-2 font-medium">{tier.tierName}</td>
              <td className="py-2 text-right">{tier.confirmed}</td>
              <td className="py-2 text-right">{tier.checkedIn}</td>
              <td className="py-2 text-right">{tier.confirmed > 0 ? Math.round((tier.checkedIn / tier.confirmed) * 100) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
