import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { Conge } from "../api/conge_api";
import { useNavigate, Link } from "react-router-dom";
import AlerteMessage from "../components/AlerteMessage";
import axios from "axios";

const ModifierConge: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [erreur, setErreur] = useState("");
  const [success, setSuccess] = useState("");
  const annee = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Conge>();

  const clearMessage = () => {
    setErreur("");
    setSuccess("");
  };

  const onSubmit = async (data: Conge) => {
    const access = localStorage.getItem("access");
    if (!access) {
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/conges/conges/modifier_conges/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify(data),
        }
      );

      const response = await res.json();
      if (response.ok) {
        setSuccess(response.message);
        setTimeout(() => {
          navigate("/dashboard/admin/conges");
        }, 1500);
      }
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
      <div className="max-w-sm sm:max-w-lg lg:max-w-xl w-full mx-auto text-sm bg-white shadow p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-center">
          {t("modifierConge.title")}
        </h2>

        <AlerteMessage
          clearMessage={clearMessage}
          successMessage={success}
          errorMessage={erreur}
        />

        <form className="space-y-5 mt-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <label className="font-medium">{t("matricule")}</label>
            <input
              type="text"
              className="w-full sm:w-[305px] xl:w-[370px] sm:ml-22 px-3 py-2 rounded  border border-gray-400 outline-none hover:border-blue-300"
              title={t("matricule")}
              {...register("personnel.matricule", { required: true })}
            />
            {errors.conge_restant_annee_n_2 && (
              <p className="text-red-500">{t("modifierConge.erreur")}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <label className="font-medium">
              {t("modifierConge.reste")} {annee - 2}
            </label>
            <input
              type="number"
              className="w-full sm:w-[305px] xl:w-[370px] px-3 py-2 rounded border border-gray-500 outline-none hover:border-blue-300"
              title={t("modifierConge.reste")}
              {...register("conge_restant_annee_n_2", { min: 0 })}
            />
            {errors.conge_restant_annee_n_2 && (
              <p className="text-red-500">{t("modifierConge.erreur")}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <label className="font-medium">
              {t("modifierConge.reste")} {annee - 1}
            </label>
            <input
              type="number"
              className="w-full sm:w-[305px] xl:w-[370px] px-3 py-2 rounded border border-gray-500 outline-none hover:border-blue-300"
              title={t("modifierConge.reste")}
              {...register("conge_restant_annee_n_1", { min: 0 })}
            />
            {errors.conge_restant_annee_n_1 && (
              <p className="text-red-500">{t("modifierConge.erreur")}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <label className="font-medium">
              {t("modifierConge.reste")} {annee}
            </label>
            <input
              type="number"
              className="w-full sm:w-[305px] xl:w-[370px] px-3 py-2 rounded border border-gray-500 outline-none hover:border-blue-300"
              title={t("modifierConge.reste")}
              {...register("conge_restant_annee_courante", { min: 0 })}
            />
            {errors.conge_restant_annee_courante && (
              <p className="text-red-500">{t("modifierConge.erreur")}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2  flex-row-reverse">
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
