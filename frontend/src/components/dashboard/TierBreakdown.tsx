interface TierData {
  tierName: string;
  confirmed: number;
  checkedIn: number;
  total: number;
}

interface TierBreakdownProps {
  tiers: TierData[];
}

export default function TierBreakdown({ tiers }: TierBreakdownProps) {
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
