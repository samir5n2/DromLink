import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare, ShieldCheck, MapPin, Star } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PublicProfile = () => {
  const { id, type } = useParams<{ id: string, type: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { isLoggedIn } = useAuth();
  const isAr = i18n.language === "ar";

  const endpoint = type === 'landlord' ? `/landlords/${id}/` : `/students/${id}/`;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['public_profile', type, id],
    queryFn: async () => await fetchApi(endpoint),
  });

  const { data: properties = [], isLoading: propsLoading } = useQuery({
    queryKey: ['public_landlord_properties', id],
    queryFn: async () => await fetchApi(`/dorms/?landlord=${id}`),
    enabled: type === 'landlord' && !!id,
  });

  const { data: studentReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['public_student_reviews', id],
    queryFn: async () => await fetchApi(`/student-ratings/?student=${id}`),
    enabled: type === 'student' && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground mb-6">The user you are looking for does not exist.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const handleContact = () => {
    if (!isLoggedIn) {
      toast.info("Please sign in to contact this user");
      navigate("/sign-in");
      return;
    }
    const userId = profile.user;
    if (userId) {
      navigate(`/messages?user=${userId}&name=${encodeURIComponent(profile.name || 'User')}`);
    } else {
      toast.error("User ID not found");
    }
  };

  const activeProperties = Array.isArray(properties) ? properties : (properties.results || []);

  return (
    <div className="container py-12 max-w-5xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        &larr; {isAr ? "العودة" : "Back"}
      </Button>
      
      <div className="rounded-2xl border bg-card p-8 md:p-12 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-background shadow-md">
            {profile?.avatar_url && <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />}
            <AvatarFallback className="text-4xl bg-primary/10 text-primary">
              {(profile?.name || "User").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-3 w-3 text-white" />
          </span>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
            <Badge variant="outline" className="border-primary text-primary">
              {type === 'landlord' ? 'Verified Landlord' : 'Verified Student'}
            </Badge>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{profile.average_rating || "0.0"}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{profile.total_reviews || 0} {isAr ? "تقييم" : "reviews"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
            {profile.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> 
                {profile.email === "Hidden" ? (isAr ? "البريد الإلكتروني محمي" : "Email Protected") : profile.email}
              </span>
            )}
            {profile.phone_number && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> 
                {profile.phone_number === "Hidden" ? (isAr ? "الهاتف محمي" : "Phone Protected") : profile.phone_number}
              </span>
            )}
            {(profile.email === "Hidden" || profile.phone_number === "Hidden") && (
              <p className="w-full text-xs text-primary mt-1 font-medium italic">
                {isAr ? "* تظهر بيانات التواصل فقط بعد الموافقة على الحجز" : "* Contact details visible after booking approval"}
              </p>
            )}
          </div>
          
          <div className="pt-4 flex justify-center md:justify-start">
            <Button onClick={handleContact} className="gap-2 rounded-full px-8">
              <MessageSquare className="h-4 w-4" /> {isAr ? "إرسال رسالة" : "Send Message"}
            </Button>
          </div>
        </div>
      </div>

      {type === 'landlord' && (
        <div className="pt-8">
          <h2 className="text-2xl font-bold mb-6">{isAr ? "عقارات المالك" : "Properties by this Landlord"}</h2>
          {propsLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading properties...</div>
          ) : activeProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProperties.map((prop: any) => {
                const image = prop.images?.[0]?.image ? (prop.images[0].image.startsWith('http') ? prop.images[0].image : `${API_BASE_URL.replace('/api', '')}${prop.images[0].image}`) : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=260&fit=crop";
                return (
                  <div key={prop.dorm_id} className="rounded-xl border bg-card overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/property/${prop.dorm_id}`)}>
                    <div className="relative h-48">
                      <img src={image} alt={prop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 left-2 flex gap-2">
                        <Badge className="shadow-md bg-white text-black hover:bg-white border-none font-semibold">
                          {prop.room_type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white font-semibold truncate">{prop.name}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-primary font-bold text-lg">{prop.price_egp} EGP / mo</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> {prop.address}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl border border-dashed bg-muted/30 text-muted-foreground">
              {isAr ? "لا توجد عقارات منشورة لهذا المالك." : "No published properties by this landlord."}
            </div>
          )}
        </div>
      )}

      {type === 'student' && (
        <div className="pt-8">
          <h2 className="text-2xl font-bold mb-6">{isAr ? "تقييمات الملاك لهذا الطالب" : "Landlord Reviews for this Student"}</h2>
          {reviewsLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading reviews...</div>
          ) : (Array.isArray(studentReviews) ? studentReviews : (studentReviews.results || [])).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Array.isArray(studentReviews) ? studentReviews : (studentReviews.results || [])).map((rev: any) => (
                <div key={rev.id} className="rounded-xl border bg-card p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(rev.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                      <span className="text-sm font-bold">{rev.rating}.0</span>
                    </div>
                    <span className="text-xs text-muted-foreground uppercase">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed italic">"{rev.comment}"</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {rev.tags && rev.tags.split(',').map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="px-2 py-0 text-[10px] font-medium">{tag.trim()}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl border border-dashed bg-muted/30 text-muted-foreground">
              {isAr ? "لا توجد تقييمات لهذا الطالب بعد." : "No reviews for this student yet."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
