import { useState, useEffect } from "react";
import { Beaker, Droplets, Activity, TrendingUp, Mountain, FlaskConical, Zap, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import MetricCard from "@/components/MetricCard";
import GlassTooltip from "@/components/GlassTooltip";
import FeedstockSelector from "@/components/FeedstockSelector";
import { fetchDashboardOverview, fetchRegionsCdr, fetchTopRivers, fetchSummary } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CHART_COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#06B6D4", "#84CC16", "#E11D48"];

function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(2);
}

export default function DashboardPage() {
  const [feedstock, setFeedstock] = useState("calcite");
  const [omega, setOmega] = useState(5);
  const [overview, setOverview] = useState(null);
  const [regions, setRegions] = useState([]);
  const [topRivers, setTopRivers] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDashboardOverview(feedstock, omega),
      fetchRegionsCdr(feedstock, omega),
      fetchTopRivers(feedstock, omega, 10),
      fetchSummary(feedstock, omega),
    ]).then(([ov, reg, riv, sum]) => {
      setOverview(ov);
      setRegions(reg);
      setTopRivers(riv);
      setSummary(sum);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [feedstock, omega]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const pieData = regions.filter(r => r.total_cdr > 0).map(r => ({ name: r.region, value: r.total_cdr }));

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "'Work Sans', sans-serif" }}>Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">Carbon Dioxide Removal potential across Indian rivers</p>
        </div>
        <FeedstockSelector feedstock={feedstock} omega={omega} onFeedstockChange={setFeedstock} onOmegaChange={setOmega} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <MetricCard label="Total CDR" value={formatNumber(overview?.total_cdr_t_yr)} unit="t CO₂/yr" icon={TrendingUp} color="blue" testId="metric-total-cdr" />
        <MetricCard label="Avg CDR" value={formatNumber(overview?.avg_cdr_t_yr)} unit="t CO₂/yr per sample" icon={Activity} color="green" testId="metric-avg-cdr" />
        <MetricCard label="Total Samples" value={overview?.total_samples?.toLocaleString()} icon={Beaker} color="violet" testId="metric-total-samples" />
        <MetricCard label="Success Rate" value={`${overview?.success_rate?.toFixed(1)}%`} icon={CheckCircle} color="amber" testId="metric-success-rate" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-2">
        <MetricCard label="Avg pH" value={overview?.avg_ph?.toFixed(2)} icon={Droplets} color="indigo" testId="metric-avg-ph" />
        <MetricCard label="Avg Alkalinity" value={formatNumber(overview?.avg_alkalinity)} unit="umol/L" icon={FlaskConical} color="rose" testId="metric-avg-alk" />
        <MetricCard label="Avg Rock Addition" value={overview?.avg_rock_addition?.toFixed(4)} unit="mol/kg" icon={Mountain} color="slate" testId="metric-avg-rock" />
        <MetricCard label="Avg Omega Final" value={overview?.avg_omega_final?.toFixed(2)} icon={Zap} color="green" testId="metric-avg-omega" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Region CDR Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>CDR by Region</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={regions.filter(r => r.total_cdr > 0)} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="region" tick={{ fontSize: 10, fill: "#64748B" }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={formatNumber} />
              <Tooltip content={<GlassTooltip formatter={v => formatNumber(v)} />} />
              <Bar dataKey="total_cdr" name="Total CDR (t/yr)" fill="#2563EB" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>CDR Distribution</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<GlassTooltip formatter={v => formatNumber(v) + " t/yr"} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Rivers Table */}
      <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="top-rivers-table">
        <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>Top Rivers by CDR Potential</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-mono uppercase tracking-wider">#</TableHead>
              <TableHead className="text-xs font-mono uppercase tracking-wider">River</TableHead>
              <TableHead className="text-xs font-mono uppercase tracking-wider">Region</TableHead>
              <TableHead className="text-xs font-mono uppercase tracking-wider">State</TableHead>
              <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Total CDR (t/yr)</TableHead>
              <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Avg CDR (t/yr)</TableHead>
              <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Samples</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topRivers.map((r, i) => (
              <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-mono text-xs text-slate-400">{i + 1}</TableCell>
                <TableCell className="text-sm font-medium text-slate-900">{r.river}</TableCell>
                <TableCell className="text-sm text-slate-600">{r.region}</TableCell>
                <TableCell className="text-sm text-slate-600">{r.state}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatNumber(r.total_cdr)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatNumber(r.avg_cdr)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{r.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      {summary.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="summary-table">
          <h3 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>Summary Statistics</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-mono uppercase tracking-wider">Region</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Samples</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-right">CDR Total (t/yr)</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-right">CDR Mean (t/yr)</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Add Mean</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Omega Mean</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Success %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((s, i) => (
                  <TableRow key={i} className={`hover:bg-slate-50 transition-colors ${s.region === 'TOTAL / OVERALL' ? 'font-semibold bg-slate-50' : ''}`}>
                    <TableCell className="text-sm">{s.region}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.n_samples}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(s.cdr_total)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(s.cdr_mean)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.add_mean?.toFixed(4)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.omega_mean?.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.success_pct?.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
