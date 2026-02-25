import { useState, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ChartCard from "@/components/ChartCard";
import { fetchMapData, fetchBasinStats } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const BASIN_COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#06B6D4", "#84CC16", "#EF4444"];

const fmt = (n) => {
  if (n == null) return "—";
  if (typeof n === "number") return n.toFixed(1);
  return n;
};

export default function MapPage() {
  const [mapData, setMapData] = useState([]);
  const [basins, setBasins] = useState([]);
  const [colorBy, setColorBy] = useState("region");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMapData(), fetchBasinStats()])
      .then(([md, bs]) => { setMapData(md); setBasins(bs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const basinColorMap = {};
  basins.forEach((b, i) => { basinColorMap[b.basin] = BASIN_COLORS[i % BASIN_COLORS.length]; });

  const getColor = (d) => {
    if (colorBy === "region") return basinColorMap[d.region] || "#94a3b8";
    if (colorBy === "alkalinity") {
      const ta = d.alkalinity || 0;
      const t = Math.min(ta / 6000, 1);
      return `rgb(${Math.round(16 + 223 * (1-t))}, ${Math.round(185 - 117 * t)}, ${Math.round(129 - 61 * t)})`;
    }
    if (colorBy === "ph") {
      const ph = d.ph || 7;
      const t = Math.min(Math.max((ph - 6) / 3, 0), 1);
      return `rgb(${Math.round(239 - 200 * t)}, ${Math.round(68 + 117 * t)}, ${Math.round(68 + 61 * t)})`;
    }
    if (colorBy === "cdr") {
      const cdr = d.cdr_t_yr || 0;
      const t = Math.min(cdr / 5e6, 1);
      return `rgb(${Math.round(37 + 202 * (1-t))}, ${Math.round(99 + 156 * (1-t))}, ${Math.round(235 - 175 * (1-t)})`;
    }
    return "#94a3b8";
  };

  if (loading) return <div className="space-y-6"><Skeleton className="h-12 w-48" /><Skeleton className="h-[500px] rounded-xl" /></div>;

  return (
    <div className="space-y-8" data-testid="map-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="anim-fade-up">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Map</h1>
          <p className="text-base text-gray-400 mt-2">Geographic distribution of river sampling locations across India</p>
        </div>
        <div className="flex items-center gap-2 anim-fade-up delay-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">Color by</span>
          <Select value={colorBy} onValueChange={setColorBy}>
            <SelectTrigger className="w-40 h-9 text-sm rounded-lg" data-testid="map-color-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="region">Basin / Region</SelectItem>
              <SelectItem value="alkalinity">Total Alkalinity</SelectItem>
              <SelectItem value="ph">pH</SelectItem>
              <SelectItem value="cdr">CDR Potential</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ChartCard title={`${mapData.length} Sampling Locations`} subtitle={`Colored by ${colorBy}`} testId="india-map" className="anim-fade-up delay-2">
        <ResponsiveContainer width="100%" height={560}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="longitude" name="Lon" type="number" domain={[68, 98]}
              tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}
              label={{ value: "Longitude (°E)", position: "bottom", offset: 20, fontSize: 11, fill: "#9ca3af" }} />
            <YAxis dataKey="latitude" name="Lat" type="number" domain={[6, 38]}
              tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}
              label={{ value: "Latitude (°N)", angle: -90, position: "insideLeft", offset: 5, fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div className="glass-tooltip">
                  <p className="text-[11px] font-semibold text-gray-900">{d?.river_name || 'Unknown'}</p>
                  <p className="text-[10px] text-gray-400">{d?.state} — {d?.region}</p>
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-[10px] font-mono">TA: {fmt(d?.alkalinity)} umol/L</p>
                    <p className="text-[10px] font-mono">pH: {d?.ph?.toFixed(2)}</p>
                    <p className="text-[10px] font-mono">CDR: {fmt(d?.cdr_t_yr)} t/yr</p>
                    <p className="text-[10px] font-mono">SI Calcite: {d?.si_calcite?.toFixed(2)}</p>
                  </div>
                </div>
              );
            }} />
            <Scatter data={mapData} fillOpacity={0.65}>
              {mapData.map((d, i) => <Cell key={i} fill={getColor(d)} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Legend */}
      {colorBy === "region" && (
        <div className="flex flex-wrap gap-3 anim-fade-up delay-3" data-testid="map-legend">
          {basins.map((b, i) => (
            <div key={b.basin} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: BASIN_COLORS[i % BASIN_COLORS.length] }} />
              <span className="text-xs text-gray-500">{b.basin}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
