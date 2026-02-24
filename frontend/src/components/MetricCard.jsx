import { cn } from "@/lib/utils";

export default function MetricCard({ label, value, unit, icon: Icon, color = "blue", className, testId }) {
  const colorMap = {
    blue: "border-l-blue-500",
    green: "border-l-emerald-500",
    violet: "border-l-violet-500",
    amber: "border-l-amber-500",
    rose: "border-l-rose-500",
    indigo: "border-l-indigo-500",
    slate: "border-l-slate-500",
  };

  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-sm p-4 border-l-4 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5",
        colorMap[color] || colorMap.blue,
        className
      )}
      data-testid={testId || "metric-card"}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 font-mono tracking-tight">{value}</p>
          {unit && <p className="text-xs text-slate-500 mt-0.5">{unit}</p>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-500" />
          </div>
        )}
      </div>
    </div>
  );
}
