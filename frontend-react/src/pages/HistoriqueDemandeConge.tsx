import React, { useState, useEffect } from "react";
import axios from "axios";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";
import type { DemandeConge } from "../api/conge_api";
import AlerteMessage from "../components/AlerteMessage";
import Pagination from "../components/Pagination";

const HistoriqueDemandeConge: React.FC = () => {
  const { t } = useTranslation();
  const [demandes, setDemandes] = useState([]);
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
        }
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
        }
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
                <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium tracking-wider">
                  {t("user.table.periode")}
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium tracking-wider">
                  {t("user.table.conge_demandee")}
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left hidden md:table-cell text-sm font-medium-wider">
                  {t("user.table.motif")}
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium tracking-wider">
                  {t("user.table.statut")}
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium tracking-wider">
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
                <tr key={demande.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 bg-gray-50 text-left lg:text-sm leading-4 tracking-wider">
                    {demande.periode}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 bg-gray-50 text-center lg:text-left lg:text-sm leading-4">
                    {demande.conge_demande}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell text-xs text-gray-900 bg-gray-50 text-center lg:text-left lg:text-sm leading-4">
                    {demande.motif}
                  </td>
                  {demande.annule ? (
                    <td className="px-3 py-2 whitespace-nowrap text-xs bg-gray-50 text-left lg:text-sm leading-4 tracking-wider text-red-400">
                      {t(`statut.annule`)}
                    </td>
                  ) : (
                    <td
                      className={`px-3 py-2 whitespace-nowrap text-xs bg-gray-50 text-left lg:text-sm leading-4 tracking-wider ${
                        demande.statut === "valide"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {t(`statut.${demande.statut}`)}
                    </td>
                  )}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 bg-gray-50 text-left lg:text-sm leading-4 tracking-wider">
                    {/* {demande.statut === "en_attente" && ( */}
                    <button
                      type="button"
                      disabled={demande.statut !== "en_attente"}
                      onClick={() => handleAnnuler(demande.id)}
                      className={`px-3 py-1 rounded-lg shadow bg-red-600 text-white hover:opacity-90 disabled:bg-red-300`}
                    >
                      {t("user.annuler")}
                    </button>
                    {/* )} */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <div className="mt-8 flex justify-end">
        {/* <div className="mt-8 flex flex-row-reverse justify-between items-center"> */}
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
