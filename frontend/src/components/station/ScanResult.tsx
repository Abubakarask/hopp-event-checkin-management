import { useEffect } from "react";

export interface ScanResultData {
  type: "success" | "conflict" | "error" | "queued";
  guestName?: string;
  tierName?: string;
  message?: string;
}

interface ScanResultProps {
  result: ScanResultData | null;
  onDismiss: () => void;
}

const COLORS = {
  success: "bg-green-600",
  conflict: "bg-red-600",
  error: "bg-yellow-600",
  queued: "bg-orange-600",
};

const TITLES = {
  success: "ACCESS GRANTED",
  conflict: "ALREADY CHECKED IN",
  error: "CANNOT CHECK IN",
  queued: "QUEUED OFFLINE",
};

export default function ScanResult({ result, onDismiss }: ScanResultProps) {
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [result, onDismiss]);

  if (!result) return null;

  return (
    <div className={`${COLORS[result.type]} mx-4 mt-4 p-6 rounded-2xl text-white text-center transition-all`} onClick={onDismiss}>
      <div className="text-2xl font-black tracking-wide">{TITLES[result.type]}</div>
      {result.guestName && (
        <div className="mt-2 text-lg font-medium">
          {result.tierName && <span className="opacity-80">{result.tierName} &bull; </span>}
          {result.guestName}
        </div>
      )}
      {result.message && <div className="mt-2 text-sm opacity-90">{result.message}</div>}
    </div>
  );
}
