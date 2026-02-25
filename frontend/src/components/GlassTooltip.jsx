import React from "react";

export default function GlassTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-tooltip">
      {label && <p className="text-[11px] font-semibold text-gray-900 mb-1">{label}</p>}
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
          <span className="text-gray-400">{e.name}:</span>
          <span className="font-mono font-medium text-gray-700">
            {formatter ? formatter(e.value, e.name) : (typeof e.value === "number" ? e.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : e.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
