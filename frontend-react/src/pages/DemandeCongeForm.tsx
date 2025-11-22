import React, { useState } from "react";
import axios from "axios";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import Alert from "../components/Alert";

const DemandeCongeForm: React.FC = () => {
  const [debut, setDebut] = useState("");
  const [motif, setMotif] = useState("");
  const [jours, setJours] = useState(0);
  const [loading, setLoading] = useState(false);

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
        },
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );
      showAlert(t("demandeConge.success"), "success");
      setLoading(false);
      // reset tous les champs
      setDebut("");
      setJours(0);
      setMotif("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          showAlert(err?.response?.data?.detail || t("error.unkown"), "error");
        } else {
          showAlert(err.message, "error");
        }
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-4 fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-md w-full bg-white rounded p-3 shadow"
      >
        {alert && <Alert message={alert.message} type={alert.type} />}

        <div className="w-full h-full">
          <div className="flex justify-between">
            <h2 className="text-xl sm:text-2xl mb-7 lg:mb-10 text-center font-semibold">
              {t("demandeConge.title")}
            </h2>
            <FaTimes
              onClick={() => window.history.back()}
              className="lg:text-xl sm:text-lg cursor-pointer hover:text-red-400"
              title={t("close")}
            />
          </div>
          <form action="" onSubmit={handleSubmit} className="">
            <label htmlFor="">{t("demandeConge.debut")}</label>
            <input
              placeholder={t("demandeConge.debut")}
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              className="w-full h-full py-2 px-4 mb-3 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600"
            />
            <label htmlFor="">{t("demandeConge.jours")}</label>
            <input
              placeholder={t("demandeConge.jours")}
              type="number"
              min="0"
              value={jours}
              onChange={(e) => setJours(parseInt(e.target.value))}
              className="w-full h-full py-2 px-4 mb-3 mt-1 border border-[#717171] outline-none text-lg rounded focus:border-blue-600"
            />
            <label htmlFor="">{t("demandeConge.motif")}</label>
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
              className="bg-blue-600 text-white py-2 border cursor-pointer rounded-md transition duration-500 ease-out w-full hover:bg-transparent hover:text-blue-600 hover:border-blue-600 disabled:bg-gray-300 disabled:cursor-progress"
            >
              {loading ? t("loading") : t("demandeConge.submit")}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default DemandeCongeForm;
