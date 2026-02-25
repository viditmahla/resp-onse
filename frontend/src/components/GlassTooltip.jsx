import React from "react";

function GlassTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-tooltip">
      {label && <p className="text-[11px] font-semibold text-gray-900 mb-1">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-mono font-medium text-gray-700">
            {formatter
              ? formatter(entry.value, entry.name)
              : typeof entry.value === "number"
              ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default GlassTooltip;
