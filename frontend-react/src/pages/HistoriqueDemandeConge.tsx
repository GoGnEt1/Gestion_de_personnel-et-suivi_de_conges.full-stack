import React, { useState, useEffect } from "react";
import axios from "axios";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";
import type { DemandeConge } from "../api/conge_api";
import AlerteMessage from "../components/AlerteMessage";
import Pagination from "../components/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateTime } from "../utils/date";

const HistoriqueDemandeConge: React.FC = () => {
  const { t } = useTranslation();
  const [demandes, setDemandes] = useState([]);
  const [selectedDemande, setSelectedDemande] = useState<DemandeConge | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchDemandes = async () => {
    try {
      const access = localStorage.getItem("access");
      const response = await axiosClient.get(
        "/conges/demande-conge/mes_demandes/",
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        },
      );
      setDemandes(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const clearMessage = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleAnnuler = async (id: number) => {
    try {
      const access = localStorage.getItem("access");
      const response = await axiosClient.post(
        `/conges/demande-conge/${id}/annuler/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        },
      );

      setSuccessMessage(response.data.detail || "Demande annulée avec succès!");
      fetchDemandes();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const backMes =
            error.response.data.detail ||
            error.response.data.message ||
            "Une erreur est survenue. Réessayez.";
          setErrorMessage(backMes);
        } else {
          setErrorMessage("Impossible de contacter le serveur.");
        }
      }
    }
  };
  const [currentPage, setCurrentPage] = useState(1);
  const congesPerPage = 10;

  const totalPages = Math.ceil(demandes.length / congesPerPage);
  const indexOfLastConge = (currentPage - 1) * congesPerPage;
  const indexOfFirstConge = indexOfLastConge + congesPerPage;
  const paginatedDemandes = demandes.slice(indexOfLastConge, indexOfFirstConge);
  const onPageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  return (
    <div className=" bg-gray-100">
      <main className="flex-grow p-4">
        <h2 className="text-2xl font-semibold mb-4">{t("user.mysRequests")}</h2>

        <div>
          <AlerteMessage
            errorMessage={errorMessage}
            successMessage={successMessage}
            clearMessage={clearMessage}
          />
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left font-medium tracking-wider">
                  {t("user.table.periode")}
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left font-medium tracking-wider">
                  {t("user.table.conge_demandee")}
                </th>
                <th className="px-3 py-2 text-left hidden md:table-cell">
                  {t("demandeConge.type")}
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left hidden md:table-cell text-sm font-medium-wider">
                  {t("user.table.motif")}
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left font-medium tracking-wider">
                  {t("user.table.statut")}
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left font-medium tracking-wider">
                  {t("user.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {demandes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    {t("user.noRequests")}
                  </td>
                </tr>
              )}
              {paginatedDemandes.map((demande: DemandeConge) => (
                <tr
                  key={demande.id}
                  className="text-sm"
                  onClick={() => setSelectedDemande(demande)}
                  title="Cliquez pour plus de détails"
                >
                  <td className="px-3 py-2 whitespace-nowrap text-gray-900 bg-gray-50 text-left lg:text-sm leading-4 tracking-wider">
                    {demande.periode}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-900 bg-gray-50 text-center lg:text-left lg:text-sm leading-4">
                    {demande.conge_demande}
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {t("demandeConge." + demande.type_demande)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell text-gray-900 bg-gray-50 text-center lg:text-left lg:text-sm leading-4">
                    {demande.motif ? demande.motif.slice(0, 50) : "-"}
                  </td>
                  {demande.annule ? (
                    <td className="px-3 py-2 whitespace-nowrap bg-gray-50 text-left lg:text-sm leading-4 tracking-wider text-red-400">
                      {t(`statut.annule`)}
                    </td>
                  ) : (
                    <td
                      className={`px-3 py-2 whitespace-nowrap bg-gray-50 text-left lg:text-sm leading-4 tracking-wider ${
                        demande.statut === "valide"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {t(`statut.${demande.statut}`)}
                      <p
                        className={`${demande.statut === "en_attente" ? "text-red-600" : "hidden text-green-600"}`}
                      >
                        {" "}
                        {t("contacterAdmin")}
                      </p>
                    </td>
                  )}
                  <td
                    className="px-3 py-2 whitespace-nowrap text-gray-900 bg-gray-50 text-left lg:text-sm leading-4 tracking-wider"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={demande.statut !== "en_attente"}
                      onClick={() => handleAnnuler(demande.id)}
                      className={`px-2 py-1 rounded shadow bg-red-600 text-white hover:opacity-90 disabled:bg-red-300 cursor-pointer`}
                    >
                      {t("user.annuler")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AnimatePresence>
          {selectedDemande && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white w-full max-w-lg rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {t("demande.details")}
                </h3>

                <div className="space-y-3 text-sm">
                  <p>
                    <b>{t("matricule")} : </b>{" "}
                    {selectedDemande.personnel?.matricule}
                  </p>
                  <p>
                    <b>{t("demande.type")} : </b>{" "}
                    {t(`demandeConge.${selectedDemande.type_demande}`)}
                  </p>
                  <p>
                    <b>{t("user.table.conge_demandee")} :</b>{" "}
                    {selectedDemande.conge_demande}
                  </p>
                  <p>
                    <b>{t("user.table.periode")} : </b>{" "}
                    {selectedDemande.periode}
                  </p>
                  <p>
                    <b>{t("user.table.motif")} : </b> {selectedDemande.motif}
                  </p>
                  <p>
                    <b>{t("user.table.duree")} : </b>{" "}
                    {formatDateTime(selectedDemande.date_soumission)}
                  </p>
                  <p>
                    <b>{t("user.table.statut")} : </b>{" "}
                    {t(`statut.${selectedDemande.statut}`)}
                  </p>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedDemande(null)}
                    className="px-3 py-1 rounded bg-gray-300 hover:bg-red-500 cursor-pointer"
                  >
                    {t("demande.fermer")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="mt-8 flex justify-end">
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
};

export default HistoriqueDemandeConge;
