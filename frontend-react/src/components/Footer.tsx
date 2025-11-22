import React from "react";
import { useTranslation } from "react-i18next";
import tunisia from "../assets/logo_fsg-removebg-preview.png";

const Footer: React.FC<{ now?: string }> = ({ now }) => {
  const { t } = useTranslation();
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={tunisia}
            alt="Drapeau de la Tunisie"
            className="w-10 h-10 text-white bg-white object-contain rounded-sm"
          />
          <div>
            <div className="font-semibold">{t("footer.fsg")}</div>
            <div className="text-sm text-slate-300">
              {t("footer.description")}
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-300">
          <div>{t("footer.phone")} +216 7X XXX XXX</div>
          <div>{t("footer.adresse")} </div>
        </div>

        <div className="text-sm text-slate-300 text-right">
          <div className="text-white/90">
            {t("footer.dateLocal")} {now}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            © {new Date().getFullYear()} {t("footer.copyright")}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
