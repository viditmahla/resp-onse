import { useState, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import FeedstockSelector from "@/components/FeedstockSelector";
import GlassTooltip from "@/components/GlassTooltip";
import { fetchSamples, fetchMapData, fetchFilters } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const CHART_COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#06B6D4", "#84CC16"];

function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  if (typeof n === 'number') return n.toFixed(2);
  return n;
}

export default function SimulatorPage() {
  const [feedstock, setFeedstock] = useState("calcite");
  const [omega, setOmega] = useState(5);
  const [region, setRegion] = useState("");
  const [filters, setFilters] = useState({ regions: [], states: [] });
  const [samples, setSamples] = useState({ samples: [], total: 0 });
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilters(feedstock, omega).then(setFilters).catch(() => {});
  }, [feedstock, omega]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSamples(feedstock, omega, region || undefined, undefined, 500),
      fetchMapData(feedstock, omega),
    ]).then(([samp, map]) => {
      setSamples(samp);
      setMapData(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [feedstock, omega, region]);

  // Group scatter data by region for color coding
  const scatterByRegion = {};
  (samples.samples || []).forEach(s => {
    if (s.discharge && s.cdr_t_yr && s.cdr_t_yr > 0) {
      const r = s.region || "Unknown";
      if (!scatterByRegion[r]) scatterByRegion[r] = [];
      scatterByRegion[r].push({ x: s.discharge, y: s.cdr_t_yr, name: s.river_name, region: r });
    }
  });

  const rockVsCdr = {};
  (samples.samples || []).forEach(s => {
    if (s.rock_addition && s.cdr_t_yr && s.cdr_t_yr > 0) {
      const r = s.region || "Unknown";
      if (!rockVsCdr[r]) rockVsCdr[r] = [];
      rockVsCdr[r].push({ x: s.rock_addition, y: s.cdr_t_yr, name: s.river_name, region: r });
    }
  });

  const regionKeys = Object.keys(scatterByRegion);

  return (
    <div className="space-y-6" data-testid="simulator-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "'Work Sans', sans-serif" }}>ERW Simulator</h2>
          <p className="text-sm text-slate-500 mt-0.5">Explore sample data and CDR relationships</p>
        </div>
        <FeedstockSelector feedstock={feedstock} omega={omega} onFeedstockChange={setFeedstock} onOmegaChange={setOmega} />
      </div>

      {/* Region Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Filter Region</label>
        <Select value={region} onValueChange={v => setRegion(v === "all" ? "" : v)}>
          <SelectTrigger className="w-56 h-9 text-sm" data-testid="region-filter">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {filters.regions.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="font-mono text-xs" data-testid="sample-count-badge">
          {samples.total} samples
        </Badge>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          {/* Scatter Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="discharge-vs-cdr-chart">
              <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Discharge vs CDR Potential
              </h3>
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="x" name="Discharge" tick={{ fontSize: 10, fill: "#64748B" }} label={{ value: "Discharge (m³/s)", position: "bottom", offset: 10, fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="y" name="CDR" tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={formatNumber} label={{ value: "CDR (t/yr)", angle: -90, position: "insideLeft", offset: 5, fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip content={<GlassTooltip formatter={formatNumber} />} />
                  {regionKeys.map((r, i) => (
                    <Scatter key={r} name={r} data={scatterByRegion[r]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.7} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="rock-vs-cdr-chart">
              <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Rock Addition vs CDR Potential
              </h3>
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="x" name="Rock Add" tick={{ fontSize: 10, fill: "#64748B" }} label={{ value: "Rock Addition (mol/kg)", position: "bottom", offset: 10, fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="y" name="CDR" tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={formatNumber} label={{ value: "CDR (t/yr)", angle: -90, position: "insideLeft", offset: 5, fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip content={<GlassTooltip formatter={formatNumber} />} />
                  {Object.keys(rockVsCdr).map((r, i) => (
                    <Scatter key={r} name={r} data={rockVsCdr[r]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.7} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Map visualization - Lat/Lon scatter */}
          <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="map-scatter">
            <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>
              Sampling Locations (Geographic View)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="longitude" name="Longitude" tick={{ fontSize: 10, fill: "#64748B" }} domain={['dataMin - 1', 'dataMax + 1']}
                  label={{ value: "Longitude (°E)", position: "bottom", offset: 10, fontSize: 11, fill: "#94a3b8" }} type="number" />
                <YAxis dataKey="latitude" name="Latitude" tick={{ fontSize: 10, fill: "#64748B" }} domain={['dataMin - 1', 'dataMax + 1']}
                  label={{ value: "Latitude (°N)", angle: -90, position: "insideLeft", offset: 5, fontSize: 11, fill: "#94a3b8" }} type="number" />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="glass-tooltip">
                      <p className="text-xs font-semibold text-slate-900">{d?.river_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{d?.state} — {d?.region}</p>
                      <p className="text-xs font-mono mt-1">CDR: {formatNumber(d?.cdr_t_yr)} t/yr</p>
                      <p className="text-xs font-mono">pH: {d?.ph?.toFixed(2)}</p>
                    </div>
                  );
                }} />
                <Scatter data={mapData} fill="#2563EB" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Samples Table */}
          <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="samples-table">
            <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>
              Sample Data ({samples.total} total)
            </h3>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-mono uppercase tracking-wider">Sample</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider">River</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider">Region</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">pH</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Alk (umol/L)</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Temp (C)</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Rock Add</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Omega Final</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">CDR (t/yr)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(samples.samples || []).slice(0, 100).map((s, i) => (
                    <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-xs">{s.sample_no}</TableCell>
                      <TableCell className="text-sm">{s.river_name}</TableCell>
                      <TableCell className="text-sm text-slate-500">{s.region}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{s.ph?.toFixed(2) || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(s.alkalinity)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{s.temp_c?.toFixed(1) || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{s.rock_addition?.toFixed(4) || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{s.omega_final?.toFixed(2) || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">{formatNumber(s.cdr_t_yr)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
