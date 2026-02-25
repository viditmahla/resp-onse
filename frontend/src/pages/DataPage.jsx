import { useState, useEffect, useRef } from "react";
import { Upload, Database, FileSpreadsheet, AlertCircle } from "lucide-react";
import { fetchFeedstocks, uploadFeedstock } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const OMEGA_OPTIONS = [5, 10, 15, 20, 25];

export default function DataPage() {
  const [feedstocks, setFeedstocks] = useState([]);
  const [name, setName] = useState("");
  const [omega, setOmega] = useState("5");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => fetchFeedstocks().then(d => setFeedstocks(d || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    if (!file || !name.trim()) { toast.error("Provide feedstock name and file"); return; }
    setUploading(true);
    try {
      const res = await uploadFeedstock(file, name.trim(), parseInt(omega));
      toast.success(`Uploaded ${res.samples_count} samples for ${name}`);
      setFile(null); setName(""); if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) { toast.error("Upload failed: " + (e.response?.data?.detail || e.message)); }
    setUploading(false);
  };

  return (
    <div className="space-y-8" data-testid="data-page">
      <div className="anim-fade-up">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Data</h1>
        <p className="text-base text-gray-400 mt-2">Upload new feedstock datasets and manage existing data</p>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 anim-fade-up delay-1" data-testid="upload-section">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          <Upload className="w-4 h-4 text-emerald-600" /> Upload New Dataset
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          Excel file (.xlsx) matching the original format with "ERW Results" sheet. Data starts row 4.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Feedstock Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. wollastonite"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              data-testid="feedstock-name-input" />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Omega Threshold</label>
            <Select value={omega} onValueChange={setOmega}>
              <SelectTrigger className="w-full h-10 text-sm rounded-lg" data-testid="upload-omega-select"><SelectValue /></SelectTrigger>
              <SelectContent>{OMEGA_OPTIONS.map(o => <SelectItem key={o} value={String(o)}>Omega = {o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Excel File</label>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0])}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              data-testid="file-input" />
          </div>
        </div>
        <button onClick={handleUpload} disabled={uploading || !file || !name.trim()} data-testid="upload-btn"
          className="mt-5 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-all active:scale-95">
          {uploading ? "Uploading..." : "Upload Dataset"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 anim-fade-up delay-2" data-testid="feedstocks-table">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          <Database className="w-4 h-4 text-emerald-600" /> Available Feedstocks
        </h3>
        {feedstocks.length === 0 ? <p className="text-sm text-gray-300 py-6 text-center">No feedstocks loaded.</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                {["Feedstock","Omega Thresholds","Samples","Created"].map(h => (
                  <TableHead key={h} className="text-[10px] font-mono uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedstocks.map((f, i) => (
                <TableRow key={i} className="hover:bg-gray-50/50">
                  <TableCell className="text-sm font-medium flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-gray-300" />
                    {f.name?.charAt(0).toUpperCase() + f.name?.slice(1)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">{(f.omega_thresholds||[]).map(o => <Badge key={o} variant="secondary" className="font-mono text-[10px]">{o}</Badge>)}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{f.sample_count?.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-gray-400">{f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Info */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 anim-fade-up delay-3" data-testid="upload-info">
        <h4 className="text-sm font-semibold text-emerald-900 flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4" /> Expected Format
        </h4>
        <ul className="text-xs text-emerald-800 space-y-1 ml-6 list-disc">
          <li>Excel (.xlsx) with "ERW Results" sheet</li>
          <li>Row 2: Column headers; Data from row 4</li>
          <li>Optional: "Summary Statistics" sheet</li>
          <li>Omega: 5, 10, 15, 20, or 25</li>
        </ul>
      </div>
    </div>
  );
}
