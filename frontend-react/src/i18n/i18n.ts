import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import frjson from "./fr.json";
import arjson from "./ar.json";

i18n.use(initReactI18next).init({
  lng: "fr", // default language
  fallbackLng: "fr",
  resources: {
    fr: { translation: frjson },
    ar: { translation: arjson },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
