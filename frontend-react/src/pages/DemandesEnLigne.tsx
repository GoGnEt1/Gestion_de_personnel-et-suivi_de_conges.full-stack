import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/useAuth";
import type { Demande } from "../types/personnel";
import { useTranslation } from "react-i18next";
import { approuverDemande, refuserDemande } from "../types/personnel";
import useOnclickOutside from "../utils/useOnclickOutside";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateTime, formatDate, formatTime } from "../utils/date";
import Alert from "../components/Alert";
import { getErrorMessage } from "../types/personnel";
import Pagination from "../components/Pagination";

const DemandesEnLigne = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const isAdmin = user?.is_staff || false;
  const access = localStorage.getItem("access");

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

  const handleAction = async (id: number, action: "approuver" | "refuser") => {
    if (access) {
      try {
        const response = await (action === "approuver"
          ? approuverDemande(access, id)
          : refuserDemande(access, id));
        showAlert(response.message, "success");
      } catch (err: unknown) {
        showAlert(getErrorMessage(err), "error");
      }
    }
  };
  useEffect(() => {
    axiosClient.get("/demandes/").then((res) => {
      setDemandes(res.data);
      setLoading(false);
    });
  }, []);

  const [showSlide, setShowSlide] = useState(false);
  const slideRef = useRef<HTMLDivElement | null>(null);

  useOnclickOutside(slideRef, () => setShowSlide(false));

  const handleNavigate = (url: string) => {
    if (isAdmin) {
      navigate(`/dashboard/admin/${url}`);
    } else {
      navigate(`/dashboard/user/${url}`);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const congesPerPage = 15;

  const totalPages = Math.ceil(demandes.length / congesPerPage);
  const indexOfLastConge = (currentPage - 1) * congesPerPage;
  const indexOfFirstConge = indexOfLastConge + congesPerPage;
  const paginatedDemandes = demandes.slice(indexOfLastConge, indexOfFirstConge);
  const onPageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  // filtre de demandes par type de demande ou recherche d'une demande specifique par matricule ou nom ou prenoms

  return (
    <div className="p-2">
      <div className="mb-2 bg-white rounded shadow pb-2">
        <div className="text-sm text-gray-500 border-b-4 border-gray-200 py-2 px-4 z-50 ">
          <button
            onClick={() => window.history.back()}
            type="button"
            className="cursor-pointer hover:underline"
          >
            {t("personnel.acceuil")}
          </button>{" "}
          &gt; {t("demandesEnLigne")}
        </div>

        <div className="relative inline-block" ref={slideRef}>
          <button
            onClick={() => setShowSlide((p) => !p)}
            className="mt-6 inline-flex ml-2 items-center gap-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            {t("demande.title")}
          </button>

          <AnimatePresence>
            {showSlide && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 p-1 w-72 h-45 rounded-md bg-white shadow-lg z-50"
              >
                <div className="p-3 border-b font-semibold">
                  {t("demande.model")}
                </div>

                <div className="p-3 mt-1">
                  <ul className="space-y-3 text-[15px]">
                    <li
                      className="cursor-pointer hover:text-green-600"
                      onClick={() => handleNavigate("demande-conges-form")}
                    >
                      {t("demandeConge.title")}
                    </li>

                    <li
                      className="cursor-pointer hover:text-green-600"
                      onClick={() => handleNavigate("demande-sortie-form")}
                    >
                      {t("demande.sortie")}
                    </li>

                    <li
                      className="cursor-pointer hover:text-green-600"
                      onClick={() => handleNavigate("attestation-travail-form")}
                    >
                      {t("demande.attestation")}
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Overlay */}
        {showSlide && (
          <div
            onClick={() => setShowSlide(false)}
            className="fixed inset-0 bg-black/30 z-40"
          />
        )}
      </div>
      {alert && <Alert message={alert.message} type={alert.type} />}

      <div className="bg-white rounded shadow ">
        {loading ? (
          <p>Chargement...</p>
        ) : demandes.length === 0 ? (
          <p className="text-gray-500">{t("demande.empty")} </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className={`${isAdmin ? "px-2 py-3" : "hidden"}`}>
                  {t("names")}
                </th>
                <th className="px-2 py-3">{t("demande.type")}</th>
                <th className="p-2">{t("demande.statut")}</th>
                <th className="px-2 py-3 hidden md:table-cell">{t("motif")}</th>
                <th className="px-2 py-3 hidden md:table-cell">
                  {t("demande.exemplaire")}
                </th>
                <th className="px-2 py-3">{t("user.table.duree")}</th>
                <th className={`${isAdmin ? "p-2" : "hidden"}`}>
                  {t("demande.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDemandes.map((d) => (
                <tr
                  key={d.id}
                  className="border-t bg-white hover:bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedDemande(d)}
                  title="Cliquez pour plus de détails"
                >
                  <td className={`${isAdmin ? "px-2 py-3" : "hidden"}`}>
                    {d.personnel?.nom || ""} {d.personnel?.prenoms || ""}{" "}
                  </td>
                  <td className="px-2 py-3">
                    {t(`demande.${d.type_demande}`)}
                  </td>
                  <td className="px-2 py-3">
                    {d.statut === "en_attente" ? (
                      <span className="text-yellow-600">
                        {t(`statut.${d.statut}`)}{" "}
                        <p className={`${isAdmin ? "hidden" : ""}`}>
                          {" "}
                          {t("contacterAdmin")}
                        </p>
                      </span>
                    ) : d.statut === "refuse" ? (
                      <span className="text-red-600">
                        {t(`statut.${d.statut}`)}
                      </span>
                    ) : (
                      <span className="text-green-600">
                        {t(`demande.${d.statut}`)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 hidden md:table-cell">
                    {d.motif ? d.motif.slice(0, 50) : "-"}
                  </td>
                  <td className="px-2 py-3 hidden md:table-cell">
                    {d.nombre_copies && d.type_demande === "attestation"
                      ? d.nombre_copies
                      : "-"}
                  </td>
                  <td className="px-2 py-3">
                    {new Date(d.date_soumission).toISOString().split("T")[0]}
                  </td>
                  <td
                    className={`${isAdmin ? "px-2 py-3" : "hidden"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex flex-col sm:flex-row gap-2 z-50">
                      <button
                        type="button"
                        onClick={() => {
                          handleAction(d.id, "approuver");
                        }}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
                      >
                        {t("demande.approuver")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleAction(d.id, "refuser");
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                      >
                        {t("admin.refuser")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
                    <b>{t("names")} :</b> {selectedDemande.personnel?.prenoms}{" "}
                    {selectedDemande.personnel?.nom}
                  </p>
                  <p>
                    <b>{t("demande.type")} : </b>{" "}
                    {t(`demande.${selectedDemande.type_demande}`)}
                  </p>
                  {selectedDemande.type_demande === "sortie" && (
                    <div className="space-y-2 text-sm sm:block hidden">
                      <p>
                        <b>{t("demande.dateSortie")} : </b>{" "}
                        {formatDate(selectedDemande.date_sortie as string)}
                      </p>
                      <p>
                        <b>{t("demande.heureSortie")} : </b>{" "}
                        {formatTime(selectedDemande.heure_sortie as string)}
                      </p>
                      <p>
                        <b>{t("demande.heureRetour")} : </b>{" "}
                        {formatTime(selectedDemande.heure_retour as string)}
                      </p>
                    </div>
                  )}
                  {selectedDemande.type_demande === "sortie" && (
                    <p>
                      <b>{t("demandeConge.motif")} : </b>{" "}
                      {selectedDemande.motif}
                    </p>
                  )}
                  {selectedDemande.type_demande === "attestation" && (
                    <>
                      <p>
                        <b>{t("demande.exemplaire")} : </b>{" "}
                        {selectedDemande.nombre_copies}
                      </p>
                      <p>
                        <b>{t("demande.langue")} : </b>{" "}
                        {t(`${selectedDemande.langue}`)}
                      </p>
                    </>
                  )}
                  <p>
                    <b>{t("user.table.duree")} : </b>{" "}
                    {formatDateTime(selectedDemande.date_soumission)}
                  </p>
                  <p>
                    <b>{t("demande.statut")} : </b>{" "}
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
      </div>

      <div className="mt-2 flex justify-end">
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

export default DemandesEnLigne;

/*
{/* {user?.is_staff && d.statut === "en_attente" && ( 
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() =>
                          approuverDemande(
                            localStorage.getItem("access") as string,
                            d.id,
                          ).then(() => window.location.reload())
                        } // approuverDemande(d.id)}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
                      >
                        {t("demande.approuver")}
                      </button>

                      <button
                        onClick={() =>
                          refuserDemande(
                            localStorage.getItem("access") as string,
                            d.id,
                          ).then(() => window.location.reload())
                        }
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                      >
                        {t("admin.refuser")}
                      </button>
                    </div>

<table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Type</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-2">{d.type}</td>
                  <td className="p-2">
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                  {user?.is_staff ? (
                    <td className="p-2">
                      <button
                        onClick={() =>
                          axiosClient.post(`/demandes/${d.id}/approuver/`)
                        }
                      >
                        Approuver
                      </button>
                    </td>
                  ) : (
                    <span>Statut: {d.statut}</span>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
*/
/*
            <div className="space-y-4">
              {["conge", "sortie", "attestation"].map((type) => (
                <fieldset key={type} className="border p-4 rounded">
                  <legend className="font-bold text-green-700">
                    {t(`demandes.${type}`)}
                  </legend>

                  {demandes
                    .filter((d) => d.type_demande === type)
                    .map((d) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-center p-2 border-b"
                      >
                        <span>
                          {d.personnel?.nom} – {d.statut}
                        </span>

                        <div className="flex gap-2">
                          <Link
                            to={`/fiches/${d.id}`}
                            className="text-blue-600 underline"
                          >
                            {t("telecharger")}
                          </Link>

                          {user?.is_staff && d.statut === "en_attente" && (
                            <button
                              onClick={() =>
                                approuverDemande(
                                  localStorage.getItem("access") as string,
                                  d.id,
                                ).then(() => window.location.reload())
                              } // approuverDemande(d.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded"
                            >
                              {t("approuver")}
                            </button>
                          )}
                        </div>*/
