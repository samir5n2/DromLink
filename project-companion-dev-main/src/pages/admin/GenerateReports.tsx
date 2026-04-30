import { useState } from "react";
import { Settings, Download, Clock, FileText, Sheet, FileSpreadsheet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/lib/api";

const recentReports: any[] = [];

const GenerateReports = () => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState("financial");
  const [exportFormat, setExportFormat] = useState("pdf");

  const handleDownload = () => {
    const baseUrl = `${API_BASE_URL}/reports/export/`;
    const url = `${baseUrl}?type=${reportType}&format=${exportFormat}`;
    
    // In a real production app, we might need to handle auth headers if the browser download doesn't support them
    // But for a simple GET request that returns a file, a direct link or a hidden form is common.
    // Since this is a protected endpoint, we use fetch to get the blob.
    
    const token = localStorage.getItem('access_token');
    
    toast.info(t('reports.generating') || "Generating report...");
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error("Failed to generate report");
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t('reports.success') || "Report downloaded successfully!");
    })
    .catch(err => {
      toast.error(t('reports.error') || "Failed to generate report.");
      console.error(err);
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Generate Reports</h1>
      <p className="text-muted-foreground text-sm mt-1 mb-6">Configure and export system data</p>

      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h2 className="font-semibold text-foreground flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-muted-foreground" /> Report Configuration
        </h2>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">Financial Summary</SelectItem>
                <SelectItem value="users">User Growth</SelectItem>
                <SelectItem value="occupancy">Occupancy Rate</SelectItem>
                <SelectItem value="activity">Activity Report</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Select the data category you want to visualize</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
            <div className="flex items-center gap-2">
              <Input type="date" className="flex-1" />
              <span className="text-muted-foreground">—</span>
              <Input type="date" className="flex-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Start and end dates for data aggregation</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Export Format</label>
            <div className="flex gap-2">
              {[
                { key: "pdf", label: "PDF", icon: FileText },
                { key: "excel", label: "EXCEL", icon: Sheet },
                { key: "csv", label: "CSV", icon: FileSpreadsheet },
              ].map((f) => (
                <Button
                  key={f.key}
                  variant={exportFormat === f.key ? "default" : "outline"}
                  className="flex-1 flex-col h-16 gap-1"
                  onClick={() => setExportFormat(f.key)}
                >
                  <f.icon className="h-5 w-5" />
                  <span className="text-xs">{f.label}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Choose file type for download</p>
          </div>
        </div>

        <div className="border-t border-border mt-6 pt-6 flex flex-col items-center">
          <Button 
            size="lg" 
            className="gap-2 px-12"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" /> Generate & Download Report
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Generating large reports may take a few moments</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" /> Recent Reports
        </h2>
        <Button variant="link" className="text-primary text-sm">Clear History</Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-left text-xs font-semibold text-primary uppercase">Report Name</th>
              <th className="p-4 text-left text-xs font-semibold text-primary uppercase">Date Range</th>
              <th className="p-4 text-left text-xs font-semibold text-primary uppercase">Format</th>
              <th className="p-4 text-left text-xs font-semibold text-primary uppercase">Generated On</th>
              <th className="p-4 text-right text-xs font-semibold text-primary uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {recentReports.length > 0 ? recentReports.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-4 font-medium text-foreground">{r.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{r.range}</td>
                <td className="p-4">
                  <Badge className={r.color}>{r.format}</Badge>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{r.generated}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">No reports generated yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="rounded-xl border border-border bg-yellow-50 dark:bg-yellow-900/10 p-5">
          <h3 className="font-semibold text-foreground mb-1">Scheduled Reports</h3>
          <p className="text-sm text-muted-foreground">Want to receive reports automatically? You can schedule weekly digests in System Activity settings.</p>
        </div>
        <div className="rounded-xl border border-border bg-purple-50 dark:bg-purple-900/10 p-5">
          <h3 className="font-semibold text-foreground mb-1">Pro Tip</h3>
          <p className="text-sm text-muted-foreground">Exporting as CSV is recommended for importing data into third-party business intelligence tools.</p>
        </div>
      </div>
    </div>
  );
};

export default GenerateReports;
