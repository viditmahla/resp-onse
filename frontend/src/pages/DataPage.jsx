import { useState, useEffect, useRef } from "react";
import { Upload, Database, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { fetchFeedstocks, uploadFeedstock } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const OMEGA_OPTIONS = [5, 10, 15, 20, 25];

export default function DataPage() {
  const [feedstocks, setFeedstocks] = useState([]);
  const [feedstockName, setFeedstockName] = useState("");
  const [omegaThreshold, setOmegaThreshold] = useState("5");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const loadFeedstocks = () => {
    fetchFeedstocks().then(data => setFeedstocks(data || [])).catch(() => {});
  };

  useEffect(() => { loadFeedstocks(); }, []);

  const handleUpload = async () => {
    if (!file || !feedstockName.trim()) {
      toast.error("Please provide a feedstock name and file");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFeedstock(file, feedstockName.trim(), parseInt(omegaThreshold));
      toast.success(`Uploaded ${result.samples_count} samples for ${feedstockName}`);
      setFile(null);
      setFeedstockName("");
      if (fileRef.current) fileRef.current.value = "";
      loadFeedstocks();
    } catch (err) {
      toast.error("Upload failed: " + (err.response?.data?.detail || err.message));
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6" data-testid="data-page">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "'Work Sans', sans-serif" }}>Data Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">Upload new feedstock datasets and manage existing data</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white border border-slate-200 rounded-sm p-6" data-testid="upload-section">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Work Sans', sans-serif" }}>
          <Upload className="w-4 h-4" /> Upload New Dataset
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Upload an Excel file (.xlsx) with the same format as the original dataset. The file should have "ERW Results" and optionally "Summary Statistics" sheets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Feedstock Name</label>
            <input
              type="text"
              value={feedstockName}
              onChange={e => setFeedstockName(e.target.value)}
              placeholder="e.g., wollastonite, basalt"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              data-testid="feedstock-name-input"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Omega Threshold</label>
            <Select value={omegaThreshold} onValueChange={setOmegaThreshold}>
              <SelectTrigger className="w-full h-9 text-sm" data-testid="upload-omega-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OMEGA_OPTIONS.map(o => (
                  <SelectItem key={o} value={String(o)}>Omega = {o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Excel File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={e => setFile(e.target.files?.[0])}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              data-testid="file-input"
            />
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !file || !feedstockName.trim()}
          className="mt-4 px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-40 transition-all active:scale-95"
          data-testid="upload-btn"
        >
          {uploading ? "Uploading..." : "Upload Dataset"}
        </button>
      </div>

      {/* Existing Feedstocks */}
      <div className="bg-white border border-slate-200 rounded-sm p-6" data-testid="feedstocks-table">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Work Sans', sans-serif" }}>
          <Database className="w-4 h-4" /> Available Feedstocks
        </h3>

        {feedstocks.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No feedstocks loaded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-mono uppercase tracking-wider">Feedstock</TableHead>
                <TableHead className="text-xs font-mono uppercase tracking-wider">Omega Thresholds</TableHead>
                <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Samples</TableHead>
                <TableHead className="text-xs font-mono uppercase tracking-wider text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedstocks.map((f, i) => (
                <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                    {f.name?.charAt(0).toUpperCase() + f.name?.slice(1)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(f.omega_thresholds || []).map(o => (
                        <Badge key={o} variant="secondary" className="font-mono text-xs">{o}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{f.sample_count?.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">
                    {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-sm p-4" data-testid="upload-info">
        <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4" /> Expected File Format
        </h4>
        <ul className="text-xs text-blue-800 space-y-1 ml-6 list-disc">
          <li>Excel file (.xlsx) with sheet named "ERW Results"</li>
          <li>Row 2: Column headers (Sample No., River, Latitude, Longitude, pH, etc.)</li>
          <li>Data starts from row 4</li>
          <li>Optional: "Summary Statistics" sheet</li>
          <li>Supported omega thresholds: 5, 10, 15, 20, 25</li>
        </ul>
      </div>
    </div>
  );
}
