import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, MapPin, Star, Share, Heart, Bed, Bath, Users, 
  Wifi, Wind, UtensilsCrossed, Sofa, Calendar, ShieldCheck, Mail, Phone, 
  Lock, MessageCircle, Trash2, MessageSquare,
  Car, Armchair, Tv, Dog, Mountain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi, MEDIA_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isLoggedIn, userType } = useAuth();
  const queryClient = useQueryClient();
  const isAr = i18n.language === "ar";

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => await fetchApi(`/dorms/${id}/`),
  });

  const { data: ratingsData = [] } = useQuery({
    queryKey: ['property_ratings', id],
    queryFn: async () => {
      const res = await fetchApi(`/ratings/?dorm=${id}`);
      return Array.isArray(res) ? res : (res.results || []);
    },
    enabled: !!id
  });

  const { data: savedDorms = [] } = useQuery({
    queryKey: ['saved_dorms'],
    enabled: isLoggedIn,
    queryFn: async () => {
      const res = await fetchApi('/saved-dorms/');
      return Array.isArray(res) ? res : (res.results || []);
    }
  });

  const { data: userBookings = [] } = useQuery({
    queryKey: ['user_bookings'],
    queryFn: async () => {
      const res = await fetchApi('/bookings/');
      return Array.isArray(res) ? res : (res.results || []);
    },
    enabled: isLoggedIn && userType === 'student'
  });

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: async () => await fetchApi('/me/'),
    enabled: isLoggedIn
  });
  
  const isOwner = isLoggedIn && userType === 'landlord' && profile?.landlord_id === property?.landlord;
  const hasAlreadyBooked = userBookings.some((b: any) => b.dorm === property?.dorm_id);
  const isGenderMismatch = isLoggedIn && userType === 'student' && profile?.gender !== property?.gender_preference;

  const toggleSaveMutation = useMutation({
    mutationFn: async ({ dormId, savedId }: { dormId: string, savedId?: number }) => {
      if (savedId) {
        await fetchApi(`/saved-dorms/${savedId}/`, { method: 'DELETE' });
      } else {
        await fetchApi('/saved-dorms/', { method: 'POST', body: JSON.stringify({ dorm: dormId }) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_dorms'] });
    }
  });

  const bookMutation = useMutation({
    mutationFn: async () => await fetchApi('/bookings/', { method: 'POST', body: JSON.stringify({ dorm: property?.dorm_id }) }),
    onSuccess: () => {
      toast.success(isAr ? "تم إرسال طلب الحجز بنجاح للمالك!" : "Booking request sent successfully to the landlord!");
      navigate('/profile');
    },
    onError: (err: any) => toast.error(err.message || "Failed to send booking request")
  });

  const deleteMutation = useMutation({
    mutationFn: async () => await fetchApi(`/dorms/${id}/`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(isAr ? "تم حذف السكن بنجاح" : "Property deleted successfully");
      navigate('/profile');
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete property")
  });

  const handleBookNow = () => {
    if (!isLoggedIn) {
      toast.info(isAr ? "يرجى تسجيل الدخول لحجز هذا السكن" : "Please sign in to book this property");
      navigate("/sign-in");
      return;
    }
    if (userType !== "student") {
      toast.error(isAr ? "يمكن للطلاب فقط إرسال طلبات الحجز." : "Only students can create booking requests.");
      return;
    }
    if (hasAlreadyBooked) {
      toast.info(isAr ? "لقد قمت بالفعل بإرسال طلب حجز لهذا السكن." : "You have already sent a booking request for this property.");
      return;
    }
    if (isGenderMismatch) {
      const genderLabel = property.gender_preference === 'male' ? (isAr ? "الشباب" : "males") : (isAr ? "البنات" : "females");
      toast.error(t('property.genderMismatch', { gender: genderLabel }));
      return;
    }
    bookMutation.mutate();
  };

  const handleContactLandlord = () => {
    if (!isLoggedIn) {
      toast.info("Please sign in to contact the landlord");
      navigate("/sign-in");
      return;
    }
    const landlordUserId = property.landlord_details?.user;
    const landlordName = property.landlord_details?.name || "Landlord";
    if (landlordUserId) {
      navigate(`/messages?user=${landlordUserId}&name=${encodeURIComponent(landlordName)}`);
    } else {
      navigate("/messages");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
        <p className="text-muted-foreground mb-6">The property you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate('/listings')}>Back to Listings</Button>
      </div>
    );
  }

  const images = property?.images && property.images.length > 0 
    ? property.images.map((img: any) => img?.image ? (img.image.startsWith('http') ? img.image : `${MEDIA_BASE_URL}${img.image}`) : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop")
    : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop"];

  const avgRating = property.average_rating || "0.0";
  const totalReviews = ratingsData.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          {t('property.back')}
        </button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50 hover:bg-secondary">
            <Share className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-secondary/50 hover:bg-secondary text-red-500 hover:text-red-600"
            onClick={() => {
              if (!isLoggedIn) {
                toast.info("Please sign in to save properties");
                navigate("/sign-in");
                return;
              }
              const savedInfo = Array.isArray(savedDorms) ? savedDorms.find((s: any) => s.dorm === property.dorm_id) : undefined;
              toggleSaveMutation.mutate({ dormId: property.dorm_id, savedId: savedInfo?.id });
            }}
          >
            <Heart className={`h-4 w-4 ${Array.isArray(savedDorms) && savedDorms.find((s: any) => s.dorm === property?.dorm_id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
          <div className="md:col-span-3 row-span-2 relative cursor-pointer group" onClick={() => { setLightboxIndex(0); setIsLightboxOpen(true); }}>
            <img src={images[0]} alt="Main" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
          <div className="hidden md:block relative cursor-pointer group" onClick={() => { setLightboxIndex(1); setIsLightboxOpen(true); }}>
            <img src={images[1] || images[0]} alt="Side 1" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
          <div className="hidden md:block relative cursor-pointer group" onClick={() => { setLightboxIndex(2); setIsLightboxOpen(true); }}>
            <img src={images[2] || images[0]} alt="Side 2" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            {images.length > 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-lg">+{images.length - 3} {isAr ? "صور" : "Photos"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold">
                  {(property?.room_type || "APARTMENT").toUpperCase()}
                </Badge>
                <Badge className={cn(
                  "border-none font-semibold gap-1.5",
                  property.gender_preference === 'male' ? "bg-blue-100 text-blue-700" :
                  "bg-pink-100 text-pink-700"
                )}>
                  <Users className="h-3 w-3" />
                  {property.gender_preference === 'male' ? t('property.males') :
                   t('property.females')}
                </Badge>
                {property.approval_status === "approved" && (
                  <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
                    <ShieldCheck className="h-3 w-3" /> {t('property.verified')}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3">{property.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" /> {property.address}, {property.location_details?.name}
                </span>
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {avgRating} ({totalReviews} {isAr ? "تقييمات" : "reviews"})
                </span>
                {property.google_maps_link && (
                  <a 
                    href={property.google_maps_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline font-medium"
                  >
                    <MapPin className="h-4 w-4" /> {t('property.viewOnMap')}
                  </a>
                )}
              </div>
            </div>

            <hr className="border-border" />

            <div className="flex flex-wrap gap-6 py-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                  <Bed className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{property.bedrooms} {t('property.bedrooms')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                  <Bath className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{property.bathrooms} {t('property.bathrooms')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{property.distance_km} {isAr ? "كم" : "KM"}</div>
                  <div className="text-xs text-muted-foreground">{t('property.distanceToUniversity')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">
                    {Math.max(0, property.capacity - (property.current_occupants || 0))} {t('property.spotsAvailable')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('property.capacity')} {property.capacity}</div>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t('property.about')}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {property.description || (isAr ? "لا يوجد وصف متاح." : "No description provided.")}
              </p>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t('property.amenities')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.has_wifi && (
                  <div className="flex items-center gap-3">
                    <Wifi className="h-5 w-5 text-primary" />
                    <span>{t('property.wifi')}</span>
                  </div>
                )}
                {property.has_ac && (
                  <div className="flex items-center gap-3">
                    <Wind className="h-5 w-5 text-primary" />
                    <span>{t('property.ac')}</span>
                  </div>
                )}
                {property.has_kitchen && (
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    <span>{t('property.kitchen')}</span>
                  </div>
                )}
                {property.has_laundry && (
                  <div className="flex items-center gap-3">
                    <Sofa className="h-5 w-5 text-primary" />
                    <span>{t('property.laundry')}</span>
                  </div>
                )}
                {property.has_parking && (
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-primary" />
                    <span>{t('property.parking')}</span>
                  </div>
                )}
                {property.is_furnished && (
                  <div className="flex items-center gap-3">
                    <Armchair className="h-5 w-5 text-primary" />
                    <span>{t('property.furnished')}</span>
                  </div>
                )}
                {property.has_smart_tv && (
                  <div className="flex items-center gap-3">
                    <Tv className="h-5 w-5 text-primary" />
                    <span>{t('property.smartTv')}</span>
                  </div>
                )}
                {property.is_pet_friendly && (
                  <div className="flex items-center gap-3">
                    <Dog className="h-5 w-5 text-primary" />
                    <span>{t('property.petFriendly')}</span>
                  </div>
                )}
                {property.has_scenic_view && (
                  <div className="flex items-center gap-3">
                    <Mountain className="h-5 w-5 text-primary" />
                    <span>{t('property.scenicView')}</span>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{isAr ? "الموقع على الخريطة" : "Location on Map"}</h2>
              <div className="rounded-2xl overflow-hidden h-[300px] border border-border relative group shadow-inner">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  title="Property Location"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(property.address + " " + (property.location_details?.name || ""))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  className="filter grayscale-[0.2] contrast-[1.1] transition-all group-hover:grayscale-0"
                ></iframe>
                <div 
                  className="absolute inset-0 cursor-pointer flex items-end p-4 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    if (property.google_maps_link) {
                      window.open(property.google_maps_link, '_blank');
                    } else {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address + " " + (property.location_details?.name || ""))}`, '_blank');
                    }
                  }}
                >
                  <Button variant="secondary" size="sm" className="rounded-full gap-2 shadow-lg">
                    <MapPin className="h-4 w-4" />
                    {isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {property.address}, {property.location_details?.name}
              </p>
            </div>

            <hr className="border-border" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t('property.reviews')}</h2>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-xl">{avgRating}</span>
                  <span className="text-muted-foreground">• {totalReviews} {isAr ? "مراجعة" : "reviews"}</span>
                </div>
              </div>

              {ratingsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ratingsData.map((rating: any) => (
                    <div key={rating.id} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {rating.is_anonymous ? "A" : (rating.student_details?.name || "S").substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{rating.is_anonymous ? (isAr ? "مجهول" : "Anonymous") : (rating.student_details?.name || "Student")}</p>
                          <p className="text-xs text-muted-foreground">{rating.created_at ? new Date(rating.created_at).toLocaleDateString() : t('property.recently')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(rating.dorm_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {rating.comment || (isAr ? "لا يوجد تعليق" : "No comment provided")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-xl border border-dashed bg-muted/30 text-muted-foreground">
                  {t('property.noReviews')}
                </div>
              )}
            </div>

            <hr className="border-border" />

            <div className="space-y-6 bg-secondary/30 rounded-2xl p-6 border border-border">
              <h2 className="text-2xl font-bold">{t('property.host')}</h2>
              <div className="flex items-center gap-5 cursor-pointer group" onClick={() => property.landlord && navigate(`/profile/landlord/${property.landlord}`)}>
                <Avatar className="h-20 w-20 border-2 border-background shadow-md group-hover:scale-105 transition-transform">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {(property.landlord_details?.name || "Landlord").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{property.landlord_details?.name || (isAr ? "مالك موثق" : "Verified Landlord")}</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <span className="flex items-center"><Star className="h-3.5 w-3.5 mr-1 fill-yellow-400 text-yellow-400" /> {property.landlord_details?.average_rating || "0.0"} {isAr ? "تقييم" : "Rating"}</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleContactLandlord} 
                variant="outline" 
                className="w-full sm:w-auto gap-2 rounded-full border-primary text-primary"
                disabled={isLoggedIn && profile?.account_status !== 'approved'}
              >
                <MessageCircle className="h-4 w-4" />
                {profile?.account_status !== 'approved' && isLoggedIn
                  ? t('property.pendingApproval')
                  : t('property.messageHost')}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-border rounded-2xl p-6 shadow-xl bg-card space-y-6">
              <p className="text-3xl font-bold text-primary">{property.price_egp} <span className="text-base font-normal text-muted-foreground">{isAr ? "ج.م / شهر" : "EGP / month"}</span></p>
              
              <div className="space-y-4">
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="p-3">
                    <div className="text-xs font-bold uppercase text-muted-foreground">{t('property.available')}</div>
                    <div className="text-sm mt-1 font-semibold text-green-600">
                      {Math.max(0, property.capacity - (property.current_occupants || 0))} {t('property.spots')}
                    </div>
                  </div>
                </div>

                {isOwner ? (
                  <div className="space-y-3">
                    <Button className="w-full py-6 text-lg rounded-xl" onClick={() => navigate(`/profile?tab=properties&edit=${property.dorm_id}`)}>
                      {t('property.edit')}
                    </Button>
                    <Button variant="outline" className="w-full py-6 text-lg rounded-xl border-red-200 text-red-600" onClick={() => {
                      if (confirm(t('property.deleteConfirm'))) {
                        deleteMutation.mutate();
                      }
                    }}>
                      <Trash2 className="h-5 w-5 mr-2" />
                      {t('property.delete')}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full py-6 text-lg rounded-xl shadow-lg" 
                    onClick={handleBookNow} 
                    disabled={bookMutation.isPending || (property.capacity - (property.current_occupants || 0) <= 0) || (isLoggedIn && userType !== "student") || hasAlreadyBooked || profile?.account_status !== 'approved' || isGenderMismatch}
                  >
                    {bookMutation.isPending ? "..." : (
                      profile?.account_status !== 'approved' && isLoggedIn
                        ? t('property.pendingApproval')
                        : isGenderMismatch
                          ? t('property.genderMismatch', { gender: property.gender_preference === 'male' ? (isAr ? "الشباب" : "males") : (isAr ? "البنات" : "females") })
                          : (property.capacity - (property.current_occupants || 0) <= 0)
                            ? t('property.fullyBooked')
                            : hasAlreadyBooked
                              ? t('property.alreadyRequested')
                              : t('property.bookNow')
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 border-none bg-black/95 flex flex-col items-center justify-center">
          <img src={images[lightboxIndex]} alt="Gallery" className="max-w-full max-h-full object-contain" />
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetails;
