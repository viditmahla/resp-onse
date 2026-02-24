import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchFeedstocks } from "@/lib/api";

const OMEGA_OPTIONS = [5, 10, 15, 20, 25];

export default function FeedstockSelector({ feedstock, omega, onFeedstockChange, onOmegaChange }) {
  const [feedstocks, setFeedstocks] = useState([]);

  useEffect(() => {
    fetchFeedstocks().then(data => setFeedstocks(data || [])).catch(() => {});
  }, []);

  const availableOmegas = feedstocks.find(f => f.name === feedstock)?.omega_thresholds || [5];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Feedstock</label>
        <Select value={feedstock} onValueChange={onFeedstockChange}>
          <SelectTrigger className="w-40 h-9 text-sm" data-testid="feedstock-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {feedstocks.length > 0 ? (
              feedstocks.map(f => (
                <SelectItem key={f.name} value={f.name}>{f.name.charAt(0).toUpperCase() + f.name.slice(1)}</SelectItem>
              ))
            ) : (
              <SelectItem value="calcite">Calcite</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Omega Threshold</label>
        <div className="flex gap-1">
          {OMEGA_OPTIONS.map(o => {
            const available = availableOmegas.includes(o);
            return (
              <button
                key={o}
                onClick={() => available && onOmegaChange(o)}
                disabled={!available}
                data-testid={`omega-${o}`}
                className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-150 ${
                  omega === o
                    ? "bg-slate-900 text-white"
                    : available
                    ? "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    : "bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
