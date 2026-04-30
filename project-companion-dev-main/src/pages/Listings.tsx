import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, MapPin, Bed, Wifi, Wind, Refrigerator, Bookmark, Heart, CheckCircle, Star, ArrowRight, Car, Armchair, Tv, Dog, Mountain, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const featuredProperty = {
  title: "New Cairo Smart Suites",
  rating: 4.9,
  image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
};

// Add fallback image generator
const getFallbackImage = (index: number) => {
  const images = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
  ];
  return images[index % images.length];
};

const Listings = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locationParam = searchParams.get("location");
  const searchParam = searchParams.get("search");
  const { isLoggedIn, userType } = useAuth();

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchTerm, setSearchTerm] = useState(searchParam || "");
  const [areaFilter, setAreaFilter] = useState("");
  const [bedType, setBedType] = useState("any");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [gender, setGender] = useState("any");
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['dorms', locationParam],
    queryFn: async () => {
      const url = locationParam ? `/dorms/?location=${locationParam}` : '/dorms/';
      const responseData = await fetchApi(url);
      const data = Array.isArray(responseData) ? responseData : (responseData.results || []);
      return data.map((dorm: any, index: number) => {
        const amenities = [];
        if (dorm.has_wifi) amenities.push("wifi");
        if (dorm.has_ac) amenities.push("ac");
        if (dorm.has_kitchen || dorm.has_laundry) amenities.push("appliances");
        if (dorm.has_parking) amenities.push("parking");
        if (dorm.is_furnished) amenities.push("furnished");
        if (dorm.has_smart_tv) amenities.push("smart_tv");
        if (dorm.is_pet_friendly) amenities.push("pet_friendly");
        if (dorm.has_scenic_view) amenities.push("scenic_view");

        // Map backend types to frontend expectations
        let type = "apartment";
        if (dorm.room_type && dorm.room_type.toLowerCase() === "shared") type = "room";
        if (dorm.room_type && dorm.room_type.toLowerCase() === "single") type = "bed";

        return {
          id: dorm.dorm_id,
          title: dorm.name,
          location: dorm.location_details?.name || "",
          address: dorm.address || "",
          district: "",
          price: dorm.price_egp,
          beds: dorm.bedrooms || 1,
          bathrooms: dorm.bathrooms || 1,
          capacity: dorm.capacity || 1,
          current_occupants: dorm.current_occupants || 0,
          type: type,
          gender: dorm.gender_preference,
          amenities: amenities,
          verified: true,
          rating: dorm.average_rating || 0.0,
          distance_km: dorm.distance_km,
          has_approved_booking: dorm.has_approved_booking,
          image: dorm.images?.[0]?.image 
            ? (dorm.images[0].image.startsWith('http') ? dorm.images[0].image.replace(/127\.0\.0\.1:8000|localhost:8000/, 'localhost:8000') : `http://localhost:8000${dorm.images[0].image}`)
            : getFallbackImage(index)
        };
      });
    }
  });

  const queryClient = useQueryClient();
  const { data: savedDorms = [] } = useQuery({
    queryKey: ['saved_dorms'],
    queryFn: async () => {
      const res = await fetchApi('/saved-dorms/');
      return Array.isArray(res) ? res : (res.results || []);
    }
  });

  const { data: recommendations = [], isLoading: isLoadingRecs } = useQuery({
    queryKey: ['recommendations', searchTerm],
    enabled: !!(isLoggedIn && userType === 'student'),
    queryFn: async () => {
      const url = searchTerm ? `/recommendations/?search=${encodeURIComponent(searchTerm)}` : '/recommendations/';
      const res = await fetchApi(url);
      return Array.isArray(res) ? res : (res.results || []);
    }
  });

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

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetchApi('/locations/');
      return Array.isArray(res) ? res : (res.results || []);
    }
  });

  const [searched, setSearched] = useState(!!searchParam);

  useEffect(() => {
    if (searchParam !== null) {
      setSearchTerm(searchParam);
      setSearched(true);
    }
  }, [searchParam]);


  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((p: any) => {
      if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase()) && !p.location.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (minPrice && p.price < Number(minPrice)) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      if (bedType !== "any" && p.type !== bedType) return false;
      if (gender !== "any" && p.gender !== gender) return false;
      if (amenities.length > 0 && !amenities.every((a) => p.amenities.includes(a))) return false;
      if (areaFilter && 
          !p.location.toLowerCase().includes(areaFilter.toLowerCase()) && 
          !p.address.toLowerCase().includes(areaFilter.toLowerCase())
      ) return false;
      return true;
    });
  }, [properties, searchTerm, minPrice, maxPrice, bedType, gender, amenities, areaFilter]);

  const handleSearch = () => {
    setSearched(true);
  };

  const sortParam = searchParams.get("sort");

  const sortedProperties = useMemo(() => {
    let result = [...filteredProperties];
    if (sortParam === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  }, [filteredProperties, sortParam]);

  const displayProperties = (searched || sortParam === "rating") ? sortedProperties : properties;
  
  // Update location label if locationParam exists
  const [locationName, setLocationName] = useState("");
  useEffect(() => {
    if (locationParam) {
      fetchApi(`/locations/${locationParam}/`).then(data => setLocationName(data.name)).catch(() => {});
    }
  }, [locationParam]);

  const locationLabel = areaFilter || (locationName ? locationName : "Egypt");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold font-heading">
          {t('listings.title')}
          <span className="text-primary">{t('listings.titleHighlight')}</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          {t('listings.subtitle')}
        </p>
      </section>

      {/* Sticky Search + Filter Bar */}
      {sortParam ? null : (
        <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b py-4 shadow-sm">
          <div className="container flex items-center gap-4">
            <div className="relative flex-1">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors z-10" 
                onClick={handleSearch}
              />
              <Input
                placeholder={t('listings.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 h-12 rounded-full border-2 border-primary/10 focus-visible:border-primary transition-all bg-card/50"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full gap-2 h-12 px-6 border-2 border-primary/10 hover:bg-primary/5 hover:border-primary/30 transition-all">
                  <SlidersHorizontal className="h-5 w-5" />
                  <span className="hidden sm:inline font-semibold">{isAr ? "الفلتر" : "Filter"}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={isAr ? "left" : "right"} className="w-[350px] sm:w-[450px] overflow-y-auto p-0">
                <div className="p-6 space-y-8">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold">{t('listings.quickSearch')}</SheetTitle>
                  </SheetHeader>
                  
                  <div className="space-y-6">
                    {/* Price */}
                    <div className="space-y-3">
                      <Label className="text-base font-bold">{t('listings.minPrice')}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="10000"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                        />
                      </div>
                    </div>

                  {/* Location Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-bold">{isAr ? "المنطقة" : "Location"}</Label>
                    <Select value={areaFilter || "any"} onValueChange={(val) => setAreaFilter(val === "any" ? "" : val)}>
                      <SelectTrigger className="h-11">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <SelectValue placeholder={isAr ? "اختر المنطقة" : "Select Location"} />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{isAr ? "الكل" : "Any"}</SelectItem>
                        {locations.map((loc: any) => (
                          <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    {/* Beds/Rooms */}
                    <div className="space-y-3">
                      <Label className="text-base font-bold">{t('listings.housingType')}</Label>
                      <Select value={bedType} onValueChange={setBedType}>
                        <SelectTrigger className="h-11">
                          <div className="flex items-center gap-2">
                            <Bed className="h-4 w-4 text-primary" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">{t('listings.any')}</SelectItem>
                          <SelectItem value="apartment">{t('listings.fullApartment')}</SelectItem>
                          <SelectItem value="room">{t('listings.room')}</SelectItem>
                          <SelectItem value="bed">{t('listings.bed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gender Filter */}
                    <div className="space-y-3">
                      <Label className="text-base font-bold">{t('listings.occupants')}</Label>
                      <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                          <RadioGroupItem value="any" id="gender-any" />
                          <Label htmlFor="gender-any" className="flex-1 cursor-pointer font-medium">{t('listings.any')}</Label>
                        </div>
                        <div className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                          <RadioGroupItem value="male" id="gender-male" />
                          <Label htmlFor="gender-male" className="flex-1 cursor-pointer font-medium">{t('listings.males')}</Label>
                        </div>
                        <div className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                          <RadioGroupItem value="female" id="gender-female" />
                          <Label htmlFor="gender-female" className="flex-1 cursor-pointer font-medium">{t('listings.females')}</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-3">
                      <Label className="text-base font-bold">{t('landlord.amenities')}</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: "wifi", icon: Wifi, label: "Wi-Fi" },
                          { id: "ac", icon: Wind, label: "AC" },
                          { id: "appliances", icon: Refrigerator, label: t('listings.appliances') },
                          { id: "parking", icon: Car, label: t('property.parking') },
                          { id: "furnished", icon: Armchair, label: t('property.furnished') },
                          { id: "smart_tv", icon: Tv, label: t('property.smartTv') },
                          { id: "pet_friendly", icon: Dog, label: t('property.petFriendly') },
                          { id: "scenic_view", icon: Mountain, label: t('property.scenicView') },
                        ].map((a) => (
                          <label key={a.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
                            <Checkbox checked={amenities.includes(a.id)} onCheckedChange={() => toggleAmenity(a.id)} />
                            <a.icon className="h-5 w-5 text-primary" />
                            <span className="font-medium">{a.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full rounded-full gap-2 h-12 text-lg shadow-lg" onClick={handleSearch}>
                      <Search className="h-5 w-5" />
                      {t('listings.searchBtn')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      <section className="container pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{t('listings.availableTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('listings.foundResults', { count: displayProperties.length, location: locationLabel })}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="animate-spin h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-lg font-medium">{t('listings.loading')}</p>
          </div>
        ) : displayProperties.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bed className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('listings.noResults')}</p>
            <p className="text-sm">{t('listings.tryAdjust')}</p>
          </div>
        ) : (
          <>
        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProperties.map((property) => (
              <div 
                key={property.id} 
                className="border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/property/${property.id}`)}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={property.image} 
                    alt={property.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  {property.verified && (
                    <Badge className="absolute top-3 left-3 bg-card/90 text-foreground backdrop-blur-sm gap-1 text-xs">
                      <CheckCircle className="h-3 w-3 text-primary" /> {t('listings.verified')}
                    </Badge>
                  )}
                  <Badge className="absolute bottom-3 right-3 bg-primary text-primary-foreground text-xs font-semibold">
                    {(property.price || 0).toLocaleString()} {t('listings.perMonth')}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/property/reviews?property=${property.id}&name=${encodeURIComponent(property.title)}`);
                    }}
                    className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-xs font-semibold hover:bg-card transition-colors"
                  >
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {property.rating}
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">{property.title}</h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const savedInfo = Array.isArray(savedDorms) ? savedDorms.find((s: any) => s.dorm === property.id || s.dorm === property.dorm_id) : undefined;
                        toggleSaveMutation.mutate({ dormId: property.id || property.dorm_id, savedId: savedInfo?.id });
                      }}
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Heart className={`h-4 w-4 ${Array.isArray(savedDorms) && savedDorms.find((s: any) => s.dorm === property.id || s.dorm === property.dorm_id) ? 'fill-primary text-primary' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {property.location}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {property.beds} {t('listings.beds')}</span>
                    <span className="flex items-center gap-1">👥 {Math.max(0, property.capacity - property.current_occupants)} {t('listings.avail')}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {property.distance_km} {isAr ? "كم" : "KM"}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-full text-xs"
                      onClick={() => navigate(`/property/${property.id}`)}
                    >
                      {t('listings.details')}
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 rounded-full text-xs"
                      onClick={() => navigate(`/property/${property.id}`)}
                      disabled={property.capacity - property.current_occupants <= 0}
                    >
                      {property.capacity - property.current_occupants <= 0 ? t('listings.full') : t('listings.bookNow')}
                    </Button>
                    {property.has_approved_booking && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/review/dorm?property=${property.id}&name=${encodeURIComponent(property.title)}`);
                        }}
                      >
                        <Star className="h-3 w-3" />
                        {t('listings.rate')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Listings;
