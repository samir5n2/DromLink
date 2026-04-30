import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck, Search, HeadphonesIcon, Target, Settings, Zap, Handshake, Lock, BadgeCheck, FileText } from "lucide-react";

const team = [
  { name: "Areej Mahmoud", role: "Backend Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Areej&topType=longHair" },
  { name: "Samir Nagy", role: "Backend Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samir&topType=shortFlat" },
  { name: "Mennatallah Magdy", role: "AI Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mennatallah&topType=hijab" },
  { name: "Keroles Adel", role: "Frontend Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Keroles&topType=shortCurly" },
  { name: "Micheal Maged", role: "AI Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Micheal&topType=shortFlat" },
  { name: "Abdelrahman adel", role: "Frontend Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abdelrahman&topType=shortFlat" },
  { name: "Zeyad Yasser", role: "Backend Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zeyad&topType=shortFlat" },
  { name: "Mohammed refaat", role: "Frontend Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed&topType=shortFlat" },
];

const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, userType } = useAuth();

  const studentFeatures = [
    { icon: GraduationCap, title: t("about.studentFocused"), desc: t("about.studentFocusedDesc") },
    { icon: ShieldCheck, title: t("about.verified"), desc: t("about.verifiedDesc") },
    { icon: Search, title: t("about.effortless"), desc: t("about.effortlessDesc") },
    { icon: HeadphonesIcon, title: t("about.dedicated"), desc: t("about.dedicatedDesc") },
  ];

  const ownerFeatures = [
    { icon: Target, title: t("about.targeted"), desc: t("about.targetedDesc") },
    { icon: Settings, title: t("about.streamlined"), desc: t("about.streamlinedDesc") },
    { icon: Zap, title: t("about.fillVacancies"), desc: t("about.fillVacanciesDesc") },
    { icon: Handshake, title: t("about.trusted"), desc: t("about.trustedDesc") },
  ];

  return (
    <div>
      {/* Mission */}
      <section className="py-16 lg:py-20 bg-primary/5">
        <div className="container text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{t("about.mission")}</h1>
          <p className="mt-6 text-muted-foreground leading-relaxed">{t("about.missionDesc")}</p>
        </div>
      </section>

      {/* Team */}
      <section className="container py-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-10">{t("about.team")}</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {team.map((member) => (
            <div key={member.name} className="flex flex-col items-center p-6 rounded-2xl border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-w-[180px]">
              <div className="h-24 w-24 rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center text-2xl font-bold text-primary mb-3 overflow-hidden relative">
                {member.image ? (
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="h-full w-full object-cover relative z-10" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <span className="absolute inset-0 flex items-center justify-center z-0">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <p className="font-semibold text-sm">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Students */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">{t("about.whyStudents")}</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {studentFeatures.map((f, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-xl bg-card border">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Owners */}
      <section className="container py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">{t("about.benefitsOwners")}</h2>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {ownerFeatures.map((f, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-xl bg-card border">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">{t("about.trust")}</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: Lock, label: t("about.secure") },
            { icon: BadgeCheck, label: t("about.allVerified") },
            { icon: FileText, label: t("about.transparent") },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 px-5 py-2.5 rounded-full border bg-card text-sm font-medium">
              <badge.icon className="h-4 w-4 text-primary" />
              {badge.label}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary/30 py-16 text-center">
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
            {!isLoggedIn ? t('landing.readyTitle') : 
             userType === 'landlord' ? t('landing.readyTitleLandlord') : 
             t('landing.readyTitleStudent')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {!isLoggedIn ? t('landing.readySub') : 
             userType === 'landlord' ? t('landing.readySubLandlord') : 
             t('landing.readySubStudent')}
          </p>
          <Button 
            size="lg" 
            className="rounded-full px-8"
            onClick={() => {
              if (userType === 'landlord') navigate('/profile?add=true');
              else navigate('/listings');
            }}
          >
            {!isLoggedIn ? t('landing.listPropertyBtn') : 
             userType === 'landlord' ? t('landing.listPropertyBtn') : 
             t('landing.browseListingsBtn')}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default About;
