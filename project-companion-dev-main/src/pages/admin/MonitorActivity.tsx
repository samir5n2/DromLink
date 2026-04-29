import { useState, useMemo } from "react";
import { Search, Download, RefreshCw, Server, Zap, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

const MonitorActivity = () => {
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("all");

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => await fetchApi('/admin/users/')
  });

  const { data: dorms = [], isLoading: dormsLoading } = useQuery({
    queryKey: ['admin_dorms'],
    queryFn: async () => await fetchApi('/admin/dorms/')
  });

  const activityLogs = useMemo(() => {
    const logs: any[] = [];
    
    // Add users as activities
    users.forEach((u: any) => {
      logs.push({
        id: `user-${u.id}`,
        time: "Recent",
        user: u.name,
        email: u.email,
        action: u.status === 'pending' ? "New registration" : `Status updated to ${u.status}`,
        detail: u.role,
        status: u.status === 'banned' ? "FLAGGED" : "SUCCESS",
        dot: u.status === 'pending' ? "bg-blue-500" : (u.status === 'approved' ? "bg-green-500" : "bg-red-500")
      });
    });

    // Add dorms as activities
    dorms.forEach((d: any) => {
      logs.push({
        id: `dorm-${d.dorm_id}`,
        time: "Recent",
        user: d.landlord_details?.name || "Landlord",
        email: d.landlord_details?.email || "",
        action: "New property listed",
        detail: d.name,
        status: d.approval_status === 'approved' ? "SUCCESS" : (d.approval_status === 'rejected' ? "FLAGGED" : "PENDING"),
        dot: d.approval_status === 'approved' ? "bg-green-500" : (d.approval_status === 'rejected' ? "bg-red-500" : "bg-yellow-500")
      });
    });

    return logs.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 10);
  }, [users, dorms]);

  const metricCards = [
    { label: "TOTAL USERS", value: users.length.toString(), icon: Server, color: "text-green-500" },
    { label: "TOTAL PROPERTIES", value: dorms.length.toString(), icon: Zap, color: "text-primary" },
    { label: "PENDING APPROVALS", value: (users.filter((u:any)=>u.status==='pending').length + dorms.filter((d:any)=>d.approval_status==='pending').length).toString(), icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitor System Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time overview of your platform operations and server health.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export Log</Button>
          <Button className="gap-2" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /> Refresh data</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {metricCards.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</span>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </div>
            <div className="text-3xl font-bold text-foreground">{m.value}</div>
            <div className="mt-3 flex gap-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-8 w-full rounded-sm ${i === 3 ? "bg-primary" : "bg-primary/20"}`} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Real-time Activity Log
          </h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-left text-xs font-semibold text-primary uppercase">User</th>
              <th className="p-4 text-left text-xs font-semibold text-primary uppercase">Action Taken</th>
              <th className="p-4 text-right text-xs font-semibold text-primary uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {(usersLoading || dormsLoading) ? (
              <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
            ) : activityLogs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{(log.user || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground text-sm">{log.user}</div>
                      <div className="text-xs text-muted-foreground">{log.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${log.dot}`} />
                    <div>
                      <div className="text-sm font-medium text-foreground">{log.action}</div>
                      {log.detail && <div className="text-xs text-muted-foreground">{log.detail}</div>}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className={`text-xs font-bold ${log.status === "SUCCESS" ? "text-green-600" : "text-red-600"}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitorActivity;
