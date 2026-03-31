interface Stats {
  total: {
    confirmed: number;
    checkedIn: number;
    waitlisted: number;
    cancelled: number;
  };
  rate: { current: number };
}

interface StatsCardsProps {
  stats: Stats | null;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Checked In",
      value: `${stats.total.checkedIn} / ${stats.total.confirmed}`,
      sub: `${stats.total.confirmed > 0 ? Math.round((stats.total.checkedIn / stats.total.confirmed) * 100) : 0}%`,
      color: "text-green-600",
    },
    { label: "Waitlisted", value: stats.total.waitlisted, sub: "awaiting promotion", color: "text-yellow-600" },
    { label: "Cancelled", value: stats.total.cancelled, sub: "", color: "text-red-600" },
    { label: "Arrivals / min", value: stats.rate.current, sub: "last 60 seconds", color: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">{card.label}</div>
          <div className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</div>
          {card.sub && <div className="text-xs text-gray-400 mt-1">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}
