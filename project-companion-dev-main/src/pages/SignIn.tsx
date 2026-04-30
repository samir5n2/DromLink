import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Lock, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { fetchApi, API_BASE_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import authBg from "@/assets/auth-bg.jpg";

const SignIn = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/token/`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) throw new Error('Invalid credentials');
      const data = await response.json();
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      // Fetch user profile type
      const meData = await fetchApi('/me/');
      login(meData.type || "student", username, meData.is_admin, meData.account_status);
      
      if (meData.is_admin) {
        navigate("/admin/users");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2 bg-background">
        {/* Left – Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-primary">DormLink</span>
          </Link>

          <h1 className="text-2xl font-bold mb-1">{t("auth.signInTitle")}</h1>
          <p className="text-muted-foreground text-sm mb-8">{t("auth.signInDesc")}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="font-semibold text-sm">{t('auth.username')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('auth.enterUsername')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-sm">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={t("auth.enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full rounded-lg h-11" disabled={loading}>
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <p className="text-center mt-4">
            <Link to="/create-account" className="text-sm text-primary hover:underline">
              {t("auth.createAccount")}
            </Link>
          </p>

          <p className="text-xs text-muted-foreground mt-6">
            {t("auth.agreeTo")}{" "}
            <a href="/privacy-policy" className="underline">{t("auth.privacy")}</a>{" "}
            {t("auth.and")}{" "}
            <a href="#" className="underline">{t("auth.terms")}</a>.
          </p>
        </div>

        {/* Right – Image */}
        <div className="hidden md:block relative">
          <img src={authBg} alt="Students" className="w-full h-full object-cover" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-background/20 backdrop-blur-md rounded-xl p-4 text-white">
              <p className="text-sm italic">
                {t('auth.authQuote')}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  AS
                </div>
                <span className="text-xs">— {t('auth.quoteAuthor')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
