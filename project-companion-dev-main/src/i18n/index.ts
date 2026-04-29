import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations";

const savedLang = localStorage.getItem("dormlink-lang") || "en";

// Apply RTL/LTR direction on initial load
document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
document.documentElement.lang = savedLang;

i18n.use(initReactI18next).init({
  resources: translations,
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
