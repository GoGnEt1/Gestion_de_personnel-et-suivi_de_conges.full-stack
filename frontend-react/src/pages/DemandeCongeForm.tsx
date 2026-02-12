import React, { useState } from "react";
import axios from "axios";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";
import Alert from "../components/Alert";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const DemandeCongeForm: React.FC = () => {
  const [debut, setDebut] = useState("");
  const [motif, setMotif] = useState("");
  const [jours, setJours] = useState(0);
  const [loading, setLoading] = useState(false);
  const [typeDemande, setTypeDemande] = useState<
    "standard" | "exceptionnel" | "compensatoire"
  >("standard");

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const navigate = useNavigate();

  const { user } = useAuth();

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };
  const { t } = useTranslation();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // les champs debut et jours sont obligatoires
    if (!debut) {
      showAlert(t("error.requiredDebut"), "error");
      setLoading(false);
      return;
    }
    if (!jours || jours <= 0) {
      showAlert(t("error.requiredJour"), "error");
      setLoading(false);
      return;
    }
    try {
      const access = localStorage.getItem("access");
      if (!access) {
        showAlert("user non connecté", "error");
        return;
      }
      await axiosClient.post(
        "/conges/demande-conge/demande_form/",
        {
          debut_conge: debut,
          conge_demande: jours,
          motif,
          type_demande: typeDemande,
        },
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        },
      );
      showAlert(t("demandeConge.success"), "success");
      setLoading(false);
      // reset tous les champs
      setDebut("");
      setJours(0);
      setMotif("");
      setTypeDemande("standard");
      setTimeout(() => {
        if (user?.role === "admin") {
          navigate("/dashboard/admin/mes-demandes-conges");
        } else {
          navigate("/dashboard/user/mes-demandes-conges");
        }
      }, 1000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        if (typeof data === "object") {
          const msgs = Object.values(data).flat().join(" — ");
          showAlert(msgs, "error");
        } else {
          showAlert("Erreur de validation", "error");
        }
      }
    } finally {
      setLoading(false);
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
        <span> &gt; {t("demandeConge.title")}</span>
      </div>

      {/* {alert && <Alert message={alert.message} type={alert.type} />} */}
      <fieldset className="border border-gray-400 max-w-2xl bg-white p-6 rounded shadow">
        <legend className="px-2 font-semibold text-xl">
          {t("demandeConge.title")}
        </legend>

        {alert && <Alert message={alert.message} type={alert.type} />}

        <form action="" onSubmit={handleSubmit} className="space-y-4">
          <label className="font-medium">
            {t("demandeConge.type")} <span className="text-red-500">*</span>
          </label>

          <div className="flex justify-between mb-2 mt-1 text-[15px]">
            <label className="flex items-center">
              <input
                type="radio"
                name="type_conge"
                value="standard"
                checked={typeDemande === "standard"}
                onChange={() => setTypeDemande("standard")}
                className="mr-1.5 w-3 h-3"
              />
              {t("demandeConge.standard")}
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                value="exceptionnel"
                name="type_conge"
                checked={typeDemande === "exceptionnel"}
                onChange={() => setTypeDemande("exceptionnel")}
                className="mr-1.5 w-3 h-3"
              />
              {t("demandeConge.exceptionnel")}
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                value="compensatoire"
                name="type_conge"
                checked={typeDemande === "compensatoire"}
                onChange={() => setTypeDemande("compensatoire")}
                className="mr-1.5 w-3 h-3"
              />
              {t("demandeConge.compensatoire")}
            </label>
          </div>
          {/*  */}
          <label className="font-medium">
            {t("demandeConge.debut")} <span className="text-red-500">*</span>
          </label>
          <input
            placeholder={t("demandeConge.debut")}
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
            className="w-full h-full py-2 px-4 mb-3 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600"
          />
          <label className="font-medium">
            {t("demandeConge.jours")} <span className="text-red-500">*</span>
          </label>
          <input
            placeholder={t("demandeConge.jours")}
            type="number"
            min="0"
            value={jours}
            onChange={(e) => setJours(parseInt(e.target.value))}
            className="w-full h-full py-2 px-4 mb-3 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600"
          />
          <label className="font-medium">{t("demandeConge.motif")}</label>
          <textarea
            placeholder={t("demandeConge.reason")}
            value={motif}
            rows={4}
            onChange={(e) => setMotif(e.target.value)}
            className="w-full h-full py-2 px-4 mb-2 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600 resize-none"
          ></textarea>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 border cursor-pointer rounded-md transition duration-500 ease-out w-full hover:bg-blue-700  disabled:bg-blue-300 disabled:cursor-progress"
          >
            {t("demandeConge.submit")}
          </button>
        </form>
      </fieldset>
    </div>
  );
};

export default DemandeCongeForm;
