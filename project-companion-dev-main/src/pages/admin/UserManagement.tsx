import { useState } from "react";
import { Search, CheckCircle, Ban, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  banned: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const UserManagement = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedIdCard, setSelectedIdCard] = useState<{url: string, name: string} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      return await fetchApi('/admin/users/');
    }
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

  const filtered = users.filter((u: any) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter;
    return matchSearch && matchRole;
  }).sort((a: any, b: any) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for users..."
              className="pl-9 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Role: All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Role: All</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 w-10"><input type="checkbox" className="rounded border-border" /></th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">User</th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">Role</th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">The Condition</th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">Latest Activity</th>
              <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-4 text-center">Loading users...</td></tr>
            ) : filtered.map((user: any) => (
              <tr key={`${user.user_type}-${user.id}`} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-4"><input type="checkbox" className="rounded border-border" /></td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email || "No Email"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-foreground">{user.role}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${statusColors[user.status]}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted-foreground">N/A</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    {user.id_card_image && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                        onClick={() => setSelectedIdCard({ url: user.id_card_image, name: user.name })}
                        title="View ID Card"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {user.status !== 'approved' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => updateStatusMutation.mutate({ id: user.id, user_type: user.user_type, status: 'approved' })}
                        title="Approve User"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {user.status !== 'banned' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={() => updateStatusMutation.mutate({ id: user.id, user_type: user.user_type, status: 'banned' })}
                        title="Ban User"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ID Card Viewer Modal */}
      <Dialog open={!!selectedIdCard} onOpenChange={(open) => !open && setSelectedIdCard(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>ID Card for {selectedIdCard?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            {selectedIdCard && (
              <img 
                src={selectedIdCard.url} 
                alt={`${selectedIdCard.name}'s ID Card`} 
                className="max-w-full max-h-[70vh] object-contain rounded-md border shadow-sm"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
