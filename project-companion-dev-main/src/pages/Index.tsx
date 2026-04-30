import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Building, MessageSquare, ChevronLeft, ChevronRight, Bed, Bath, Users, Star, Shield, Clock } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const getFallbackImage = (index: number) => {
  const images = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=260&fit=crop",
  ];
  return images[index % images.length];
};

// Removed static neighborhoods array

const stats = [
  { value: "10K+", label: "Active Students" },
  { value: "2,500+", label: "Verified Listings" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "50+", label: "Universities Covered" },
];

// Simple intersection observer hook
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const Index = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const { isLoggedIn, userType } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const heroSection = useInView();
  const featuredSection = useInView();
  const howSection = useInView();
  const neighborhoodSection = useInView();
  const statsSection = useInView();
  const testimonialSection = useInView();
  const queryClient = useQueryClient();

  const [siteReviewRating, setSiteReviewRating] = useState(5);
  const [siteReviewComment, setSiteReviewComment] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const { data: realTestimonials = [], isLoading: isLoadingTestimonials } = useQuery({
    queryKey: ['site_ratings'],
    queryFn: async () => {
      const data = await fetchApi('/site-ratings/');
      const results = Array.isArray(data) ? data : (data.results || []);
      if (results.length > 0) return results.slice(0, 3);
      
      // Fallback to static if no real ones exist
      return [
        { comment: "DormLink made finding my off-campus apartment so easy and stress-free. The filters were incredibly helpful, and I found a perfect place within days!", user_name: "Sarah K.", user_type: "student", rating: 5, profile_id: "demo1" },
        { comment: "As a landlord, DormLink connects me with quality student tenants quickly. The platform is intuitive, and managing my properties has never been simpler.", user_name: "Mark T.", user_type: "landlord", rating: 5, profile_id: "demo2" },
        { comment: "Moving to a new city for university was daunting, but DormLink helped me secure a great place right next to campus. Excellent support and listings!", user_name: "Jessica L.", user_type: "student", rating: 4, profile_id: "demo3" },
      ];
    }
  });

  const siteReviewMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi('/site-ratings/', {
        method: 'POST',
        body: JSON.stringify({
          rating: siteReviewRating,
          comment: siteReviewComment
        })
      });
    },
    onSuccess: () => {
      toast.success(isAr ? "شكراً لمشاركتنا رأيك!" : "Thank you for sharing your feedback!");
      setShowReviewDialog(false);
      setSiteReviewComment("");
      queryClient.invalidateQueries({ queryKey: ['site_ratings'] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit review");
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['site_stats'],
    queryFn: async () => await fetchApi('/stats/')
  });

  const { data: featuredListings = [], isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['featuredDorms', isLoggedIn, userType],
    queryFn: async () => {
      let data;
      let isAI = false;
      
      if (isLoggedIn && userType === 'student') {
        const recs = await fetchApi('/recommendations/');
        const recData = Array.isArray(recs) ? recs : (recs.results || []);
        if (recData.length > 0) {
          data = recData.slice(0, 6);
          isAI = true;
        } else {
          const allDorms = await fetchApi('/dorms/');
          data = allDorms.slice(0, 6);
        }
      } else {
        const allDorms = await fetchApi('/dorms/');
        data = allDorms.slice(0, 6);
      }

      return data.map((dorm: any, index: number) => {
        let type = "APARTMENT";
        if (dorm.room_type && dorm.room_type.toLowerCase() === "shared") type = "SHARED";
        if (dorm.room_type && dorm.room_type.toLowerCase() === "single") type = "STUDIO";
        
        return {
          id: dorm.dorm_id,
          title: dorm.name,
          price: `${dorm.price_egp} EGP`,
          unit: "month",
          type: type,
          beds: dorm.bedrooms || 1,
          baths: dorm.bathrooms || 1,
          max: dorm.capacity || 1,
          rating: dorm.average_rating || 0.0,
          isAI: isAI,
          image: dorm.images?.[0]?.image 
            ? (dorm.images[0].image.startsWith('http') ? dorm.images[0].image.replace(/127\.0\.0\.1:8000|localhost:8000/, 'localhost:8000') : `http://localhost:8000${dorm.images[0].image}`)
            : getFallbackImage(index)
        };
      });
    }
  });

  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const data = await fetchApi('/locations/');
      return data;
    }
  });

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  };

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section ref={heroSection.ref} className="container py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={`${heroSection.inView ? "animate-fade-in-left" : "opacity-0"}`}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              {t("hero.title1")}<br />
              <span className="text-gradient">{t("hero.title2")}</span><br />
              {t("hero.title3")}
            </h1>
            <p className="mt-6 text-muted-foreground text-lg max-w-md leading-relaxed">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg">
              <div className="relative flex-1">
                <Search 
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" 
                  onClick={() => navigate(`/listings?search=${searchQuery}`)}
                />
                <Input 
                  placeholder={t("hero.searchPlaceholder")} 
                  className="pl-12 h-12 rounded-full border-2 border-primary/20 focus-visible:border-primary transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/listings?search=${searchQuery}`)}
                />
              </div>
              <Button
                size="lg"
                className="rounded-full px-8 gap-2 animate-pulse-glow hover-lift h-12"
                onClick={() => navigate(`/listings?search=${searchQuery}`)}
              >
                {t("hero.cta")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className={`hidden lg:block ${heroSection.inView ? "animate-fade-in-right" : "opacity-0"}`}>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=420&fit=crop"
                alt="Student housing"
                className="rounded-2xl object-cover w-full shadow-2xl hover-lift"
              />
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 glass rounded-xl px-4 py-3 animate-float shadow-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold">{t('landing.verifiedListings')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('landing.trusted')}</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 glass rounded-xl px-4 py-3 animate-float stagger-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold">{t('landing.quickBooking')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('landing.under24hrs')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section ref={statsSection.ref} className="border-y bg-primary/5">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: stats?.total_students ? `${stats.total_students}+` : "100+", label: t('landing.activeStudents') },
              { value: stats?.total_properties ? `${stats.total_properties}+` : "50+", label: t('landing.verifiedListings') },
              { value: stats?.satisfaction_rate || "99%", label: t('landing.satisfactionRate') },
              { value: stats?.areas_covered ? `${stats.areas_covered}+` : "10+", label: t('landing.areasCovered') },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center ${statsSection.inView ? "animate-scale-in" : "opacity-0"} stagger-${i + 1}`}
              >
                <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section ref={featuredSection.ref} className="py-16 bg-secondary/30">
        <div className="container">
          <div className={`flex items-center justify-between mb-8 ${featuredSection.inView ? "animate-fade-in" : "opacity-0"}`}>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold">
                {featuredListings[0]?.isAI 
                  ? (isAr ? "أفضل سكنات مناسبة لك" : "Best Dorms For You") 
                  : t("featured.title")}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {featuredListings[0]?.isAI 
                  ? (isAr ? "سكنات مختارة بعناية بواسطة الذكاء الاصطناعي لتناسب ميزانيتك وموقعك" : "Hand-picked by AI to match your budget and location")
                  : t('landing.featuredSub')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-primary font-bold hover:bg-primary/5 hidden sm:flex items-center gap-1"
                onClick={() => navigate('/listings?sort=rating')}
              >
                {isAr ? "عرض المزيد" : "View More"} <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 hover-lift" disabled={!canScrollLeft} onClick={() => scroll("left")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 hover-lift" disabled={!canScrollRight} onClick={() => scroll("right")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div ref={scrollRef} onScroll={handleScroll} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
            {isLoadingFeatured ? (
              <div className="w-full text-center py-10">
                <div className="animate-spin h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : featuredListings.map((listing: any, i: number) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/property/${listing.id}`)}
                className={`min-w-[300px] snap-start rounded-xl border bg-card overflow-hidden hover-lift hover-glow cursor-pointer group ${featuredSection.inView ? "animate-slide-up" : "opacity-0"} stagger-${i + 1}`}
              >
                <div className="relative overflow-hidden">
                  <img src={listing.image} alt={listing.title} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110" />
                  <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-md text-primary-foreground ${listing.type === "SHARED" ? "bg-accent-foreground/70" : "bg-primary"}`}>
                    {listing.type}
                  </span>
                  <div className="absolute top-3 right-3 glass rounded-md px-2 py-0.5 flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold">{listing.rating}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{listing.title}</h3>
                  <p className="text-primary font-bold mt-1">{listing.price}<span className="text-muted-foreground font-normal text-xs">/{t(`featured.${listing.unit}`)}</span></p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{listing.beds} {t("featured.bed")}</span>
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.baths} {t("featured.bath")}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{listing.max} {t("featured.max")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={howSection.ref} className="container py-20 text-center">
        <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${howSection.inView ? "animate-fade-in" : "opacity-0"}`}>{t("howItWorks.title")}</h2>
        <p className={`text-muted-foreground mb-12 max-w-lg mx-auto ${howSection.inView ? "animate-fade-in stagger-1" : "opacity-0"}`}>
          {t('landing.howItWorksSub')}
        </p>
        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            { icon: Search, title: t("howItWorks.search"), desc: t("howItWorks.searchDesc"), path: "/listings", step: "01" },
            { icon: Building, title: t("howItWorks.view"), desc: t("howItWorks.viewDesc"), path: "/listings", step: "02" },
            { icon: MessageSquare, title: t("howItWorks.secure"), desc: t("howItWorks.secureDesc"), path: isLoggedIn ? "/listings" : "/sign-in", step: "03" },
          ].map((step, i) => (
            <div
              key={i}
              onClick={step.path ? () => navigate(step.path!) : undefined}
              className={`relative flex flex-col items-center p-6 rounded-2xl border bg-card hover-lift hover-glow cursor-pointer group ${
                howSection.inView ? "animate-scale-in" : "opacity-0"
              } stagger-${i + 1} ${step.path ? "ring-1 ring-primary/20" : ""}`}
            >
              <span className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {step.step}
              </span>
              <div className="h-14 w-14 rounded-xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors duration-300">
                <step.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Neighborhoods */}
      <section ref={neighborhoodSection.ref} className="py-16 bg-secondary/30">
        <div className="container text-center">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${neighborhoodSection.inView ? "animate-fade-in" : "opacity-0"}`}>{t("neighborhoods.title")}</h2>
          <p className={`text-muted-foreground mb-12 ${neighborhoodSection.inView ? "animate-fade-in stagger-1" : "opacity-0"}`}>
            {t('landing.neighborhoodsSub')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoadingLocations ? (
              <div className="col-span-full text-center py-10">{t('landing.loadingAreas')}</div>
            ) : locations.map((n: any, i: number) => (
              <div
                key={n.id}
                onClick={() => navigate(`/listings?location=${n.id}`)}
                className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer group hover-lift ${
                  neighborhoodSection.inView ? "animate-scale-in" : "opacity-0"
                } stagger-${(i % 4) + 1}`}
              >
                <img src={n.image || getFallbackImage(i)} alt={n.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:from-black/90" />
                <div className="absolute bottom-4 left-4 text-left">
                  <span className="text-white font-semibold text-sm">{n.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialSection.ref} className="container py-20 text-center">
        <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${testimonialSection.inView ? "animate-fade-in" : "opacity-0"}`}>{t("testimonials.title")}</h2>
        <p className={`text-muted-foreground mb-12 ${testimonialSection.inView ? "animate-fade-in stagger-1" : "opacity-0"}`}>
          {t('landing.testimonialsSub')}
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {realTestimonials.map((item: any, i: number) => (
            <div
              key={i}
              className={`border rounded-xl p-6 text-left bg-card hover-lift hover-glow group ${
                testimonialSection.inView ? "animate-slide-up" : "opacity-0"
              } stagger-${i + 1}`}
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: item.rating }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{item.comment}"</p>
              <div 
                className={cn(
                  "flex items-center gap-3 pt-4 border-t border-border/50", 
                  item.profile_id && "cursor-pointer group/author"
                )}
                onClick={() => {
                  if (item.profile_id && item.user_type) {
                    navigate(`/profile/${item.user_type}/${item.profile_id}`);
                  }
                }}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary group-hover/author:bg-primary group-hover/author:text-primary-foreground transition-colors duration-300 overflow-hidden">
                  {(item.user_name || item.name).charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm group-hover/author:text-primary transition-colors group-hover/author:underline">
                    {item.user_name || item.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{item.user_type || item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isLoggedIn && (
          <div className="mt-12">
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full px-8 hover-lift">
                  {t('landing.ratePlatform')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('landing.rateTitle')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s} 
                        onClick={() => setSiteReviewRating(s)}
                        className="transition-transform hover:scale-125"
                      >
                        <Star className={cn("h-8 w-8", s <= siteReviewRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
                      </button>
                    ))}
                  </div>
                  <Textarea 
                    placeholder={t('landing.ratePlaceholder')}
                    value={siteReviewComment}
                    onChange={(e) => setSiteReviewComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => siteReviewMutation.mutate()} 
                    disabled={siteReviewMutation.isPending || !siteReviewComment.trim()}
                    className="w-full"
                  >
                    {siteReviewMutation.isPending ? t('landing.submitting') : t('landing.submitReview')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            {!isLoggedIn ? t('landing.readyTitle') : 
             userType === 'landlord' ? t('landing.readyTitleLandlord') : 
             t('landing.readyTitleStudent')}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            {!isLoggedIn ? t('landing.readySub') : 
             userType === 'landlord' ? t('landing.readySubLandlord') : 
             t('landing.readySubStudent')}
          </p>
          <div className="flex items-center justify-center gap-4">
            {!isLoggedIn ? (
              <>
                <Button size="lg" className="rounded-full px-8 gap-2 hover-lift" onClick={() => navigate("/listings")}>
                  {t('landing.browseListings')} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 hover-lift" onClick={() => navigate("/create-account")}>
                  {t('landing.signUpFree')}
                </Button>
              </>
            ) : userType === 'landlord' ? (
              <Button size="lg" className="rounded-full px-8 gap-2 hover-lift" onClick={() => navigate("/profile?add=true")}>
                {t('landing.listPropertyBtn')} <Building className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" className="rounded-full px-8 gap-2 hover-lift" onClick={() => navigate("/listings")}>
                {t('landing.browseListingsBtn')} <Search className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
