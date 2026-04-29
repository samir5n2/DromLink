import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail } from "lucide-react";
import dormlinkLogo from "@/assets/dormlink-logo.jpeg";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={dormlinkLogo} alt="DormLink" className="h-8 w-8 rounded-full object-cover" />
              <span className="font-bold text-lg">DORMLINK</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("footer.description")}</p>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-3">{t("footer.company")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">{t("footer.aboutUs")}</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">{t("footer.contact")}</Link></li>
              <li><span className="cursor-default">{t("footer.careers")}</span></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-3">{t("footer.resources")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-default">{t("footer.blog")}</span></li>
              <li><span className="cursor-default">{t("footer.faq")}</span></li>
              <li><span className="cursor-default">{t("footer.support")}</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3">{t("footer.contactUs")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />{t("footer.address")}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" />{t("footer.phone")}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" />{t("footer.email")}</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <span>{t("footer.rights")}</span>
          <div className="flex gap-4">
            <a href="/privacy-policy" className="hover:text-foreground transition-colors">{t("footer.privacy")}</a>
            <span>{t("footer.terms")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
