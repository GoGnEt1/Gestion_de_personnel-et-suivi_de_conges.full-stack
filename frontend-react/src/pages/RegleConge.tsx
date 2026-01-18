import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { RegleCongeData } from "../api/conge_api";
import { fetchRecentRegles, fetchAllRegles } from "../api/conge_api";
import { motion } from "framer-motion";
import Alert from "../components/Alert";

import { useForm } from "react-hook-form";
import Pagination from "../components/Pagination";
import { API_URL } from "../api/http";

const RegleConge: React.FC = () => {
  const [regleConge, setRegleConge] = useState<RegleCongeData[]>([]);
  const [showAll, setShowAll] = useState(false);
  const { t } = useTranslation();

  const [showConfirm, setShowConfirm] = useState(false);
  const [valeurActuelle, setValeurActuelle] = useState<{
    conge_initial_autres: number;
    conge_initial_tech: number;
  } | null>(null);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegleCongeData>();

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) return;

    fetch(`${API_URL}/conges/regle-conge/get_regle_courante/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const regle = data[0];
        reset({
          conge_initial_autres: regle.conge_initial_autres,
          conge_initial_tech: regle.conge_initial_tech,
        });
        setValeurActuelle({
          conge_initial_autres: regle.conge_initial_autres,
          conge_initial_tech: regle.conge_initial_tech,
        });
      });
  }, [reset]);

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // soumission du formulaire
  const onSubmit = async (data: RegleCongeData) => {
    if (
      data.conge_initial_autres === valeurActuelle?.conge_initial_autres &&
      data.conge_initial_tech === valeurActuelle?.conge_initial_tech
    ) {
      showAlert(t("regleForm.valeursIdentiques"), "error");
      //   setShowConfirm(true);
      return;
    }

    // avant de soumettre le formulaire, on filtre les champs vides
    const payload: Partial<RegleCongeData> = {};
    if (data.conge_initial_autres)
      payload.conge_initial_autres = data.conge_initial_autres;
    if (data.conge_initial_tech)
      payload.conge_initial_tech = data.conge_initial_tech;

    // on affiche une alerte si aucun des champs n'est rempli
    if (Object.keys(payload).length === 0) {
      showAlert(t("regleForm.champsVides"), "error");
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/conges/regle-conge/regle_form/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify(data),
        }
      );
      const res = await response.json();
      if (response.ok) {
        showAlert(res.message || t("regleForm.success"), "success");
        const regle = data;
        reset({
          conge_initial_autres: regle.conge_initial_autres,
          conge_initial_tech: regle.conge_initial_tech,
        });
        setValeurActuelle({
          conge_initial_autres: regle.conge_initial_autres,
          conge_initial_tech: regle.conge_initial_tech,
        });
      } else {
        showAlert(t("Une erreur est survenue. Veuillez reessayer."), "error");
      }
    } catch (err) {
      showAlert(t(`Problème de connexion: ${err} `), "error");
    }
  };

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) return;
    fetchRecentRegles(access).then(setRegleConge).catch(console.error);
  }, []);

  const handleShowAll = async () => {
    try {
      const access = localStorage.getItem("access");
      if (!access) return;
      const data = await fetchAllRegles(access);
      setRegleConge(data);
      setShowAll(true);
    } catch (error) {
      console.error(error);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const reglePerPage = 5;

  const totalPages = Math.ceil(regleConge.length / reglePerPage);
  const indexOfLastConge = (currentPage - 1) * reglePerPage;
  const indexOfFirstConge = indexOfLastConge + reglePerPage;
  const paginatedRegle = regleConge.slice(indexOfLastConge, indexOfFirstConge);
  const onPageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <section className="font-mono flex justify-center items-center min-h-full bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-14">
        {/* left card */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className=" p-6 lg:col-span-6"
        >
          <div className="flex flex-col mb-4 p-4 lg:max-w-xl bg-white rounded border border-gray-300 shadow">
            <h2 className="text-xl text-center font-bold mb-4">
              {t("regleConge.title")}
            </h2>
            {!regleConge.length ? (
              <p>{t("regleConge.empty")}</p>
            ) : (
              <div className="space-y-4">
                {paginatedRegle.map((regle, index) => (
                  <div key={index} className="border-b pb-4 border-gray-200">
                    <p className="mb-2">
                      {t("regleConge.tech")} :{" "}
                      <span className="font-semibold">
                        {regle.conge_initial_tech}
                      </span>
                    </p>
                    <p className="mb-2">
                      {t("regleConge.autre")} :{" "}
                      <span className="font-semibold">
                        {regle.conge_initial_autres}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {t("regleConge.lastUpdate")}{" "}
                      <span className="font-medium text-black">
                        {regle.modifie_par
                          ? regle.modifie_par.prenoms +
                            " " +
                            regle.modifie_par.nom
                          : "admin"}
                      </span>{" "}
                      {t("regleConge.at")}{" "}
                      {new Date(regle.date_maj).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!showAll ? (
              <button
                type="button"
                onClick={handleShowAll}
                className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mt-4 ${
                  !regleConge.length && "hidden"
                }`}
              >
                {t("regleConge.showAll")}
              </button>
            ) : (
              <div className="mt-5 flex flex-col gap-4">
                <div
                  className={`flex justify-end ${
                    regleConge.length <= reglePerPage && "hidden"
                  }`}
                >
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
                >
                  {t("regleConge.hideAll")}
                </button>
              </div>
            )}
          </div>
        </motion.div>
        {/* </div> */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 lg:col-span-8"
        >
          <section className="p-4 max-w-lg w-full mx-auto bg-white rounded-xl shadow">
            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-semibold mb-4">
                {t("regleForm.title")}
              </h2>
              {alert && <Alert message={alert.message} type={alert.type} />}

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
                    className="w-full py-2 px-3 border border-gray-300 rounded-md outline-none focus:border-gray-500"
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
                    className="w-full py-2 px-3 border border-gray-300 rounded-md outline-none focus:border-gray-500"
                  />
                  {errors.conge_initial_tech && (
                    <p className="text-red-500 text-xs mt-1">
                      {t("regleForm.conge_initial_tech_error")}
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 1.25 }}
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
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
        </motion.div>
      </div>
    </section>
  );
};

export default RegleConge;
