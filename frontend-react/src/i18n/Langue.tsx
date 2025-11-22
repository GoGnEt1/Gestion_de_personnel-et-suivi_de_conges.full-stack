import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const Langue: React.FC = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || "fr");

  const handleLangSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const langSelected = e.target.value; //as "fr" | "ar"
    setLang(langSelected);
    i18n.changeLanguage(langSelected);
    if (i18n.language === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  };

  // return { lang, handleLangSwitch };

  return (
    // on va utiliser un petit bouton select pour choisir la langue
    <select
      aria-label="Select Language"
      onChange={handleLangSwitch}
      value={lang}
      className="p-2 rounded outline-none bg-white"
    >
      <option value="fr">FR</option>
      <option value="ar">AR</option>
    </select>
  );
};

export default Langue;
