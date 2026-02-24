import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import GlassTooltip from "@/components/GlassTooltip";
import { fetchComparison, fetchFeedstocks } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const OMEGA_COLORS = { 5: "#2563EB", 10: "#10B981", 15: "#8B5CF6", 20: "#F59E0B", 25: "#EC4899" };

function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  if (typeof n === 'number') return n.toFixed(2);
  return n;
}

export default function ComparisonPage() {
  const [feedstock, setFeedstock] = useState("calcite");
  const [feedstocks, setFeedstocks] = useState([]);
  const [compData, setCompData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedstocks().then(data => setFeedstocks(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchComparison(feedstock).then(data => {
      setCompData(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [feedstock]);

  if (loading) return <div className="space-y-6"><Skeleton className="h-12" /><Skeleton className="h-80" /></div>;

  // Prepare comparison bar chart data - regions as categories, omega values as series
  const allRegions = new Set();
  compData.forEach(d => d.regions?.forEach(r => allRegions.add(r.region)));

  const regionCompData = [...allRegions].map(region => {
    const entry = { region };
    compData.forEach(d => {
      const rd = d.regions?.find(r => r.region === region);
      entry[`cdr_omega_${d.omega_threshold}`] = rd?.total_cdr || 0;
      entry[`rock_omega_${d.omega_threshold}`] = rd?.avg_rock_add || 0;
      entry[`success_omega_${d.omega_threshold}`] = rd?.success_rate || 0;
    });
    return entry;
  });

  // Totals comparison
  const totalsData = compData.map(d => ({
    omega: `Omega = ${d.omega_threshold}`,
    omega_val: d.omega_threshold,
    total_cdr: d.total_cdr || 0,
    avg_rock_add: d.avg_rock_add || 0,
    total_samples: d.total_samples || 0,
  }));

  return (
    <div className="space-y-6" data-testid="comparison-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "'Work Sans', sans-serif" }}>Omega Threshold Comparison</h2>
          <p className="text-sm text-slate-500 mt-0.5">Compare CDR potential across different omega thresholds</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Feedstock</label>
          <Select value={feedstock} onValueChange={setFeedstock}>
            <SelectTrigger className="w-40 h-9 text-sm" data-testid="comparison-feedstock-select">
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
      </div>

      {compData.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
          <p className="text-slate-500">No comparison data available. Upload datasets for different omega thresholds to compare.</p>
        </div>
      )}

      {compData.length > 0 && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {compData.map(d => (
              <div key={d.omega_threshold} className="bg-white border border-slate-200 rounded-sm p-4 border-l-4"
                style={{ borderLeftColor: OMEGA_COLORS[d.omega_threshold] || "#2563EB" }}
                data-testid={`comparison-card-omega-${d.omega_threshold}`}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="font-mono text-xs">Omega = {d.omega_threshold}</Badge>
                </div>
                <p className="text-xl font-semibold font-mono text-slate-900">{formatNumber(d.total_cdr)}</p>
                <p className="text-xs text-slate-500">t CO2/yr total CDR</p>
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                  <p className="text-xs text-slate-500">Avg Rock: <span className="font-mono text-slate-700">{d.avg_rock_add?.toFixed(4)}</span> mol/kg</p>
                  <p className="text-xs text-slate-500">Samples: <span className="font-mono text-slate-700">{d.total_samples}</span></p>
                </div>
              </div>
            ))}
          </div>

          {/* Total CDR comparison bar */}
          <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="total-cdr-comparison">
            <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>Total CDR by Omega Threshold</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={totalsData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="omega" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={formatNumber} />
                <Tooltip content={<GlassTooltip formatter={v => formatNumber(v)} />} />
                <Bar dataKey="total_cdr" name="Total CDR (t/yr)" radius={[4, 4, 0, 0]} fill="#2563EB">
                  {totalsData.map((d, i) => (
                    <Cell key={i} fill={OMEGA_COLORS[d.omega_val] || "#2563EB"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Region-wise comparison */}
          {compData.length > 1 && regionCompData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="region-omega-comparison">
              <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>CDR by Region across Omega Thresholds</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={regionCompData} margin={{ top: 5, right: 20, left: 10, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="region" tick={{ fontSize: 9, fill: "#64748B" }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={formatNumber} />
                  <Tooltip content={<GlassTooltip formatter={v => formatNumber(v)} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {compData.map(d => (
                    <Bar key={d.omega_threshold} dataKey={`cdr_omega_${d.omega_threshold}`}
                      name={`Omega=${d.omega_threshold}`}
                      fill={OMEGA_COLORS[d.omega_threshold] || "#2563EB"}
                      radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed table */}
          <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="comparison-detail-table">
            <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>Detailed Comparison</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-mono uppercase tracking-wider">Omega</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Total CDR (t/yr)</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Avg Rock Add</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Total Samples</TableHead>
                    <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Regions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compData.map(d => (
                    <TableRow key={d.omega_threshold} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <Badge style={{ backgroundColor: OMEGA_COLORS[d.omega_threshold] || "#2563EB", color: "white" }} className="font-mono text-xs">
                          {d.omega_threshold}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">{formatNumber(d.total_cdr)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{d.avg_rock_add?.toFixed(4) || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{d.total_samples}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{d.regions?.length || 0}</TableCell>
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
