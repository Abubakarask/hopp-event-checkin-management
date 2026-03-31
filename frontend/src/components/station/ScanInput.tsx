import { useRef, useEffect, useState } from "react";

interface ScanInputProps {
  onScan: (qrToken: string) => void;
  disabled?: boolean;
}

export default function ScanInput({ onScan, disabled }: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    const refocus = () => {
      if (inputRef.current && !disabled) inputRef.current.focus();
    };
    refocus();
    const interval = setInterval(refocus, 1000);
    return () => clearInterval(interval);
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onScan(trimmed);
      setValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 mt-6">
      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Ready to Scan</label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Place QR Code / Enter Token"
        disabled={disabled}
        className="w-full px-4 py-4 text-lg bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        autoComplete="off"
      />
    </form>
  );
}
