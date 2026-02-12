import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";
import Alert from "../components/Alert";

const DemandeAttestationForm = () => {
  const [nb_cps, setNcps] = useState(1);
  const [langues, setLangues] = useState<"fr" | "ar" | "en">("ar");

  const { t } = useTranslation();

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nb_cps || !langues) {
      showAlert(t("demande.requiredFields"), "error");
      return;
    }
    await axiosClient.post("/demandes/demande_form/", {
      type_demande: "attestation",
      nombre_copies: nb_cps,
      langue: langues,
    });
    showAlert(t("demande.success"), "success");
    setLangues("ar");
    setNcps(1);
  };

  return (
    <div className="bg-white rounded-xl shadow sm:p-3">
      <div className="mb-4 text-sm text-gray-500 border-b-4 border-gray-200 py-2 px-4 z-50">
        <button
          onClick={() => window.history.back()}
          type="button"
          className="cursor-pointer hover:underline"
        >
          {t("personnel.acceuil")}
        </button>{" "}
        <span> &gt; {t("demande.attestation")}</span>
      </div>

      <fieldset className="border border-gray-400 max-w-2xl bg-white p-6 rounded shadow">
        <legend className="px-2 font-semibold text-xl">
          {t("demande.attestation")}
        </legend>
        {alert && <Alert message={alert.message} type={alert.type} />}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 text-gray-700 flex flex-col">
            {/* un select de langues en-fr-ar (defaut ar) */}
            <label className="font-medium">
              {t("demande.langue")} <span className="text-red-500">*</span>
            </label>
            <select
              value={langues}
              aria-label={t("demande.langue")}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none"
              onChange={(e) => setLangues(e.target.value as "fr" | "ar" | "en")}
            >
              <option value="ar" selected>
                {t("ar")}
              </option>
              <option value="fr">{t("fr")}</option>
              <option value="en">{t("en")}</option>
            </select>

            {/* nbre de copies (entier positif min 1) */}
            <label className="font-medium">
              {t("demande.exemplaire")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              aria-label={t("demande.exemplaire")}
              min={1}
              max={4}
              value={nb_cps}
              onChange={(e) => setNcps(parseInt(e.target.value))}
              className="w-full h-full py-2 px-4 mb-3 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600"
            />

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                {t("demande.save")}
              </button>
            </div>
          </div>
        </form>
      </fieldset>
    </div>
  );
};

export default DemandeAttestationForm;
