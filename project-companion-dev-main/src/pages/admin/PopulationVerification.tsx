import { useState } from "react";
import { Search, Check, X, Filter, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PopulationVerification = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIdCard, setSelectedIdCard] = useState<{url: string, name: string} | null>(null);
  
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
      toast({ title: "Success", description: "Verification status updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const handleAction = (id: string, user_type: string, action: "approve" | "reject") => {
    updateStatusMutation.mutate({ id, user_type, status: action === "approve" ? "approved" : "banned" });
  };

  const filtered = users.filter((u: any) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || u.user_type.toLowerCase() === typeFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Population Verification</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and verify National IDs for students and landlords.</p>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-sm gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />
          {users.filter((u: any) => u.status === 'pending').length} Pending Requests
        </Badge>
      </div>

      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-border bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All User Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All User Types</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="landlord">Landlord</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1"><Filter className="h-3 w-3" /> More Filters</Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">User Details</th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">User Type</th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">National ID Preview</th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
              <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading requests...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No verification requests found.</td></tr>
            ) : filtered.map((item: any) => (
              <tr key={`${item.user_type}-${item.id}`} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{(item.name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.email || "No Email"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge className={item.user_type === "student" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}>
                    {item.user_type.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-4">
                  {item.id_card_image ? (
                    <Button variant="outline" size="sm" onClick={() => setSelectedIdCard({ url: item.id_card_image, name: item.name })} className="gap-2">
                      <Eye className="h-4 w-4" /> View ID
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">No ID uploaded</span>
                  )}
                </td>
                <td className="p-4">
                  <Badge variant="outline" className="uppercase text-[10px]">
                    {item.status}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => handleAction(item.id, item.user_type, "approve")}>
                          <Check className="h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleAction(item.id, item.user_type, "reject")}>
                          <X className="h-3 w-3" /> Reject
                        </Button>
                      </>
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

export default PopulationVerification;
