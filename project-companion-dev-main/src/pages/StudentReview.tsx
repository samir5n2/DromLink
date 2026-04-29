import { useState } from "react";
import { Star, UserSearch, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearchParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

const ratingLabels = ["", "Terrible", "Bad", "Okay", "Good", "Excellent"];

const improvementTags = [
  "Cleanliness", "Noise", "Preserving dorms", "Rent commitment", "Disrespectful", "Dishonest"
];

const StudentReview = () => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [searchParams] = useSearchParams();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };
  const submitMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi('/student-ratings/', {
        method: 'POST',
        body: JSON.stringify({
          student: searchParams.get("student"),
          rating: rating,
          comment: comment,
          tags: selectedTags.join(', '),
          is_anonymous: anonymous
        })
      });
    },
    onSuccess: () => {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      setRating(0);
      setComment("");
      setSelectedTags([]);
      setAnonymous(false);
      setTimeout(() => window.history.back(), 1500);
    },
    onError: (err: any) => {
      toast({ title: "Failed to submit review", description: err.message || "An error occurred", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
        <h1 className="text-2xl font-bold text-center">Student Review</h1>

        {/* Rating Card */}
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserSearch className="h-6 w-6 text-primary" />
          </div>
          <p className="font-semibold">Student review</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onMouseEnter={() => setHoveredRating(i)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(i)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    i <= (hoveredRating || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
          {(hoveredRating || rating) > 0 && (
            <p className="text-sm text-muted-foreground">
              {ratingLabels[hoveredRating || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label className="font-semibold">Tell us a little more</Label>
          <div className="relative">
            <Textarea
              placeholder="Share more about your stay..."
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              className="min-h-[120px] resize-none"
            />
            <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {comment.length}/500
            </span>
          </div>
        </div>

        {/* Improvement Tags */}
        <div className="space-y-3">
          <Label className="font-semibold">What could've been better?</Label>
          <div className="flex flex-wrap gap-2">
            {improvementTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary/50"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="anonymous-student"
            checked={anonymous}
            onCheckedChange={(v) => setAnonymous(v === true)}
          />
          <Label htmlFor="anonymous-student" className="cursor-pointer text-sm">
            Post anonymously
          </Label>
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="w-full h-12 text-base gap-2">
          {submitMutation.isPending ? "Sending..." : "Send Review"} <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StudentReview;
