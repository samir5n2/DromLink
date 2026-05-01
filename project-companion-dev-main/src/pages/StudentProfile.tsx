import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, MessageSquare, CalendarDays, MapPin, Heart, Star, CheckCircle, Users, Wifi, Utensils, Shirt, AirVent, Car, Armchair, Tv, Dog, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

const StudentProfile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    fetchApi('/me/')
      .then(data => {
        setProfile(data);
        // Fetch student reviews after profile is loaded
        if (data && data.student_id) {
          fetchApi(`/student-ratings/?student=${data.student_id}`)
            .then(res => {
              setReviews(Array.isArray(res) ? res : (res.results || []));
              setLoadingReviews(false);
            })
            .catch(() => setLoadingReviews(false));
        }
      })
      .catch(err => {
        console.error("Failed to load profile:", err);
        setError(err.message || "Failed to load profile data");
      });
  }, []);

  const { data: savedDorms = [], isLoading: isLoadingSaved } = useQuery({
    queryKey: ['saved_dorms'],
    queryFn: async () => {
      const res = await fetchApi('/saved-dorms/');
      return Array.isArray(res) ? res : (res.results || []);
    }
  });

  const { data: myBookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['my_bookings'],
    queryFn: async () => {
      const res = await fetchApi('/bookings/');
      return Array.isArray(res) ? res : (res.results || []);
    }
  });

  const [ratingDormId, setRatingDormId] = useState<string | null>(null);
  const [ratingLandlordId, setRatingLandlordId] = useState<number | null>(null);
  const [propertyRating, setPropertyRating] = useState(5);
  const [landlordRating, setLandlordRating] = useState(5);
  const [propertyComment, setPropertyComment] = useState("");
  const [landlordComment, setLandlordComment] = useState("");
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      // 1. Submit Dorm Rating
      await fetchApi('/ratings/', {
        method: 'POST',
        body: JSON.stringify({
          dorm: ratingDormId,
          rating: propertyRating,
          comment: propertyComment
        })
      });
      // 2. Submit Landlord Rating
      await fetchApi('/landlord-ratings/', {
        method: 'POST',
        body: JSON.stringify({
          landlord: ratingLandlordId,
          rating: landlordRating,
          comment: landlordComment
        })
      });
    },
    onSuccess: () => {
      toast.success("Ratings submitted successfully!");
      setIsRatingModalOpen(false);
      setPropertyComment("");
      setLandlordComment("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit ratings. Maybe you already rated them?");
    }
  });

  const unsaveMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetchApi(`/saved-dorms/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_dorms'] });
      toast.success("Listing removed from saved.");
    }
  });

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
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Left Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="relative mx-auto w-24 h-24 mb-3">
              <Avatar className="w-24 h-24">
                {profile?.avatar_url && <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />}
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{(profile?.name || "Student").substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-card" />
            </div>
            <h2 className="text-lg font-bold">{profile?.name || "New Student"}</h2>
            <p className="text-sm text-muted-foreground mb-3">{profile.preferred_room_type || (i18n.language === 'ar' ? "طالب" : "Student")}</p>
            <Badge variant="outline" className="border-primary text-primary gap-1 mb-2">
              <CheckCircle className="h-3 w-3" /> {t('profile.verifiedStudent')}
            </Badge>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{profile.average_rating || "0.0"}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{profile.total_reviews || 0} {i18n.language === 'ar' ? "تقييم" : (profile.total_reviews === 1 ? 'review' : 'reviews')}</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.contactInfo')}</p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" /> {profile.email || t('profile.noEmail')}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" /> {profile.phone_number || t('profile.noPhone')}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" /> {profile.gender === 'male' ? (i18n.language === 'ar' ? "ذكر" : "Male") : (profile.gender === 'female' ? (i18n.language === 'ar' ? "أنثى" : "Female") : t('auth.notSpecified'))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.quickActions')}</p>
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => {
                const latestBooking = myBookings[0];
                if (latestBooking?.dorm_details?.landlord_details?.user) {
                  navigate(`/messages?user=${latestBooking.dorm_details.landlord_details.user}&name=${encodeURIComponent(latestBooking.dorm_details.landlord_details.name)}`);
                } else {
                  navigate('/messages');
                }
              }}
            >
              <MessageSquare className="h-4 w-4" /> {t('profile.messageLandlord')}
            </Button>
            <Button 
              className="w-full gap-2"
              onClick={() => navigate('/listings')}
            >
              <CalendarDays className="h-4 w-4" /> {t('profile.bookViewing')}
            </Button>
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-8">
          {/* Overview & Bio */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('profile.overview')}</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  const newBio = prompt(t('profile.enterBio'), profile.bio || "");
                  if (newBio !== null) {
                    try {
                      await fetchApi(`/students/${profile.student_id}/`, {
                        method: 'PATCH',
                        body: JSON.stringify({ bio: newBio })
                      });
                      setProfile({ ...profile, bio: newBio });
                      toast.success(t('profile.bioSuccess'));
                    } catch (err) {
                      toast.error(t('profile.bioError'));
                    }
                  }
                }}
              >
                {t('profile.editBio')}
              </Button>
            </div>
            <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground leading-relaxed">
              {profile.bio ? (
                <p className="whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <p className="italic">{t('profile.noBio')}</p>
              )}
            </div>

            {/* Preferences */}
            <div className="mt-8 mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">✨ {i18n.language === 'ar' ? "التفضيلات" : "Preferences"}</h2>
              
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditFormData({...profile})}
                  >
                    {i18n.language === 'ar' ? "تعديل" : "Edit"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{i18n.language === 'ar' ? "تعديل التفضيلات" : "Edit Preferences"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{i18n.language === 'ar' ? "الميزانية (من)" : "Min Budget"}</Label>
                        <Input 
                          type="number" 
                          step="100"
                          value={editFormData.budget_min_egp || "0"} 
                          onChange={(e) => setEditFormData({...editFormData, budget_min_egp: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{i18n.language === 'ar' ? "الميزانية (إلى)" : "Max Budget"}</Label>
                        <Input 
                          type="number" 
                          step="100"
                          value={editFormData.budget_max_egp || ""} 
                          onChange={(e) => setEditFormData({...editFormData, budget_max_egp: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{i18n.language === 'ar' ? "أقصى مسافة (كم)" : "Max Distance (KM)"}</Label>
                      <Input 
                        type="number" 
                        step="0.5"
                        value={editFormData.preferred_distance_km || ""} 
                        onChange={(e) => setEditFormData({...editFormData, preferred_distance_km: parseFloat(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">{i18n.language === 'ar' ? "الاحتياجات المطلوبة" : "Required Amenities"}</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'needs_wifi', label: t('property.wifi') },
                          { key: 'needs_kitchen', label: t('property.kitchen') },
                          { key: 'needs_laundry', label: t('property.laundry') },
                          { key: 'needs_ac', label: t('property.ac') },
                          { key: 'needs_gym', label: i18n.language === 'ar' ? "جيم / صالة ألعاب" : "Gym" },
                          { key: 'needs_parking', label: t('property.parking') },
                          { key: 'needs_furnished', label: t('property.furnished') },
                          { key: 'needs_smart_tv', label: t('property.smartTv') },
                          { key: 'needs_pet_friendly', label: t('property.petFriendly') },
                          { key: 'needs_scenic_view', label: t('property.scenicView') },
                        ].map((pref) => (
                          <div key={pref.key} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox 
                              id={pref.key} 
                              checked={editFormData[pref.key]} 
                              onCheckedChange={(checked) => setEditFormData({...editFormData, [pref.key]: !!checked})}
                            />
                            <Label htmlFor={pref.key} className="cursor-pointer">{pref.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      {i18n.language === 'ar' ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button onClick={async () => {
                      try {
                        await fetchApi(`/students/${profile.student_id}/`, {
                          method: 'PATCH',
                          body: JSON.stringify(editFormData)
                        });
                        setProfile(editFormData);
                        setIsEditDialogOpen(false);
                        toast.success(i18n.language === 'ar' ? "تم تحديث التفضيلات بنجاح" : "Preferences updated successfully!");
                      } catch (err) {
                        toast.error(i18n.language === 'ar' ? "فشل التحديث" : "Update failed");
                      }
                    }}>
                      {i18n.language === 'ar' ? "حفظ التغييرات" : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border bg-card p-4 flex flex-col justify-center">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{i18n.language === 'ar' ? "نطاق الميزانية" : "Budget Range"}</p>
                <p className="font-bold text-lg text-primary">{profile.budget_min_egp || 0} - {profile.budget_max_egp || 1000} {i18n.language === 'ar' ? "ج.م" : "EGP"}</p>
              </div>
              <div className="rounded-xl border bg-card p-4 flex flex-col justify-center">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{i18n.language === 'ar' ? "أقصى مسافة" : "Max Distance"}</p>
                <p className="font-bold text-lg text-primary">{profile.preferred_distance_km || 5} {i18n.language === 'ar' ? "كم" : "KM"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{i18n.language === 'ar' ? "تفضيلات السكن" : "Housing Preferences"}</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'needs_wifi', label: t('property.wifi'), icon: Wifi },
                  { key: 'needs_kitchen', label: t('property.kitchen'), icon: Utensils },
                  { key: 'needs_laundry', label: t('property.laundry'), icon: Shirt },
                  { key: 'needs_ac', label: t('property.ac'), icon: AirVent },
                  { key: 'needs_gym', label: i18n.language === 'ar' ? "جيم" : "Gym", icon: Users },
                  { key: 'needs_parking', label: t('property.parking'), icon: Car },
                  { key: 'needs_furnished', label: t('property.furnished'), icon: Armchair },
                  { key: 'needs_smart_tv', label: t('property.smartTv'), icon: Tv },
                  { key: 'needs_pet_friendly', label: t('property.petFriendly'), icon: Dog },
                  { key: 'needs_scenic_view', label: t('property.scenicView'), icon: Mountain },
                ].map((pref) => profile[pref.key] && (
                  <Badge key={pref.key} variant="secondary" className="gap-1.5 py-1.5 px-3">
                    <pref.icon className="h-3.5 w-3.5" />
                    {pref.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ratings & Reviews */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{i18n.language === 'ar' ? "تقييمات الملاك" : "Landlord Reviews"}</h2>
              <div className="space-y-4">
                {loadingReviews ? (
                  <p className="text-sm text-muted-foreground">{i18n.language === 'ar' ? "جاري تحميل التقييمات..." : "Loading reviews..."}</p>
                ) : reviews.length > 0 ? (
                  reviews.map((rev: any) => (
                    <div key={rev.id} className="rounded-xl border bg-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < Math.floor(rev.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                          <span className="text-xs font-semibold">{rev.rating}.0</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm italic text-muted-foreground">"{rev.comment}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">{i18n.language === 'ar' ? "لا يوجد تقييمات بعد. يمكن للملاك تقييمك بعد الإقامة!" : "No reviews yet. Landlords can rate you after a stay!"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Saved Listings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('profile.savedListings')}</h2>
              <Button variant="link" className="text-primary p-0">{i18n.language === 'ar' ? "عرض الكل" : "View All"}</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingSaved ? (
                <div className="col-span-full py-8 text-center text-muted-foreground">{i18n.language === 'ar' ? "جاري تحميل السكنات..." : "Loading saved listings..."}</div>
              ) : savedDorms.length === 0 ? (
                <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">{t('profile.noSaved')}</div>
              ) : (
                savedDorms.map((saved: any) => {
                  const dorm = saved.dorm_details;
                  if (!dorm) return null;
                  const image = dorm.images?.[0]?.image ? (dorm.images[0].image.startsWith('http') ? dorm.images[0].image : `http://127.0.0.1:8000${dorm.images[0].image}`) : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=260&fit=crop";
                  return (
                    <div key={saved.id} className="rounded-xl border bg-card overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/property/${dorm.dorm_id}`)}>
                      <div className="relative h-36">
                        <img src={image} alt={dorm.name} className="w-full h-full object-cover" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            unsaveMutation.mutate(saved.id);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                        >
                          <Heart className="h-4 w-4 text-primary fill-primary" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-white text-sm font-semibold truncate">{dorm.name}</p>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-primary font-bold text-sm">{dorm.price_egp} {i18n.language === 'ar' ? "ج.م / شهر" : "EGP / mo"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" /> {dorm.address}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* My Bookings */}
          <div>
            <h2 className="text-xl font-bold mb-4">{t('profile.myBookings')}</h2>
            <div className="rounded-xl border bg-card divide-y">
              {isLoadingBookings ? (
                <div className="p-4 text-center text-muted-foreground">{i18n.language === 'ar' ? "جاري تحميل الحجوزات..." : "Loading bookings..."}</div>
              ) : myBookings.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground border-2 border-dashed m-4 rounded-xl">{t('profile.noBookings')}</div>
              ) : (
                myBookings.map((booking: any) => {
                  const dorm = booking.dorm_details;
                  if (!dorm) return null;
                  return (
                    <div key={booking.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm cursor-pointer hover:underline text-primary" onClick={() => navigate(`/property/${dorm.dorm_id}`)}>{dorm.name}</p>
                        <p className="text-xs text-muted-foreground">{i18n.language === 'ar' ? "المالك" : "Landlord"}: {dorm.landlord_details?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {t('profile.requestedOn')} {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${statusColors[booking.status] || "bg-gray-100 text-gray-700"}`}>
                          {i18n.language === 'ar' ? (booking.status === 'pending' ? 'انتظار' : booking.status === 'approved' ? 'مقبول' : 'مرفوض') : booking.status}
                        </span>
                        <p className="text-primary font-bold text-sm mt-1">{dorm.price_egp} {i18n.language === 'ar' ? "ج.م / شهر" : "EGP / mo"}</p>
                        {booking.status === 'approved' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 text-[10px] h-7 px-2 rounded-full"
                            onClick={() => {
                              setRatingDormId(dorm.dorm_id);
                              setRatingLandlordId(dorm.landlord);
                              setIsRatingModalOpen(true);
                            }}
                          >
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" /> {t('profile.rateStay')}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rate Your Stay</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Property Rating */}
            <div className="space-y-3">
              <p className="font-semibold text-sm">How was the Property?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setPropertyRating(s)} className="transition-transform hover:scale-125">
                    <Star className={cn("h-6 w-6", s <= propertyRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
              <Textarea 
                placeholder="Comment about the housing..."
                value={propertyComment}
                onChange={(e) => setPropertyComment(e.target.value)}
                className="text-sm min-h-[80px]"
              />
            </div>

            <hr />

            {/* Landlord Rating */}
            <div className="space-y-3">
              <p className="font-semibold text-sm">How was the Landlord?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setLandlordRating(s)} className="transition-transform hover:scale-125">
                    <Star className={cn("h-6 w-6", s <= landlordRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
              <Textarea 
                placeholder="Comment about the landlord's behavior..."
                value={landlordComment}
                onChange={(e) => setLandlordComment(e.target.value)}
                className="text-sm min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full" 
              onClick={() => submitRatingMutation.mutate()}
              disabled={submitRatingMutation.isPending || !propertyComment.trim() || !landlordComment.trim()}
            >
              {submitRatingMutation.isPending ? "Submitting..." : "Submit Both Reviews"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProfile;
