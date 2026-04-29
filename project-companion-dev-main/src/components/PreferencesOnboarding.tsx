import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Wifi, Utensils, Shirt, AirVent, Car, Armchair, Tv, Dog, Mountain } from "lucide-react";

const preferenceItems = [
  { id: "needs_wifi", labelKey: "property.wifi", icon: Wifi },
  { id: "needs_kitchen", labelKey: "property.kitchen", icon: Utensils },
  { id: "needs_laundry", labelKey: "property.laundry", icon: Shirt },
  { id: "needs_ac", labelKey: "property.ac", icon: AirVent },
  { id: "needs_parking", labelKey: "property.parking", icon: Car },
  { id: "needs_furnished", labelKey: "property.furnished", icon: Armchair },
  { id: "needs_smart_tv", labelKey: "property.smartTv", icon: Tv },
  { id: "needs_pet_friendly", labelKey: "property.petFriendly", icon: Dog },
  { id: "needs_scenic_view", labelKey: "property.scenicView", icon: Mountain },
];

export const PreferencesOnboarding = () => {
  const { t, i18n } = useTranslation();
  const { isLoggedIn, userType } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    needs_wifi: false,
    needs_kitchen: false,
    needs_laundry: false,
    needs_ac: false,
    needs_parking: false,
    needs_furnished: false,
    needs_smart_tv: false,
    needs_pet_friendly: false,
    needs_scenic_view: false,
  });
  const [budget, setBudget] = useState(1500);

  useEffect(() => {
    const isDismissed = localStorage.getItem('preferences_onboarding_dismissed');
    if (isDismissed === 'true') return;

    if (isLoggedIn && userType === 'student') {
      fetchApi('/me/')
        .then(data => {
          if (data && !data.preferences_set) {
            setOpen(true);
          }
        })
        .catch(err => console.error("Failed to check preferences:", err));
    }
  }, [isLoggedIn, userType]);

  const handleToggle = (id: string) => {
    setPreferences(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetchApi('/update-student-profile/', {
        method: 'PATCH',
        body: JSON.stringify({
          ...preferences,
          budget_max_egp: budget,
          preferences_set: true
        })
      });
      localStorage.setItem('preferences_onboarding_dismissed', 'true');
      toast.success(i18n.language === 'ar' ? "تم حفظ تفضيلاتك بنجاح!" : "Preferences saved successfully!");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await fetchApi('/update-student-profile/', {
        method: 'PATCH',
        body: JSON.stringify({
          preferences_set: true
        })
      });
      localStorage.setItem('preferences_onboarding_dismissed', 'true');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to skip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-1">
                {i18n.language === 'ar' ? "أخبرنا عن تفضيلاتك" : "Tell us your preferences"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {i18n.language === 'ar' 
                  ? "ساعدنا في العثور على أفضل سكن يناسب احتياجاتك." 
                  : "Help us find the best dorm that fits your needs."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {preferenceItems.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  preferences[item.id] 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border hover:bg-muted"
                }`}
                onClick={() => handleToggle(item.id)}
              >
                <div className={`p-2 rounded-lg ${preferences[item.id] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <Label 
                  htmlFor={item.id} 
                  className="flex-1 text-xs font-medium cursor-pointer"
                >
                  {t(item.labelKey)}
                </Label>
                <Checkbox 
                  id={item.id} 
                  checked={preferences[item.id]} 
                  onCheckedChange={() => handleToggle(item.id)}
                  className="rounded-full h-5 w-5"
                />
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">{i18n.language === 'ar' ? "الميزانية الشهرية القصوى (ج.م)" : "Max Monthly Budget (EGP)"}</Label>
              <span className="text-primary font-bold">{budget}</span>
            </div>
            <Input 
              type="range" 
              min="900" 
              max="2500" 
              step="100" 
              value={budget} 
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>900</span>
              <span>1700</span>
              <span>2500</span>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-3 pt-4">
            <Button variant="ghost" onClick={handleSkip} disabled={loading} className="text-muted-foreground hover:text-foreground">
              {i18n.language === 'ar' ? "تخطي الآن" : "Skip for now"}
            </Button>
            <Button onClick={handleSave} disabled={loading} className="px-8 rounded-full shadow-lg shadow-primary/20">
              {loading ? "..." : (i18n.language === 'ar' ? "حفظ التفضيلات" : "Save Preferences")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
