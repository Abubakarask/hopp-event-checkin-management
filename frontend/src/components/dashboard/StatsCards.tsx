interface Stats {
  total: {
    confirmed: number;
    checkedIn: number;
    waitlisted: number;
    cancelled: number;
  };
  rate: { current: number; history?: number[] };
}

interface StatsCardsProps {
  stats: Stats | null;
}

function Sparkline({ data, colorClass }: { data: number[]; colorClass: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const w = 100;
  const h = 30;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (d / max) * h;
    return `${x},${y}`;
  }).join(" ");
  
  const fillPoints = `0,${h} ${points} ${w},${h}`;
  
  return (
    <svg className={`w-full h-12 mt-3 ${colorClass}`} viewBox={`-2 -2 ${w + 4} ${h + 4}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${colorClass}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#gradient-${colorClass})`} points={fillPoints} />
      <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" points={points} />
    </svg>
  );
}

export default function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse h-28" />
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
    { label: "Arrivals / min", value: stats.rate.current, sub: "last 15 mins", color: "text-blue-600", history: stats.rate.history },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</div>
            {card.sub && <div className="text-xs text-gray-400 mt-1">{card.sub}</div>}
          </div>
          {card.history && <Sparkline data={card.history} colorClass={card.color} />}
        </div>
      ))}
    </div>
  );
}
