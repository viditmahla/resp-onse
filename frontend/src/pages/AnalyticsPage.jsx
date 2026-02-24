import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Legend, AreaChart, Area } from "recharts";
import FeedstockSelector from "@/components/FeedstockSelector";
import GlassTooltip from "@/components/GlassTooltip";
import { fetchDistributions, fetchRegionsCdr, fetchStatesCdr } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CHART_COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  if (typeof n === 'number') return n.toFixed(2);
  return n;
}

function createHistogram(data, field, bins = 20) {
  const values = data.map(d => d[field]).filter(v => v != null && isFinite(v));
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ range: `${min.toFixed(1)}`, count: values.length }];
  const binWidth = (max - min) / bins;
  const histogram = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + i * binWidth).toFixed(1)}`,
    rangeEnd: min + (i + 1) * binWidth,
    count: 0,
  }));
  values.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    histogram[idx].count++;
  });
  return histogram;
}

export default function AnalyticsPage() {
  const [feedstock, setFeedstock] = useState("calcite");
  const [omega, setOmega] = useState(5);
  const [distributions, setDistributions] = useState([]);
  const [regionsCdr, setRegionsCdr] = useState([]);
  const [statesCdr, setStatesCdr] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDistributions(feedstock, omega),
      fetchRegionsCdr(feedstock, omega),
      fetchStatesCdr(feedstock, omega),
    ]).then(([dist, reg, sta]) => {
      setDistributions(dist);
      setRegionsCdr(reg);
      setStatesCdr(sta);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [feedstock, omega]);

  if (loading) return <div className="space-y-6"><Skeleton className="h-12" /><div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72" />)}</div></div>;

  const phHist = createHistogram(distributions, "ph", 15);
  const alkHist = createHistogram(distributions, "alkalinity", 15);
  const dicHist = createHistogram(distributions, "dic", 15);
  const pco2Hist = createHistogram(distributions, "pco2", 15);
  const tempHist = createHistogram(distributions, "temp_c", 12);
  const rockHist = createHistogram(distributions, "rock_addition", 15);

  const phVsCdr = distributions.filter(d => d.ph && d.cdr_t_yr && d.cdr_t_yr > 0).map(d => ({ x: d.ph, y: d.cdr_t_yr, region: d.region }));
  const alkVsCdr = distributions.filter(d => d.alkalinity && d.cdr_t_yr && d.cdr_t_yr > 0).map(d => ({ x: d.alkalinity, y: d.cdr_t_yr, region: d.region }));

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "'Work Sans', sans-serif" }}>Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">Water chemistry distributions and correlation analysis</p>
        </div>
        <FeedstockSelector feedstock={feedstock} omega={omega} onFeedstockChange={setFeedstock} onOmegaChange={setOmega} />
      </div>

      <Tabs defaultValue="distributions" className="space-y-4">
        <TabsList data-testid="analytics-tabs">
          <TabsTrigger value="distributions" data-testid="tab-distributions">Distributions</TabsTrigger>
          <TabsTrigger value="correlations" data-testid="tab-correlations">Correlations</TabsTrigger>
          <TabsTrigger value="regional" data-testid="tab-regional">Regional Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="distributions">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              { data: phHist, title: "pH Distribution", color: "#8B5CF6" },
              { data: alkHist, title: "Alkalinity Distribution (umol/L)", color: "#10B981" },
              { data: dicHist, title: "DIC Distribution (umol/L)", color: "#F59E0B" },
              { data: pco2Hist, title: "pCO2 Distribution (uatm)", color: "#EC4899" },
              { data: tempHist, title: "Temperature Distribution (C)", color: "#6366F1" },
              { data: rockHist, title: "Rock Addition Distribution (mol/kg)", color: "#2563EB" },
            ].map(({ data, title, color }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3" style={{ fontFamily: "'Work Sans', sans-serif" }}>{title}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="range" tick={{ fontSize: 9, fill: "#64748B" }} angle={-30} textAnchor="end" interval={2} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748B" }} />
                    <Tooltip content={<GlassTooltip />} />
                    <Bar dataKey="count" name="Count" fill={color} radius={[2, 2, 0, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="correlations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="ph-vs-cdr">
              <h3 className="text-sm font-semibold text-slate-900 mb-3" style={{ fontFamily: "'Work Sans', sans-serif" }}>pH vs CDR Potential</h3>
              <ResponsiveContainer width="100%" height={360}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="x" name="pH" tick={{ fontSize: 10, fill: "#64748B" }} label={{ value: "pH", position: "bottom", offset: 10, fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="y" name="CDR" tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={formatNumber} label={{ value: "CDR (t/yr)", angle: -90, position: "insideLeft", offset: 5, fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip content={<GlassTooltip formatter={formatNumber} />} />
                  <Scatter data={phVsCdr} fill="#8B5CF6" fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="alk-vs-cdr">
              <h3 className="text-sm font-semibold text-slate-900 mb-3" style={{ fontFamily: "'Work Sans', sans-serif" }}>Alkalinity vs CDR Potential</h3>
              <ResponsiveContainer width="100%" height={360}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="x" name="Alkalinity" tick={{ fontSize: 10, fill: "#64748B" }} label={{ value: "Alkalinity (umol/L)", position: "bottom", offset: 10, fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="y" name="CDR" tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={formatNumber} label={{ value: "CDR (t/yr)", angle: -90, position: "insideLeft", offset: 5, fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip content={<GlassTooltip formatter={formatNumber} />} />
                  <Scatter data={alkVsCdr} fill="#10B981" fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="regional">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="region-cdr-chart">
              <h3 className="text-sm font-semibold text-slate-900 mb-3" style={{ fontFamily: "'Work Sans', sans-serif" }}>CDR by Region</h3>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={regionsCdr.filter(r => r.total_cdr > 0)} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={formatNumber} />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 10, fill: "#64748B" }} width={110} />
                  <Tooltip content={<GlassTooltip formatter={v => formatNumber(v)} />} />
                  <Bar dataKey="total_cdr" name="Total CDR (t/yr)" fill="#2563EB" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-5" data-testid="state-cdr-chart">
              <h3 className="text-sm font-semibold text-slate-900 mb-3" style={{ fontFamily: "'Work Sans', sans-serif" }}>CDR by State (Top 15)</h3>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={statesCdr.filter(s => s.total_cdr > 0).slice(0, 15)} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={formatNumber} />
                  <YAxis type="category" dataKey="state" tick={{ fontSize: 10, fill: "#64748B" }} width={90} />
                  <Tooltip content={<GlassTooltip formatter={v => formatNumber(v)} />} />
                  <Bar dataKey="total_cdr" name="Total CDR (t/yr)" fill="#10B981" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Avg pH by Region */}
          <div className="bg-white border border-slate-200 rounded-sm p-5 mt-4" data-testid="region-ph-chart">
            <h3 className="text-sm font-semibold text-slate-900 mb-3" style={{ fontFamily: "'Work Sans', sans-serif" }}>Average pH & Rock Addition by Region</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionsCdr} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="region" tick={{ fontSize: 9, fill: "#64748B" }} angle={-35} textAnchor="end" interval={0} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip content={<GlassTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="avg_ph" name="Avg pH" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="right" dataKey="avg_rock_add" name="Avg Rock Add (mol/kg)" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
