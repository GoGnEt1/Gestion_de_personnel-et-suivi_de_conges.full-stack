import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { Conge } from "../api/conge_api";
import { useNavigate, Link } from "react-router-dom";
import AlerteMessage from "../components/AlerteMessage";
import axios from "axios";
import { API_URL } from "../api/http";

const ModifierConge: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [erreur, setErreur] = useState("");
  const [success, setSuccess] = useState("");
  const annee = new Date().getFullYear();

  const [cin, setCin] = useState("");
  const [nomPrenom, setNomPrenom] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Conge>();

  const clearMessage = () => {
    setErreur("");
    setSuccess("");
  };

  const access = localStorage.getItem("access");

  // auto-remplissage
  const fetchPersonnel = async (matricule: string) => {
    if (!matricule || !access) return;

    try {
      const res = await fetch(
        `${API_URL}/conges/personnel_by_matricule/?matricule=${matricule}`,
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setCin(data.cin);
        setNomPrenom(data.nom_prenoms);
      } else {
        setCin("");
        setNomPrenom("");
      }
    } catch {
      setCin("");
      setNomPrenom("");
    }
  };
  const onSubmit = async (data: Conge) => {
    // const access = localStorage.getItem("access");
    if (!access) {
      navigate("/login");
      return;
    }
    // matricule obligatoire
    if (!data.matricule) {
      setErreur("Matricule obligatoire");
      return;
    }
    clearMessage();
    try {
      const res = await fetch(`${API_URL}/conges/modifier_conges/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify(data),
      });

      const response = await res.json();
      if (!res.ok) {
        setErreur(
          response.conge_total ||
            response.error ||
            t("erreur de modfication de conge")
        );
        return;
      }
      setSuccess(response.message);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const backendMessage =
            err.response.data.detail ||
            err.response.data.message ||
            "Une erreur est survenue. Réessaye.";
          setErreur(backendMessage);
        } else {
          setErreur("Impossible de contacter le serveur");
        }
      } else {
        setErreur("Problème de connexion.");
      }
    }
  };

  return (
    <section className="flex min-h-full justify-center items-center bg-gray-50">
      <div className="max-w-sm sm:max-w-2xl lg:max-w-4xl w-full mx-auto text-sm bg-white shadow p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-center">
          {t("modifierConge.title")}
        </h2>

        <AlerteMessage
          clearMessage={clearMessage}
          successMessage={success}
          errorMessage={erreur}
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
            {/* col 1 */}
            <div className="grid grid-cols-[auto,1fr] items-center gap-x-4 gap-y-4">
              <label className="font-medium">{t("matricule")}</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded  border border-gray-400 outline-none hover:border-blue-300"
                title={t("matricule")}
                {...register("matricule", { required: true })}
                onBlur={(e) => fetchPersonnel(e.target.value)}
              />
              {errors.conge_restant_annee_n_2 && (
                <p className="text-red-500">{erreur}</p>
              )}
              {/* recuper nomPrenom et cin */}
              <label className="font-medium">{t("personnel.cin")}</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded border border-gray-500 outline-none"
                title={t("modifierConge.cin")}
                value={cin}
                readOnly
              />

              <label className="font-medium">{t("names")}</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded border border-gray-500 outline-none"
                title={t("modifierConge.nomPrenom")}
                value={nomPrenom}
                readOnly
              />

              <label className="font-medium">{t("conge_exceptionnel")}</label>
              <input
                type="number"
                // min="0"
                className="w-full px-3 py-2 rounded border border-gray-500 outline-none hover:border-blue-300"
                title={t("conge_exceptionnel")}
                {...register("conge_exceptionnel", {
                  min: 0,
                })}
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.conge_exceptionnel && (
                <p className="text-red-500">{t("modifierConge.erreur")}</p>
              )}
            </div>

            {/* col 2 */}
            <div className="grid grid-cols-[auto,1fr] items-center gap-x-4 gap-y-4">
              <label className="font-medium">
                {t("modifierConge.reste")} {annee - 2}
              </label>
              <input
                type="number"
                step="0.25"
                // min="0"
                className="w-full px-3 py-2 rounded border border-gray-500 outline-none hover:border-blue-300"
                title={t("modifierConge.reste")}
                {...register("conge_restant_annee_n_2", {
                  valueAsNumber: true,
                  min: 0,
                })}
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.conge_restant_annee_n_2 && (
                <p className="text-red-500">{t("modifierConge.erreur")}</p>
              )}

              <label className="font-medium">
                {t("modifierConge.reste")} {annee - 1}
              </label>
              <input
                type="number"
                step="0.25"
                // min="0"
                className="w-full px-3 py-2 rounded border border-gray-500 outline-none hover:border-blue-300"
                title={t("modifierConge.reste")}
                {...register("conge_restant_annee_n_1", {
                  valueAsNumber: true,
                  min: 0,
                })}
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.conge_restant_annee_n_1 && (
                <p className="text-red-500">{t("modifierConge.erreur")}</p>
              )}

              <label className="font-medium">
                {t("modifierConge.reste")} {annee}
              </label>
              <input
                type="number"
                step="0.25"
                // min="0"
                className="w-full px-3 py-2 rounded border border-gray-500 outline-none hover:border-blue-300"
                title={t("modifierConge.reste")}
                {...register("conge_restant_annee_courante", {
                  valueAsNumber: true,
                  min: 0,
                })}
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.conge_restant_annee_courante && (
                <p className="text-red-500">{t("modifierConge.erreur")}</p>
              )}

              <label className="font-medium">{t("conge_compasatoire")}</label>
              <input
                type="number"
                step="0.25"
                // min="0"
                className="w-full px-3 py-2 rounded border border-gray-500 outline-none hover:border-blue-300"
                title={t("conge_compasatoire")}
                {...register("conge_compensatoire", {
                  valueAsNumber: true,
                  min: 0,
                })}
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.conge_compensatoire && (
                <p className="text-red-500">{t("modifierConge.erreur")}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row-reverse justify-between gap-3 mt-6">
            <button
              type="submit"
              className="w-full px-3 py-2 rounded-xl bg-green-500 text-white hover:opacity-90 transition-all duration-500"
            >
              {t("modifierConge.submit")}
            </button>
            <button
              onClick={() => navigate("/dashboard/admin")}
              type="button"
              className="w-full px-3 py-2 rounded-xl bg-red-500 text-white hover:opacity-90 transition-all duration-500"
            >
              {t("modifierConge.cancel")}
            </button>
          </div>
        </form>

        <div className="border-t-1 border-gray-300 mt-8">
          <p className="mt-3">
            {t("modifierConge.importer")}
            <Link
              to="/dashboard/admin/import-conges"
              className="ml-5 text-blue-600 hover:underline hover:text-blue-700 transition-all"
            >
              {t("modifierConge.importer_link")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ModifierConge;
