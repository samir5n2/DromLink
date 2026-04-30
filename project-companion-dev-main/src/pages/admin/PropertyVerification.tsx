import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Building2, MapPin, Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchApi, MEDIA_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const PropertyVerification = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [rejectDialog, setRejectDialog] = useState<{ isOpen: boolean; dormId: string | null }>({
    isOpen: false,
    dormId: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [selectedDorm, setSelectedDorm] = useState<any>(null);

  const { data: pendingDorms = [], isLoading } = useQuery({
    queryKey: ["admin_dorms"],
    queryFn: async () => await fetchApi("/admin/dorms/"),
  });

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith('http')) {
      return url;
    }
    return `${MEDIA_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ dormId, status, reason }: { dormId: string; status: "approved" | "rejected"; reason?: string }) => {
      return await fetchApi("/admin/dorms/", {
        method: "POST",
        body: JSON.stringify({ dorm_id: dormId, status, reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_dorms"] });
      toast.success("Dorm status updated successfully");
      setRejectDialog({ isOpen: false, dormId: null });
      setRejectReason("");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const handleApprove = (dormId: string) => {
    updateStatusMutation.mutate({ dormId, status: "approved" });
  };

  const handleReject = () => {
    if (rejectDialog.dormId) {
      if (!rejectReason.trim()) {
        toast.error("Please provide a rejection reason.");
        return;
      }
      updateStatusMutation.mutate({ dormId: rejectDialog.dormId, status: "rejected", reason: rejectReason });
    }
  };

  if (isLoading) return <div className="p-8">Loading properties...</div>;

  const filteredDorms = pendingDorms.filter((d: any) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.dorm_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Property Verification</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and approve new accommodations added by landlords.</p>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-sm gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />
          {pendingDorms.length} Pending
        </Badge>
      </div>

      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-border bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by property name or ID..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDorms.map((dorm: any) => (
          <div key={dorm.dorm_id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="h-48 bg-muted relative cursor-pointer group" onClick={() => setSelectedDorm(dorm)}>
              {dorm.images && dorm.images.length > 0 ? (
                <img src={getFullImageUrl(dorm.images[0].image)} alt={dorm.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground flex-col gap-2">
                  <Building2 className="h-8 w-8" />
                  <span>No Images</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">View Gallery</span>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                 {dorm.images?.slice(1, 4).map((img: any, i: number) => (
                   <img key={i} src={getFullImageUrl(img.image)} className="w-12 h-12 object-cover border-2 border-white rounded shadow" />
                 ))}
                 {dorm.images?.length > 4 && (
                   <div className="w-12 h-12 bg-black/50 text-white flex items-center justify-center text-xs rounded border-2 border-white shadow">
                     +{dorm.images.length - 4}
                   </div>
                 )}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold">{dorm.name}</h3>
                  <div className="flex items-center text-muted-foreground text-sm gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {dorm.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">{dorm.price_egp} EGP</div>
                  <div className="text-xs text-muted-foreground">/ month</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {dorm.room_type && <Badge variant="secondary">{dorm.room_type}</Badge>}
                {dorm.has_wifi && <Badge variant="secondary">WiFi</Badge>}
                {dorm.has_ac && <Badge variant="secondary">AC</Badge>}
                {dorm.has_kitchen && <Badge variant="secondary">Kitchen</Badge>}
              </div>

              <div className="mt-4 pt-4 border-t border-border mt-auto flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">ID: </span>
                  <span className="font-mono">{dorm.dorm_id}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                    onClick={() => setRejectDialog({ isOpen: true, dormId: dorm.dorm_id })}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white gap-1"
                    onClick={() => handleApprove(dorm.dorm_id)}
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredDorms.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            No properties waiting for verification.
          </div>
        )}
      </div>

      <Dialog open={rejectDialog.isOpen} onOpenChange={(open) => !open && setRejectDialog({ isOpen: false, dormId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this property. This will be sent to the landlord so they can fix it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Photos are blurry, price is unrealistic, etc."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ isOpen: false, dormId: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject Property</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedDorm} onOpenChange={(open) => !open && setSelectedDorm(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Property Gallery: {selectedDorm?.name}</DialogTitle>
            <DialogDescription>
              Reviewing all uploaded photos for this property.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-6 mt-4">
            {selectedDorm?.images.map((img: any, i: number) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="rounded-lg overflow-hidden border border-border bg-black aspect-auto min-h-[300px] flex items-center justify-center">
                  <img 
                    src={getFullImageUrl(img.image)} 
                    alt={`Property Image ${i + 1}`} 
                    className="max-w-full max-h-[70vh] object-contain" 
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                  <span>Image {selectedDorm.images.length - i} of {selectedDorm.images.length}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Uploaded: {new Date(img.uploaded_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedDorm(null)}>Close Gallery</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyVerification;
