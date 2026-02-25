import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Legend, Cell } from "recharts";
import ChartCard from "@/components/ChartCard";
import GlassTooltip from "@/components/GlassTooltip";
import { fetchDashboardOverview, fetchRegionsCdr, fetchTopRivers, fetchSummary, fetchComparison, fetchFeedstocks, fetchSamples } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Beaker, CheckCircle, Mountain, Zap, Droplets } from "lucide-react";

const OMEGA_OPTIONS = [5, 10, 15, 20, 25];
const OMEGA_COLORS = { 5: "#2563EB", 10: "#10B981", 15: "#8B5CF6", 20: "#F59E0B", 25: "#EC4899" };
const BASIN_COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#06B6D4", "#84CC16", "#EF4444"];

const fmt = (n) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1e9) return (n/1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(1) + "K";
  return typeof n === "number" ? n.toFixed(2) : n;
};

function KPI({ label, value, unit, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:shadow-sm" data-testid={`kpi-${label.toLowerCase().replace(/\s/g,'-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 font-mono tracking-tight">{value}</p>
          {unit && <p className="text-[11px] text-gray-400 mt-0.5">{unit}</p>}
        </div>
        {Icon && <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>}
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  const [feedstock, setFeedstock] = useState("calcite");
  const [omega, setOmega] = useState(5);
  const [feedstocks, setFeedstocks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [regions, setRegions] = useState([]);
  const [topRivers, setTopRivers] = useState([]);
  const [compData, setCompData] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFeedstocks().then(d => setFeedstocks(d || [])).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDashboardOverview(feedstock, omega),
      fetchRegionsCdr(feedstock, omega),
      fetchTopRivers(feedstock, omega, 10),
      fetchSummary(feedstock, omega),
      fetchComparison(feedstock),
    ]).then(([ov, reg, riv, sum, comp]) => {
      setOverview(ov); setRegions(reg); setTopRivers(riv); setSummary(sum); setCompData(comp);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [feedstock, omega]);

  const availableOmegas = feedstocks.find(f => f.name === feedstock)?.omega_thresholds || [5];

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-80" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );

  // Prepare comparison chart data
  const allRegions = new Set();
  compData.forEach(d => d.regions?.forEach(r => allRegions.add(r.region)));
  const regionCompData = [...allRegions].map(region => {
    const entry = { region: region.length > 18 ? region.slice(0,16) + '...' : region };
    compData.forEach(d => {
      const rd = d.regions?.find(r => r.region === region);
      entry[`omega_${d.omega_threshold}`] = rd?.total_cdr || 0;
    });
    return entry;
  });

  return (
    <div className="space-y-8" data-testid="simulator-page">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="anim-fade-up">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>ERW Simulator</h1>
          <p className="text-base text-gray-400 mt-2">Enhanced Rock Weathering model outputs and CDR potential</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap anim-fade-up delay-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">Feedstock</span>
            <Select value={feedstock} onValueChange={setFeedstock}>
              <SelectTrigger className="w-36 h-9 text-sm rounded-lg" data-testid="feedstock-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {feedstocks.map(f => <SelectItem key={f.name} value={f.name}>{f.name.charAt(0).toUpperCase() + f.name.slice(1)}</SelectItem>)}
                {!feedstocks.length && <SelectItem value="calcite">Calcite</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">Omega</span>
            <div className="flex gap-1">
              {OMEGA_OPTIONS.map(o => {
                const avail = availableOmegas.includes(o);
                return (
                  <button key={o} onClick={() => avail && setOmega(o)} disabled={!avail} data-testid={`omega-${o}`}
                    className={`px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all duration-150 ${
                      omega === o ? "bg-gray-900 text-white" :
                      avail ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50" :
                      "bg-gray-50 text-gray-300 cursor-not-allowed"
                    }`}>{o}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="bg-gray-100/80 p-1 rounded-full inline-flex" data-testid="sim-tabs">
          <TabsTrigger value="analysis" data-testid="tab-analysis" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">General Analysis</TabsTrigger>
          <TabsTrigger value="comparison" data-testid="tab-comparison" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Omega Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6 anim-fade-up">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <KPI label="Total CDR" value={fmt(overview?.total_cdr_t_yr)} unit="t CO₂/yr" icon={TrendingUp} color="#2563EB" />
            <KPI label="Avg CDR" value={fmt(overview?.avg_cdr_t_yr)} unit="per sample" icon={Zap} color="#10B981" />
            <KPI label="Samples" value={overview?.total_samples?.toLocaleString()} icon={Beaker} color="#8B5CF6" />
            <KPI label="Success" value={`${overview?.success_rate?.toFixed(1)}%`} icon={CheckCircle} color="#F59E0B" />
            <KPI label="Avg Rock Add" value={overview?.avg_rock_addition?.toFixed(4)} unit="mol/kg" icon={Mountain} color="#EC4899" />
            <KPI label="Avg pH" value={overview?.avg_ph?.toFixed(2)} icon={Droplets} color="#6366F1" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="CDR by Region" subtitle="Total CO₂ removal potential per basin" testId="sim-cdr-region">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={regions.filter(r => r.total_cdr > 0)} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="region" tick={{ fontSize: 8, fill: "#9ca3af" }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickFormatter={fmt} />
                  <Tooltip content={<GlassTooltip formatter={fmt} />} />
                  <Bar dataKey="total_cdr" name="Total CDR (t/yr)" radius={[4,4,0,0]}>
                    {regions.map((_, i) => <Cell key={i} fill={BASIN_COLORS[i % BASIN_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top 10 Rivers" subtitle="Ranked by total CDR potential" testId="sim-top-rivers">
              <div className="overflow-y-auto max-h-[320px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] font-mono uppercase">#</TableHead>
                      <TableHead className="text-[10px] font-mono uppercase">River</TableHead>
                      <TableHead className="text-[10px] font-mono uppercase">Region</TableHead>
                      <TableHead className="text-[10px] font-mono uppercase text-right">CDR (t/yr)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topRivers.map((r, i) => (
                      <TableRow key={i} className="hover:bg-gray-50/50">
                        <TableCell className="font-mono text-[11px] text-gray-400">{i+1}</TableCell>
                        <TableCell className="text-sm font-medium">{r.river}</TableCell>
                        <TableCell className="text-xs text-gray-500">{r.region}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(r.total_cdr)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ChartCard>
          </div>

          {/* Summary */}
          {summary.length > 0 && (
            <ChartCard title="Summary Statistics" testId="sim-summary">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["Region","Samples","CDR Total","CDR Mean","Rock Add","Omega Mean","Success %"].map(h => (
                        <TableHead key={h} className="text-[10px] font-mono uppercase tracking-wider">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.map((s,i) => (
                      <TableRow key={i} className={`hover:bg-gray-50/50 ${s.region === 'TOTAL / OVERALL' ? 'font-semibold bg-gray-50' : ''}`}>
                        <TableCell className="text-sm">{s.region}</TableCell>
                        <TableCell className="font-mono text-sm">{s.n_samples}</TableCell>
                        <TableCell className="font-mono text-sm">{fmt(s.cdr_total)}</TableCell>
                        <TableCell className="font-mono text-sm">{fmt(s.cdr_mean)}</TableCell>
                        <TableCell className="font-mono text-sm">{s.add_mean?.toFixed(4)}</TableCell>
                        <TableCell className="font-mono text-sm">{s.omega_mean?.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-sm">{s.success_pct?.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ChartCard>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6 anim-fade-up">
          {compData.length <= 1 && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <p className="text-gray-500 text-sm">Upload datasets for different omega thresholds (10, 15, 20, 25) via the Data page to enable comparison.</p>
              <p className="text-gray-400 text-xs mt-2">Currently only omega = {compData[0]?.omega_threshold || 5} data is available.</p>
            </div>
          )}

          {compData.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {compData.map(d => (
                  <div key={d.omega_threshold} className="bg-white rounded-xl border border-gray-100 p-4 border-l-4"
                    style={{ borderLeftColor: OMEGA_COLORS[d.omega_threshold] || "#2563EB" }}
                    data-testid={`comp-omega-${d.omega_threshold}`}>
                    <Badge className="font-mono text-[10px] mb-2" style={{ backgroundColor: OMEGA_COLORS[d.omega_threshold], color: "white" }}>
                      Omega = {d.omega_threshold}
                    </Badge>
                    <p className="text-xl font-bold font-mono text-gray-900">{fmt(d.total_cdr)}</p>
                    <p className="text-[11px] text-gray-400">t CO₂/yr</p>
                  </div>
                ))}
              </div>

              {compData.length > 1 && regionCompData.length > 0 && (
                <ChartCard title="CDR by Region across Omega Thresholds" testId="comp-region-chart">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={regionCompData} margin={{ top: 5, right: 10, left: 0, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="region" tick={{ fontSize: 8, fill: "#9ca3af" }} angle={-40} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickFormatter={fmt} />
                      <Tooltip content={<GlassTooltip formatter={fmt} />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {compData.map(d => (
                        <Bar key={d.omega_threshold} dataKey={`omega_${d.omega_threshold}`}
                          name={`Omega=${d.omega_threshold}`} fill={OMEGA_COLORS[d.omega_threshold]} radius={[3,3,0,0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
