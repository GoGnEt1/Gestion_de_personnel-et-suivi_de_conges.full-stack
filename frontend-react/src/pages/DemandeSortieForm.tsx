import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";
// import KeyboardArrowRightIcon from "@mui/icons-material/ArrowForwardIos";
import Alert from "../components/Alert";
import { formatTime } from "../utils/date";

const DemandeSortieForm = () => {
  const [form, setForm] = useState({
    date_sortie: "",
    heure_sortie: "",
    heure_retour: "",
    motif: "",
  });

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // toute les champs sont obligatoires
    if (
      !form.date_sortie ||
      !form.heure_sortie ||
      !form.heure_retour ||
      !form.motif
    ) {
      showAlert(t("demande.requiredFields"), "error");
      return;
    }

    //  valider les champs text heure_sortie et heure_retour comme time format HH:MM et date_sortie comme date format YYYY-MM-DD
    if (!dateRegex.test(form.date_sortie)) {
      showAlert(t("invalidDate"), "error");
      return;
    }
    if (
      !timeRegex.test(form.heure_sortie) ||
      !timeRegex.test(form.heure_retour)
    ) {
      showAlert(t("demande.invalidTime"), "error");
      return;
    }

    //  heure_sortie doit etre inferieur a heure_retour
    if (form.heure_sortie > form.heure_retour) {
      showAlert(t("demande.invalidTimeRange"), "error");
      return;
    }

    // date_sortie doit etre superieur ou egale a la date actuelle
    if (
      new Date(form.date_sortie).toISOString().split("T")[0] <
      new Date().toISOString().split("T")[0]
    ) {
      showAlert(t("invalidDateRange"), "error");
      return;
    }

    // heure_sortie doit etre superieur ou egale a l'heure actuelle
    if (
      formatTime(form.heure_sortie) <
      formatTime(new Date().toISOString().split("T")[1])
    ) {
      showAlert(t("demande.invalidTimeRange1"), "error");
      return;
    }

    try {
      await axiosClient.post("/demandes/demande_form/", {
        ...form,
        type_demande: "sortie",
      });
      showAlert(t("demande.success"), "success");
      setForm({
        date_sortie: "",
        heure_sortie: "",
        heure_retour: "",
        motif: "",
      });
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow sm:px-3">
      <div className="mb-4 text-sm text-gray-500 border-b-4 border-gray-200 py-2 px-4 z-50">
        <button
          onClick={() => window.history.back()}
          type="button"
          className="cursor-pointer hover:underline"
        >
          {t("personnel.acceuil")}
        </button>{" "}
        <span> &gt; {t("demande.sortie")}</span>
      </div>

      <fieldset className="border border-gray-400 max-w-2xl bg-white p-6 rounded shadow">
        <legend className="px-2 font-semibold text-xl">
          {t("demande.sortie")}
        </legend>
        {alert && <Alert message={alert.message} type={alert.type} />}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 text-gray-700">
            <label className="font-medium">
              {t("demande.sortie")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="date_sortie"
              value={form.date_sortie}
              onChange={handleChange}
              className="w-full h-full py-2 px-4 mb-3 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600"
              placeholder="2026-01-22"
              pattern="\d{4}-\d{2}-\d{2}"
            />

            <label className="font-medium">
              {t("demande.heureSortie")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="heure_sortie"
              value={form.heure_sortie}
              onChange={handleChange}
              placeholder="08:00"
              className="w-full h-full py-2 px-4 mb-3 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600"
            />

            <label className="font-medium">
              {t("demande.heureRetour")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="heure_retour"
              value={form.heure_retour}
              onChange={handleChange}
              placeholder="14:00"
              className="w-full h-full py-2 px-4 mb-3 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600"
            />

            <label className="font-medium">
              {t("demande.motif")} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="motif"
              value={form.motif}
              onChange={handleChange}
              placeholder={t("demande.motif")}
              className="w-full h-full py-2 px-4 mb-2 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600 resize-none"
              rows={4}
            />

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex justify-end"
            >
              {t("demande.save")}
            </button>
          </div>
        </form>
      </fieldset>
    </div>
  );
};

export default DemandeSortieForm;
