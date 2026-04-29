import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CreateAccount = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [regType, setRegType] = useState<"student" | "landlord">("student");
  const [gender, setGender] = useState("male");
  const [idFile, setIdFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('user_type', regType);
      formData.append('name', `${firstName} ${lastName}`.trim());
      formData.append('email', email);
      formData.append('phone_number', phone);
      formData.append('gender', gender);
      if (idFile) formData.append('id_card_image', idFile);

      const res = await fetchApi('/register/', {
        method: 'POST',
        body: formData
      });
      
      if (res.access) {
        // Auto-login if tokens are returned
        login(res.access, res.refresh, res.user_type);
        toast({ title: "Success", description: "Account created and logged in!" });
        navigate("/");
      } else {
        toast({ title: "Success", description: "Account created successfully! Please sign in." });
        navigate("/sign-in");
      }
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-12">
      <div className="w-full max-w-2xl bg-background rounded-2xl shadow-xl p-8 md:p-12">
        <h1 className="text-2xl font-bold text-center mb-1">{t("auth.createAccountTitle")}</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          {t("auth.createAccountDesc")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type of Registration */}
          <div className="text-center space-y-3">
            <Label className="font-semibold">{t("auth.regType")}</Label>
            <div className="flex justify-center gap-0 border rounded-full w-fit mx-auto overflow-hidden">
              <button
                type="button"
                onClick={() => setRegType("student")}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  regType === "student"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("auth.student")}
              </button>
              <button
                type="button"
                onClick={() => setRegType("landlord")}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  regType === "landlord"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("auth.landlord")}
              </button>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-semibold text-sm">{t("auth.firstName")}</Label>
              <Input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t("auth.enterFirstName")} />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-sm">{t("auth.lastName")}</Label>
              <Input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t("auth.enterLastName")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-sm">{t('auth.username')}</Label>
            <Input required value={username} onChange={e => setUsername(e.target.value)} placeholder={t('auth.enterUsername')} />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">{t('auth.emailLabel')}</Label>
            <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth.enterEmail')} />
          </div>



          {/* Phone */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">{t("auth.phone")}</Label>
            <Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 XXX XXX XXXX" />
          </div>

          {/* Country & State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-semibold text-sm">{t("auth.country")}</Label>
              <Select defaultValue="egypt">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="egypt">Egypt</SelectItem>
                  <SelectItem value="saudi">Saudi Arabia</SelectItem>
                  <SelectItem value="uae">UAE</SelectItem>
                  <SelectItem value="jordan">Jordan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-sm">{t("auth.governorate")}</Label>
              <Input placeholder={t("auth.searchGovernorate")} />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">{t("auth.gender")}</Label>
            <RadioGroup value={gender} onValueChange={setGender} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="cursor-pointer">{t("auth.male")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="cursor-pointer">{t("auth.female")}</Label>
              </div>
            </RadioGroup>
          </div>

          {/* National ID Upload */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">{t("auth.nationalId")}</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors text-muted-foreground"
            >
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-sm">
                {idFile ? idFile.name : t("auth.uploadId")}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">{t("auth.password")}</Label>
            <Input required value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder={t("auth.enterPassword")} />
            <div className="text-[10px] text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-1 mt-2 p-2 bg-muted/50 rounded-lg">
              <div className={cn("flex items-center gap-1", password.length >= 8 ? "text-green-600" : "text-muted-foreground")}>
                <div className={cn("h-1 w-1 rounded-full", password.length >= 8 ? "bg-green-600" : "bg-muted-foreground")} /> {t('auth.charCount')}
              </div>
              <div className={cn("flex items-center gap-1", /[A-Z]/.test(password) ? "text-green-600" : "text-muted-foreground")}>
                <div className={cn("h-1 w-1 rounded-full", /[A-Z]/.test(password) ? "bg-green-600" : "bg-muted-foreground")} /> {t('auth.upperCase')}
              </div>
              <div className={cn("flex items-center gap-1", /\d/.test(password) ? "text-green-600" : "text-muted-foreground")}>
                <div className={cn("h-1 w-1 rounded-full", /\d/.test(password) ? "bg-green-600" : "bg-muted-foreground")} /> {t('auth.aNumber')}
              </div>
              <div className={cn("flex items-center gap-1", /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : "text-muted-foreground")}>
                <div className={cn("h-1 w-1 rounded-full", /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-green-600" : "bg-muted-foreground")} /> {t('auth.specialChar')}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-sm">{t("auth.confirmPassword")}</Label>
            <Input required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder={t("auth.confirmPasswordPlaceholder")} />
          </div>

          {/* Terms */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              {t("auth.agreeTerms")}{" "}
              <a href="/privacy-policy" className="text-primary hover:underline">{t("auth.privacy")}</a>
            </Label>
          </div>

          <Button type="submit" className="w-full rounded-lg h-11" disabled={!agreed || loading}>
            {loading ? t('auth.creating') : t('auth.createAccountBtn')}
          </Button>
        </form>

        <p className="text-center text-sm mt-4 text-muted-foreground">
          {t("auth.haveAccount")}{" "}
          <Link to="/sign-in" className="text-primary hover:underline font-medium">
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CreateAccount;
