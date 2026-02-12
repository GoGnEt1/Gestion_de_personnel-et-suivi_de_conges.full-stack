import { useTranslation } from "react-i18next";
import tusia from "../assets/logo_fsg-removebg-preview.png";

const HeaderOfficielTN = () => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between items-center mb-4">
      <img
        src={tusia}
        // src="../assets/logo_tunisie.jpg" ml-auto
        alt="logo_tunisie"
        className="h-30 w-40 border-none"
      />
      <div className="text-center max-w-72">
        <p className="font-semibold">{t("minisTuni")}</p>
        <span>******</span>

        <p className="font-semibold">{t("univerGa")}</p>
        <span>******</span>

        <p className="font-medium">{t("fsg")}</p>
      </div>
    </div>
  );
};

export default HeaderOfficielTN;
