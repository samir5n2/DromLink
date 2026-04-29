import { useSearchParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, ThumbsUp, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface Review {
  id: number;
  author: string;
  anonymous: boolean;
  rating: number;
  comment: string;
  tags: string[];
  date: string;
  helpful: number;
}

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

const PropertyReviews = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const propertyId = searchParams.get("property") || "1";
  const propertyName = searchParams.get("name") || "Property";
  
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['ratings', propertyId],
    queryFn: async () => {
      const response = await fetchApi(`/ratings/?dorm=${propertyId}`);
      const data = Array.isArray(response) ? response : (response.results || []);
      return data.map((r: any, index: number) => ({
        id: r.id || index,
        author: r.student_details?.name || `Student #${r.student}`,
        anonymous: r.is_anonymous || false,
        rating: r.final_rating,
        comment: r.comment || `Rating for dorm quality: ${r.dorm_rating} / 5. Landlord rating: ${r.landlord_rating} / 5.`,
        tags: r.dorm_tags ? r.dorm_tags.split(',').map((t: string) => t.trim()) : [],
        date: new Date().toLocaleDateString(), // We don't have created_at on Rating model right now
        helpful: 0
      }));
    },
    enabled: !!propertyId
  });

  const { data: property } = useQuery({
    queryKey: ['dorm', propertyId],
    queryFn: async () => await fetchApi(`/dorms/${propertyId}/`),
    enabled: !!propertyId
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s: number, r: Review) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{propertyName}</h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? `${reviews.length} تقييم` : `${reviews.length} reviews`}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="border rounded-xl p-6 bg-card flex flex-col sm:flex-row gap-6">
          <div className="text-center sm:min-w-[140px]">
            <p className="text-5xl font-bold text-primary">{avgRating}</p>
            <div className="flex justify-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i <= Math.round(Number(avgRating)) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? `من ${reviews.length} تقييم` : `from ${reviews.length} reviews`}
            </p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingCounts.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-right text-muted-foreground">{star}★</span>
                <Progress value={pct} className="flex-1 h-2" />
                <span className="w-6 text-muted-foreground text-xs">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review CTA */}
        {property?.has_approved_booking && (
          <Button
            className="w-full rounded-full gap-2"
            onClick={() => navigate(`/review/dorm?property=${propertyId}&name=${encodeURIComponent(propertyName)}`)}
          >
            <Star className="h-4 w-4" />
            {isAr ? "اكتب تقييمك" : "Write a Review"}
          </Button>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="animate-spin h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-sm font-medium">{isAr ? "جاري التحميل..." : "Loading reviews..."}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
            <p>{isAr ? "لا توجد تقييمات بعد." : "No reviews yet."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: Review) => (
              <div key={review.id} className="border rounded-xl p-5 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      {review.anonymous ? (
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {review.anonymous ? (isAr ? "مجهول" : "Anonymous") : review.author}
                      </p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm leading-relaxed">{review.comment}</p>

                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {review.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {isAr ? `مفيد (${review.helpful})` : `Helpful (${review.helpful})`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyReviews;
