import { useState } from "react";
import { Search, Ban, Clock, Trash2, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const BlockUsers = () => {
  const [search, setSearch] = useState("");
  const [banReason, setBanReason] = useState("");
  const [blockSearch, setBlockSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => await fetchApi('/admin/users/')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, user_type, status }: { id: string, user_type: string, status: string }) => {
      return await fetchApi('/admin/users/', {
        method: 'POST',
        body: JSON.stringify({ id, user_type, status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast({ title: "Success", description: "User status updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const handleUnblock = (id: string, user_type: string) => {
    updateStatusMutation.mutate({ id, user_type, status: 'approved' });
  };

  const handleBlock = () => {
    // Search for user by email or ID in the current users list
    const userToBlock = users.find((u: any) => u.email.toLowerCase() === blockSearch.toLowerCase() || u.id.toString() === blockSearch);
    if (userToBlock) {
      updateStatusMutation.mutate({ id: userToBlock.id, user_type: userToBlock.user_type, status: 'banned' });
      setBlockSearch("");
    } else {
      toast({ title: "Error", description: "User not found with that email or ID.", variant: "destructive" });
    }
  };

  const blockedUsers = users.filter((u: any) => u.status === 'banned');
  
  const filtered = blockedUsers.filter((u: any) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Block Users</h1>
      <p className="text-muted-foreground text-sm mt-1 mb-6">Manage banned accounts and issue new restrictions.</p>

      {/* Quick Block Tool */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-yellow-500" /> Quick Block Tool
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Find user by email or ID." className="pl-9" value={blockSearch} onChange={(e) => setBlockSearch(e.target.value)} />
          </div>
          <Select value={banReason} onValueChange={setBanReason}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Select ban reason..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fake">Fake listing</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="spam">Spamming</SelectItem>
              <SelectItem value="tos">ToS Violation</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" className="gap-2 px-6" onClick={handleBlock} disabled={!blockSearch}>
            <Ban className="h-4 w-4" /> Restrict Access
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <div className="relative w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Search blocked users..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 w-10"><input type="checkbox" className="rounded border-border" /></th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">User</th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">Role</th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
              <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No blocked users found.</td></tr>
            ) : filtered.map((user: any) => (
              <tr key={`${user.user_type}-${user.id}`} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-4"><input type="checkbox" className="rounded border-border" /></td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{(user.name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email || "No Email"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm">{user.role}</td>
                <td className="p-4">
                  <Badge variant="destructive">BANNED</Badge>
                </td>
                <td className="p-4 text-right">
                  <Button variant="outline" size="sm" onClick={() => handleUnblock(user.id, user.user_type)}>Unblock</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between p-4 border-t border-border">
          <span className="text-sm text-primary">Showing {filtered.length} blocked users</span>
        </div>
      </div>
    </div>
  );
};

export default BlockUsers;
