import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Personnel } from "../types/personnel";
import axiosClient from "../api/axiosClient";
import axios from "axios";
import Alert from "../components/Alert";
import ImportPersonnel from "./ImportPersonnel";

const AjoutPersonnelForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Personnel>();

  const [message, setMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const showAlert = (message: string, type: "success" | "error") => {
    setMessage({ message, type });
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: Personnel) => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/personnels/", data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      showAlert(res.data.message, "success");
      console.log(res.data.message);
      reset();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.log(
          "erreur de la requête",
          err.response?.data || "Aucune reponse de l'api"
        );
        console.log("err", err.message || "Aucun message de l'api");
        if (err.response) {
          const data = err.response.data;
          const backendMessage =
            data.message ||
            data.error ||
            Object.values(data).flat().join(", ") ||
            t("personnel.errorAjout");
          showAlert(backendMessage, "error");
        } else {
          showAlert("Impossible de contacter le serveur.", "error");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Ajouter un personnel</h2>

        {message && <Alert type={message.type} message={message.message} />}
        {/* tous les champs du formulaire sont obligatoires, on affiche les erreurs de useForm pour chaque champ */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">{t("Matricule")}</label>
              <input
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50"
                type="text"
                placeholder={t("Matricule")}
                {...register("matricule", {
                  required: "Matricule est obligatoire",
                })}
              />
              {errors.matricule && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.matricule.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.cin")}
              </label>
              <input
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50"
                type="text"
                placeholder={t("personnel.cin")}
                {...register("cin", {
                  required: "Cin est obligatoire",
                })}
              />
              {errors.cin && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.cin.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.nom")}
              </label>
              <input
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50"
                type="text"
                placeholder={t("personnel.nom")}
                {...register("nom", { required: "Nom est obligatoire" })}
              />
              {errors.nom && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.nom.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.prenom")}
              </label>
              <input
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50"
                type="text"
                placeholder={t("personnel.prenom")}
                {...register("prenoms", {
                  required: "Prenoms est obligatoire",
                })}
              />
              {errors.prenoms && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.prenoms.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.email")}
              </label>
              <input
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50"
                type="email"
                placeholder={t("personnel.email")}
                {...register("email", { required: "Email est obligatoire" })}
              />
              {errors.email && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.telephone")}
              </label>
              <input
                type="tel"
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                placeholder={t("personnel.telephone")}
                {...register("telephone", {
                  required: "Telephone est obligatoire",
                  minLength: {
                    value: 11,
                    message: t("personnel.telephoneError"),
                  },
                  maxLength: {
                    value: 11,
                    message: t("personnel.telephoneError"),
                  },
                })}
                // pattern="[1-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}"
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  const value = input.value.replace(/\D+/g, "");
                  const formattedValue = value.replace(
                    /(\d{2})(\d{2})(\d{2})(\d{2})/,
                    "$1 $2 $3 $4"
                  );
                  input.value = formattedValue;
                }}
              />
              {errors.telephone && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.telephone.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.ecole_origine")}
              </label>
              <input
                type="text"
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                placeholder={t("personnel.ecole_origine")}
                {...register("ecole_origine", {
                  required: "Ecole origine est obligatoire",
                })}
              />
              {errors.ecole_origine && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.ecole_origine.message}
                </span>
              )}
            </div>
            {/* grade, specialite, date_affectation, date_passage_grade */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.specialite")}
              </label>
              <input
                type="text"
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                placeholder={t("personnel.specialite")}
                {...register("specialite", {
                  required: "Specialite est obligatoire",
                })}
              />
              {errors.specialite && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.specialite.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.grade")}
              </label>

              {/* un imput texte pour le grade et dont la saisie doit contenir soit ouvrier, admin ou technicien */}
              <input
                type="text"
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                placeholder={t("personnel.grade")}
                {...register("grade", {
                  required: "Grade est obligatoire",
                  pattern: {
                    value:
                      /(ouvrier|ouvrière|administrateur|technicien|assistant)/i,
                    message: t("personnel.gradeError"),
                  },
                })}
              />
              {errors.grade && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.grade.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.date_affectation")}
              </label>
              <input
                type="date"
                // maximum date d'aujourd'hui
                max={new Date().toISOString().split("T")[0]}
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                placeholder={t("personnel.date_affectation")}
                {...register("date_affectation", {
                  required: "Date affectation est obligatoire",
                })}
              />
              {errors.date_affectation && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.date_affectation.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("personnel.date_passage_grade")}
              </label>
              <input
                type="date"
                // maximum date d'aujourd'hui
                max={new Date().toISOString().split("T")[0]}
                className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                placeholder={t("personnel.date_passage_grade")}
                {...register("date_passage_grade", {
                  required: "Date passage grade est obligatoire",
                })}
              />
              {errors.date_passage_grade && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.date_passage_grade.message}
                </span>
              )}
            </div>
          </div>
          {/* button de soumission et annulation */}
          <div className="flex justify-center gap-2 mt-5">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 sm:w-2/5 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              {!loading ? t("personnel.ajouter") : "En cours d'envoi"}
            </button>
            <button
              type="reset"
              className="w-1/2 sm:w-2/5 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => reset()}
            >
              {t("personnel.annuler")}
            </button>
          </div>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-gray-400" />
          <span className="flex-shrink mx-4 text-gray-400">{t("or")}</span>
          <hr className="flex-grow border-t border-gray-400" />
        </div>

        {/* <div className="bg-gray-200 h-4 w-full -mt-8"></div> */}
        {/* ou voulez-vous faire une importation de personnel par xlsx ?  (on ajout un lien vers import-personnel)*/}
        <div className="mt-4">
          {/* <p className="text-sm">{t("personnel.ou_voulez_vous_faire")}</p> */}
          <ImportPersonnel />
        </div>
      </div>

      {/*  */}
    </motion.div>
  );
};

export default AjoutPersonnelForm;
