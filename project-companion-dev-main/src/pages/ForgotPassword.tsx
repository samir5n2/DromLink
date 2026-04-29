import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Mail, MailCheck, Lock, RefreshCw, CheckCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authBg from "@/assets/auth-bg.jpg";

type Step = "email" | "check" | "reset" | "success";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const renderStep = () => {
    switch (step) {
      case "email":
        return (
          <>
            <h1 className="text-2xl font-bold mb-2">{t("auth.forgotPasswordTitle")}</h1>
            <p className="text-muted-foreground text-sm mb-8">{t("auth.forgotPasswordDesc")}</p>
            <div className="space-y-2 mb-6">
              <Label className="font-semibold text-sm">{t("auth.emailAddress")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t('auth.enterEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button className="w-full rounded-lg h-11" onClick={() => setStep("check")}>
              {t("auth.sendResetLink")}
            </Button>
            <div className="flex items-center justify-between mt-6 text-sm">
              <Link to="/sign-in" className="text-primary hover:underline flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> {t("auth.backToLogin")}
              </Link>
              <Link to="/contact" className="text-primary hover:underline">
                {t("auth.contactSupport")}
              </Link>
            </div>
          </>
        );

      case "check":
        return (
          <>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("auth.checkEmail")}</h1>
            <p className="text-muted-foreground text-sm mb-6">{t("auth.checkEmailDesc")}</p>
            <div className="bg-muted rounded-lg p-3 flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground">{t("auth.didntReceive")}</span>
              <button
                onClick={() => {}}
                className="text-sm text-primary font-semibold hover:underline"
              >
                {t("auth.resend")}
              </button>
            </div>
            <Link to="/sign-in" className="text-primary hover:underline text-sm flex items-center gap-1 justify-center">
              <ArrowLeft className="h-3 w-3" /> {t("auth.backToLogin")}
            </Link>
            {/* Auto-advance for demo */}
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setStep("reset")}>
              {t("auth.continueDemo")}
            </Button>
          </>
        );

      case "reset":
        return (
          <>
            <h1 className="text-2xl font-bold mb-2">{t("auth.setNewPassword")}</h1>
            <p className="text-muted-foreground text-sm mb-8">{t("auth.setNewPasswordDesc")}</p>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-semibold text-sm">{t("auth.newPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPw ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-sm">{t("auth.confirmNewPassword")}</Label>
                <div className="relative">
                  <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showConfirm ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full rounded-lg h-11" onClick={() => setStep("success")}>
                {t("auth.resetPassword")}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-6 text-sm">
              <Link to="/sign-in" className="text-primary hover:underline flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> {t("auth.backToLogin")}
              </Link>
              <Link to="/contact" className="text-primary hover:underline">
                {t("auth.contactSupport")}
              </Link>
            </div>
          </>
        );

      case "success":
        return (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("auth.resetSuccess")}</h1>
            <p className="text-muted-foreground text-sm mb-6">{t("auth.resetSuccessDesc")}</p>
            <Link to="/sign-in">
              <Button className="w-full rounded-lg h-11">{t("auth.goToLogin")}</Button>
            </Link>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t("auth.needHelp")}{" "}
              <Link to="/contact" className="text-primary hover:underline">{t("auth.contactSupport")}</Link>
            </p>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2 bg-background">
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-primary">DormLink</span>
          </Link>
          {renderStep()}
        </div>
        <div className="hidden md:block">
          <img src={authBg} alt="Students" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
