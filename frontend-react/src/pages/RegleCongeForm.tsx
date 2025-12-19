import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { RegleCongeData } from "../api/conge_api";
import { useNavigate } from "react-router-dom";

const RegleCongeForm: React.FC = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [valeurActuelle, setValeurActuelle] = useState<{
    conge_initial_autres: number;
    conge_initial_tech: number;
  } | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegleCongeData>();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/conges/regle-conge/get_regle_courante/", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        reset({
          conge_initial_autres: data.conge_initial_autres,
          conge_initial_tech: data.conge_initial_tech,
        });
        setValeurActuelle({
          conge_initial_autres: data.conge_initial_autres,
          conge_initial_tech: data.conge_initial_tech,
        });
      });
  }, [reset]);

  // soumission du formulaire
  const onSubmit = async (data: RegleCongeData) => {
    if (
      data.conge_initial_autres === valeurActuelle?.conge_initial_autres &&
      data.conge_initial_tech === valeurActuelle?.conge_initial_tech
    ) {
      alert(t("regleForm.valeursIdentiques"));
      //   setShowConfirm(true);
      return;
    }

    // avant de soumettre le formulaire, on filtre les champs vides
    const payload: Partial<RegleCongeData> = {};
    if (data.conge_initial_autres)
      payload.conge_initial_autres = data.conge_initial_autres;
    if (data.conge_initial_tech)
      payload.conge_initial_tech = data.conge_initial_tech;

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/conges/regle-conge/regle_form/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (response.ok) {
        navigate("/dashboard/admin/regle-conges");
      }
    } catch (err) {
      console.error("Une erreur est survenue: ", err);
    }
  };
  return (
    // <div className="flex justify-center items-center min-h-full bg-gray-50">
    <section className="p-4 max-w-lg w-full mx-auto bg-white rounded-xl shadow">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-semibold mb-4">{t("regleForm.title")}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="conge_initial_autres"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              {t("regleForm.conge_initial_autres")}
            </label>
            <input
              type="number"
              id="conge_initial_autres"
              {...register("conge_initial_autres", { min: 1 })}
              className="w-full py-2 px-3 border border-gray-300 rounded-md"
            />
            {errors.conge_initial_autres && (
              <p className="text-red-500 text-xs mt-1">
                {t("regleForm.conge_initial_autres_error")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="conge_initial_tech"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              {t("regleForm.conge_initial_tech")}
            </label>
            <input
              type="number"
              id="conge_initial_tech"
              {...register("conge_initial_tech", { min: 1 })}
              className="w-full py-2 px-3 border border-gray-300 rounded-md"
            />
            {errors.conge_initial_tech && (
              <p className="text-red-500 text-xs mt-1">
                {t("regleForm.conge_initial_tech_error")}
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowConfirm(true)}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            {t("regleForm.submit")}
          </motion.button>
        </form>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed flex justify-center items-center inset-0 backdrop-blur-xs bg-black/30 z-50 "
          >
            <div
              className={`bg-white p-4 rounded shadow max-w-md w-full opacity-0 transition-opacity duration-500
                ${
                  showConfirm
                    ? "opacity-100 pointer-events-auto"
                    : "pointer-events-none"
                }`}
            >
              <h3 className="text-sm lg:text-base font-semibold mb-4 text-center">
                {t("regleForm.confirmTitle")}
              </h3>
              <div className="flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-500 text-sm lg:text-base text-white py-1 px-3 rounded-md hover:bg-gray-600"
                >
                  {t("regleForm.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    handleSubmit(onSubmit)();
                  }}
                  className="bg-green-500 text-sm lg:text-base text-white py-1 px-3 rounded-md hover:bg-green-600"
                >
                  {t("regleForm.confirm")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.main>
    </section>
    // </div>
  );
};

export default RegleCongeForm;
