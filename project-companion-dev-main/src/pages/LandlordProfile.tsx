import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Star, CheckCircle, Plus, Bed, Bath, Users, Wifi, Sofa, UtensilsCrossed, Monitor, Trash2, Edit3, ShieldCheck, ChevronLeft, Inbox, Car, Armchair, Tv, Dog, Mountain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApi, MEDIA_BASE_URL } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusColorsReq: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

const amenitiesList = [
  { id: "has_wifi", labelKey: "property.wifi", icon: Wifi },
  { id: "has_kitchen", labelKey: "property.kitchen", icon: UtensilsCrossed },
  { id: "has_ac", labelKey: "property.ac", icon: Monitor },
  { id: "has_gym", labelKey: "property.gym", icon: Users },
  { id: "has_laundry", labelKey: "property.laundry", icon: Sofa },
  { id: "has_parking", labelKey: "property.parking", icon: Car },
  { id: "is_furnished", labelKey: "property.furnished", icon: Armchair },
  { id: "has_smart_tv", labelKey: "property.smartTv", icon: Tv },
  { id: "is_pet_friendly", labelKey: "property.petFriendly", icon: Dog },
  { id: "has_scenic_view", labelKey: "property.scenicView", icon: Mountain },
];

const LandlordProfile = ({ defaultTab }: { defaultTab?: string }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = i18n.language === "ar";
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDormId, setEditingDormId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(defaultTab || 'properties'); 

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: '',
    price_egp: '',
    room_type: 'apartment',
    bedrooms: '1',
    bathrooms: '1',
    capacity: '1',
    distance_km: '1',
    has_wifi: false,
    has_kitchen: false,
    has_ac: false,
    has_gym: false,
    has_laundry: false,
    has_parking: false,
    is_furnished: false,
    has_smart_tv: false,
    is_pet_friendly: false,
    has_scenic_view: false,
    description: '',
    current_occupants: '0',
    google_maps_link: '',
    gender_preference: 'male',
  });
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/me/')
      .then(data => setProfile(data))
      .catch(err => {
        console.error("Failed to load profile:", err);
        setError(err.message || "Failed to load profile data");
      });
  }, []);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => await fetchApi('/locations/')
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['landlord_properties', profile?.landlord_id],
    enabled: !!profile?.landlord_id,
    queryFn: async () => await fetchApi(`/dorms/?landlord=${profile.landlord_id}`)
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    const shouldAdd = params.get('add') === 'true';

    if (editId && properties.length > 0) {
      const propToEdit = properties.find((p: any) => p.dorm_id === editId);
      if (propToEdit) {
        handleEdit(propToEdit);
      }
    } else if (shouldAdd) {
      resetForm();
      setShowAddModal(true);
      // Remove the param from URL to prevent reopening on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [properties]);

  const { data: bookingRequests = [] } = useQuery({
    queryKey: ['booking_requests'],
    enabled: !!profile?.landlord_id,
    queryFn: async () => {
      const data = await fetchApi('/bookings/');
      const statusOrder: Record<string, number> = { 'pending': 0, 'approved': 1, 'rejected': 2 };
      return data.sort((a: any, b: any) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));
    }
  });

  const createDormMutation = useMutation({
    mutationFn: async (data: any) => {
      const isEditing = !!editingDormId;
      const url = isEditing ? `/dorms/${editingDormId}/` : '/dorms/';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const dorm = await fetchApi(url, {
        method,
        body: JSON.stringify(data)
      });
      for (const file of images) {
        const fData = new FormData();
        fData.append('dorm', dorm.dorm_id);
        fData.append('image', file);
        await fetchApi('/dorm_images/', {
          method: 'POST',
          body: fData
        });
      }
      return dorm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord_properties'] });
      setShowAddModal(false);
      setEditingDormId(null);
      setImages([]);
      toast({ title: "Success", description: editingDormId ? "Property updated and sent for review!" : "Property listed successfully!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return await fetchApi(`/bookings/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking_requests'] });
      toast({ title: "Success", description: "Request status updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update request", variant: "destructive" });
    }
  });

  const deleteDormMutation = useMutation({
    mutationFn: async (dormId: string) => {
      return await fetchApi(`/dorms/${dormId}/`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord_properties'] });
      toast({ title: "Success", description: "Property deleted successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to delete property", variant: "destructive" });
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      return await fetchApi(`/dorm_images/${imageId}/`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Image deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to delete image", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    const requiredFields = [
      { key: 'name', label: isAr ? 'عنوان العقار' : 'Property Title' },
      { key: 'address', label: isAr ? 'العنوان' : 'Address' },
      { key: 'location', label: isAr ? 'المنطقة' : 'Area / Location' },
      { key: 'google_maps_link', label: isAr ? 'رابط جوجل ماب' : 'Google Maps Link' },
      { key: 'price_egp', label: isAr ? 'الإيجار' : 'Rent (EGP)' },
      { key: 'capacity', label: isAr ? 'السعة الكلية' : 'Total Capacity' },
      { key: 'bedrooms', label: isAr ? 'غرف النوم' : 'Bedrooms' },
      { key: 'bathrooms', label: isAr ? 'الحمامات' : 'Bathrooms' },
      { key: 'distance_km', label: isAr ? 'المسافة للجامعة' : 'Distance to University' },
      { key: 'description', label: isAr ? 'الوصف' : 'Description' },
    ];

    for (const field of requiredFields) {
      if (!formData[field.key as keyof typeof formData]) {
        toast({ 
          title: isAr ? "خطأ في البيانات" : "Validation Error", 
          description: isAr ? `يرجى إدخال ${field.label}` : `${field.label} is required.`, 
          variant: "destructive" 
        });
        return;
      }
    }

    if (!editingDormId && images.length === 0) {
      toast({ 
        title: isAr ? "خطأ في البيانات" : "Validation Error", 
        description: isAr ? "يرجى رفع صورة واحدة على الأقل للعقار." : "Please upload at least one image for the property.", 
        variant: "destructive" 
      });
      return;
    }

    const googleMapsRegex = /^(https?:\/\/)?(www\.)?(google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/;
    if (!googleMapsRegex.test(formData.google_maps_link)) {
      toast({ 
        title: isAr ? "خطأ في البيانات" : "Validation Error", 
        description: isAr ? "يرجى تقديم رابط جوجل ماب صحيح." : "Please provide a valid Google Maps link.", 
        variant: "destructive" 
      });
      return;
    }

    createDormMutation.mutate({
      ...formData,
      price_egp: parseInt(formData.price_egp),
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseInt(formData.bathrooms),
      capacity: parseInt(formData.capacity),
      distance_km: parseFloat(formData.distance_km),
      current_occupants: parseInt(formData.current_occupants),
      description: formData.description,
      gender_preference: formData.gender_preference,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleEdit = (prop: any) => {
    setFormData({
      name: prop.name,
      address: prop.address,
      location: prop.location?.toString() || '',
      price_egp: prop.price_egp.toString(),
      room_type: prop.room_type,
      bedrooms: prop.bedrooms.toString(),
      bathrooms: prop.bathrooms.toString(),
      capacity: prop.capacity.toString(),
      distance_km: prop.distance_km.toString(),
      has_wifi: prop.has_wifi,
      has_kitchen: prop.has_kitchen,
      has_ac: prop.has_ac,
      has_gym: prop.has_gym,
      has_laundry: prop.has_laundry,
      has_parking: prop.has_parking,
      is_furnished: prop.is_furnished,
      has_smart_tv: prop.has_smart_tv,
      is_pet_friendly: prop.is_pet_friendly,
      description: prop.description || '',
      current_occupants: (prop.current_occupants || 0).toString(),
      google_maps_link: prop.google_maps_link || '',
      gender_preference: prop.gender_preference || 'male',
    });
    setEditingDormId(prop.dorm_id);
    setExistingImages(prop.images || []);
    setImages([]);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', address: '', location: '', price_egp: '', room_type: 'apartment',
      bedrooms: '1', bathrooms: '1', capacity: '1', distance_km: '1',
      has_wifi: false, has_kitchen: false, has_ac: false, has_gym: false, has_laundry: false,
      has_parking: false, is_furnished: false, has_smart_tv: false, is_pet_friendly: false, has_scenic_view: false,
      description: '', current_occupants: '0', google_maps_link: '', gender_preference: 'male',
    });
    setEditingDormId(null);
    setImages([]);
  };

  if (error) return (
    <div className="p-8 text-center space-y-4">
      <div className="text-red-500 font-bold">Error: {error}</div>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  if (!profile) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      <p className="text-muted-foreground animate-pulse">Loading profile...</p>
    </div>
  );

  return (
    <div className="container py-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16">
                {profile?.avatar_url && <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />}
                <AvatarFallback className="text-xl bg-primary/10 text-primary">{(profile?.name || "Landlord").substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-500 border-2 border-card flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold">{profile?.name || "New Landlord"}</h2>
              <div className="my-2">
                <Badge variant="outline" className="border-primary text-primary text-xs">{t('profile.verifiedLandlord')}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {profile.email || t('profile.noEmail')}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {profile.phone_number || t('profile.noPhone')}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> {profile.gender === 'male' ? (isAr ? "ذكر" : "Male") : (profile.gender === 'female' ? (isAr ? "أنثى" : "Female") : t('auth.notSpecified'))}</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            disabled={profile?.account_status !== 'approved'}
            onClick={() => { resetForm(); setShowAddModal(true); }} 
            className={`rounded-xl border-2 border-dashed bg-card p-8 flex flex-col items-center justify-center gap-3 transition-colors min-h-[200px] ${
              profile?.account_status === 'approved' 
                ? 'hover:border-primary/50 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed grayscale'
            }`}
          >
            <div className="h-12 w-12 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center"><Plus className="h-6 w-6 text-muted-foreground" /></div>
            <div className="text-center">
              <p className="font-bold">{t('landlord.addNew')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {profile?.account_status === 'approved' 
                  ? t('landlord.expandPortfolio') 
                  : t('landlord.pendingApproval')}
              </p>
            </div>
          </button>
          
          <button onClick={() => setActiveTab('requests')} className="rounded-xl border bg-card p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors cursor-pointer min-h-[200px] relative">
            <div className="h-12 w-12 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center"><Inbox className="h-6 w-6 text-muted-foreground" /></div>
            <div className="text-center">
              <p className="font-bold">{t('landlord.bookingRequests')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('landlord.viewRequests')}</p>
            </div>
            {bookingRequests.filter((r: any) => r.status === 'pending').length > 0 && (
              <Badge className="absolute top-4 right-4 bg-red-500">{bookingRequests.filter((r: any) => r.status === 'pending').length} {isAr ? "جديد" : "New"}</Badge>
            )}
          </button>
        </div>
      </div>

      <div className="flex border-b mb-6">
        <button className={`px-6 py-3 font-semibold ${activeTab === 'properties' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setActiveTab('properties')}>{t('landlord.myProperties')}</button>
        <button className={`px-6 py-3 font-semibold ${activeTab === 'requests' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setActiveTab('requests')}>{t('landlord.bookingRequests')}</button>
      </div>

      {activeTab === 'properties' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop: any) => (
            <div key={prop.dorm_id} className="rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-44 bg-muted">
                {prop.images?.[0] ? (
                  <img src={prop.images[0].image?.startsWith('http') ? prop.images[0].image : `${MEDIA_BASE_URL}${prop.images[0].image}`} alt={prop.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                )}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-2 items-start">
                  <Badge className={`shadow-md ${statusColorsReq[prop.approval_status || 'approved'] || "bg-gray-100 text-gray-700"}`}>
                    {(prop.approval_status || 'approved').toUpperCase()}
                  </Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white font-semibold truncate">{prop.name}</p>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <p><span className="text-primary font-bold text-lg">{prop.price_egp} {isAr ? "ج.م" : "EGP"}</span><span className="text-muted-foreground text-sm"> /{isAr ? "شهر" : "month"}</span></p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(prop)} className="p-1.5 rounded-full hover:bg-muted transition-colors" title={isAr ? "تعديل" : "Edit"}><Edit3 className="h-4 w-4 text-muted-foreground" /></button>
                    <button 
                      onClick={() => {
                        if (confirm(t('landlord.deleteConfirm'))) {
                          deleteDormMutation.mutate(prop.dorm_id);
                        }
                      }} 
                      className="p-1.5 rounded-full hover:bg-red-50 transition-colors" 
                      title={isAr ? "حذف" : "Delete"}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {prop.bedrooms} {isAr ? "غرفة" : "Bed"}</span>
                  <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {prop.bathrooms} {isAr ? "حمام" : "Bath"}</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {prop.current_occupants || 0}/{prop.capacity} {isAr ? "مشغول" : "Occupied"}</span>
                </div>
                
                {prop.approval_status === 'rejected' && (
                  <div className="bg-red-50 text-red-700 p-3 mt-auto text-sm rounded-lg border border-red-200">
                    <p className="font-bold">{t('landlord.rejectionReason')}</p>
                    <p>{prop.rejection_reason || (isAr ? "لم يتم تقديم سبب." : "No reason provided.")}</p>
                    <Button variant="outline" size="sm" className="mt-2 w-full bg-white text-red-700 hover:text-red-800" onClick={() => handleEdit(prop)}>
                      {t('landlord.editResubmit')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {properties.length === 0 && <div className="col-span-full py-12 text-center text-muted-foreground">{t('landlord.noProperties')}</div>}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 font-semibold">{isAr ? "الطالب" : "Student"}</th>
                <th className="p-4 font-semibold">{isAr ? "العقار" : "Property"}</th>
                <th className="p-4 font-semibold">{isAr ? "الرسالة" : "Message"}</th>
                <th className="p-4 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                <th className="p-4 font-semibold text-right">{isAr ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {bookingRequests.map((req: any) => (
                <tr key={req.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-4 font-medium cursor-pointer hover:text-primary hover:underline transition-colors" onClick={() => req.student && navigate(`/profile/student/${req.student}`)}>
                    {req.student_details?.name || (isAr ? "طالب" : "Student")}
                  </td>
                  <td className="p-4 text-muted-foreground">{req.dorm_details?.name}</td>
                  <td className="p-4 max-w-[200px] truncate">{req.message || (isAr ? "بدون رسالة" : "No message")}</td>
                  <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${statusColorsReq[req.status]}`}>{isAr ? (req.status === 'pending' ? 'قيد الانتظار' : req.status === 'approved' ? 'مقبول' : 'مرفوض') : req.status}</span></td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        if (req.student_details?.user) {
                          navigate(`/messages?user=${req.student_details.user}&name=${encodeURIComponent(req.student_details.name || 'Student')}`);
                        } else {
                          navigate('/messages');
                        }
                      }}>{t('landlord.chat')}</Button>
                      {req.status === 'pending' && (
                        <>
                          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'approved' })}>{t('landlord.approve')}</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'rejected' })}>{t('landlord.reject')}</Button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1 border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                          onClick={() => navigate(`/review/student?student=${req.student}&name=${encodeURIComponent(req.student_details?.name || 'Student')}`)}
                        >
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {t('landlord.rateStudent')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bookingRequests.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t('landlord.noRequests')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingDormId ? "Edit Property Listing" : "Add New Property Listing"}</DialogTitle>
            <DialogDescription>{editingDormId ? "Update the details and submit for re-verification." : "Fill out the details below to list your property."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="font-semibold">{isAr ? "عنوان العقار" : "Property Title"} <span className="text-red-500">*</span></Label>
              <Input required placeholder="e.g., Spacious 2-Bedroom Apartment" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">{isAr ? "العنوان" : "Address"} <span className="text-red-500">*</span></Label>
                <Input required placeholder="e.g., 123 University Ave" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{isAr ? "المنطقة / الموقع" : "Area / Location"} <span className="text-red-500">*</span></Label>
                <Select required value={formData.location} onValueChange={val => setFormData({...formData, location: val})}>
                  <SelectTrigger><SelectValue placeholder="Select Area" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((loc: any) => <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-primary flex items-center gap-1">
                Google Maps Link <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="https://maps.app.goo.gl/..." value={formData.google_maps_link} onChange={e => setFormData({...formData, google_maps_link: e.target.value})} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">{t('landlord.rent')} <span className="text-red-500">*</span></Label>
                <Input required type="number" placeholder="1500" value={formData.price_egp} onChange={e => setFormData({...formData, price_egp: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t('landlord.capacity')} <span className="text-red-500">*</span></Label>
                <Input required type="number" placeholder="2" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t('landlord.distanceToUniversity')} <span className="text-red-500">*</span></Label>
                <Input required type="number" step="0.1" placeholder="1.5" value={formData.distance_km} onChange={e => setFormData({...formData, distance_km: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t('landlord.occupied')}</Label>
                <Input type="number" placeholder="0" value={formData.current_occupants} onChange={e => setFormData({...formData, current_occupants: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">{isAr ? "غرف النوم" : "Bedrooms"} <span className="text-red-500">*</span></Label>
                <Input required type="number" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{isAr ? "الحمامات" : "Bathrooms"} <span className="text-red-500">*</span></Label>
                <Input required type="number" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">{isAr ? "نوع السكن" : "Gender Preference"} <span className="text-red-500">*</span></Label>
              <Select required value={formData.gender_preference} onValueChange={val => setFormData({...formData, gender_preference: val})}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{isAr ? "للذكور فقط" : "Males Only"}</SelectItem>
                  <SelectItem value="female">{isAr ? "للإناث فقط" : "Females Only"}</SelectItem>
                  <SelectItem value="mixed">{isAr ? "مختلط" : "Mixed"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">{isAr ? "الوصف" : "Description"} <span className="text-red-500">*</span></Label>
              <Textarea required placeholder="Describe the property, rules, etc..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="space-y-3">
              <Label className="font-semibold">Amenities</Label>
              <div className="grid grid-cols-2 gap-3">
                {amenitiesList.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <Checkbox id={a.id} checked={(formData as any)[a.id]} onCheckedChange={(checked) => setFormData({...formData, [a.id]: !!checked})} />
                    <a.icon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={a.id} className="text-sm cursor-pointer">{t(a.labelKey)}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">{isAr ? "صور العقار" : "Property Images"} {!editingDormId && <span className="text-red-500">*</span>}</Label>
              
              {existingImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {existingImages.map((img: any) => (
                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img 
                        src={img.image?.startsWith('http') ? img.image : `${MEDIA_BASE_URL}${img.image}`} 
                        alt="Property" 
                        className="w-full h-full object-cover" 
                      />
                      <button 
                        onClick={() => {
                          if (confirm(isAr ? "هل أنت متأكد من حذف هذه الصورة؟" : "Are you sure you want to delete this image?")) {
                            deleteImageMutation.mutate(img.id);
                            setExistingImages(existingImages.filter(i => i.id !== img.id));
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Input required={!editingDormId} type="file" multiple accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
              {images.length > 0 && <p className="text-sm text-green-600 font-medium">{images.length} {isAr ? "صور جديدة مختارة" : "new images selected"}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createDormMutation.isPending}>
                {createDormMutation.isPending ? "Saving..." : (editingDormId ? "Update Property" : "List Property")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandlordProfile;
