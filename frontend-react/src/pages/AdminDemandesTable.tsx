import React, { useCallback, useEffect, useState } from "react";
import type { DemandeConge } from "../api/conge_api";
import { fetchDemandes, validerConge, refuserConge } from "../api/conge_api";
import { isDecisionLocked } from "../utils/conges";
import { useTranslation } from "react-i18next";
import AlerteMessage from "../components/AlerteMessage";
import Pagination from "../components/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateTime } from "../utils/date";

type Props = { lockMinutes?: number };

const AdminDemandesTable: React.FC<Props> = ({ lockMinutes = 15 }) => {
  const { t } = useTranslation();
  const [demandes, setDemandes] = useState<DemandeConge[]>([]);
  const [selectedDemande, setSelectedDemande] = useState<DemandeConge | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const access = localStorage.getItem("access");

  const clearMessage = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };
  const reload = useCallback(() => {
    if (!access) return;

    setLoading(true);
    fetchDemandes(access)
      .then((d) => setDemandes(d))
      .catch((e) => setErrorMessage(String(e)))
      .finally(() => setLoading(false));
  }, [access]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleAction = async (id: number, action: "valider" | "refuser") => {
    if (access) {
      try {
        const response = await (action === "valider"
          ? validerConge(access, id)
          : refuserConge(access, id));

        setSuccessMessage(response.message || `Congé ${action} avec succès!`);
        reload();
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "errors" in err &&
          typeof (err as { errors?: unknown }).errors === "object"
        ) {
          // erreurs par champ : joiner et afficher
          const errorObj = err as { errors: Record<string, string[] | string> };
          const msgs = Object.entries(errorObj.errors).map(([, v]) =>
            Array.isArray(v) ? `${v.join(", ")}` : `${v}`,
          );
          setErrorMessage(msgs.join(" — "));
        } else if (typeof err === "object" && err !== null && "detail" in err) {
          const detail = (err as { detail: string | string[] }).detail;
          setErrorMessage(Array.isArray(detail) ? detail.join(" — ") : detail);
        } else if (
          typeof err === "object" &&
          err !== null &&
          "message" in err
        ) {
          setErrorMessage((err as { message: string }).message);
        } else {
          setErrorMessage("Une erreur est survenue. Réessayez.");
        }
      }
    }
  };

  // état du filtre unifier
  type FilterValue =
    | "tous"
    | `statut:${"en_attente" | "valide" | "refuse"}`
    | `type:${"standard" | "exceptionnel" | "compensatoire"}`;

  const [filterValue, setFilterValue] = useState<FilterValue>("tous");

  const demandesFiltred = demandes.filter((d) => {
    if (filterValue === "tous") return true;

    const [kind, value] = filterValue.split(":");

    if (kind === "statut") return d.statut === value;
    if (kind === "type") return d.type_demande === value;

    return true;
  });

  // reset de la pagination quand le filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterValue]);

  const [currentPage, setCurrentPage] = useState(1);
  const congesPerPage = 15;

  const totalPages = Math.ceil(demandesFiltred.length / congesPerPage);
  const indexOfLastConge = (currentPage - 1) * congesPerPage;
  const indexOfFirstConge = indexOfLastConge + congesPerPage;
  const paginatedDemandes = demandesFiltred.slice(
    indexOfLastConge,
    indexOfFirstConge,
  );
  const onPageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  if (loading)
    return <div className="p-4 animate-pulse">En cours de chargement…</div>;

  if (!demandes) return <div className="p-4">{t("user.table.empty")}</div>;

  return (
    <div className="p-4 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold mb-3">{t("user.table.title1")}</h2>
        <select
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value as FilterValue)}
          aria-label={t("statut.all")}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none"
        >
          <option value="tous">{t("statut.all")}</option>

          <optgroup label={t("user.table.statut")}>
            <option value="statut:en_attente">{t("statut.en_attente")}</option>
            <option value="statut:valide">{t("statut.valide")}</option>
            <option value="statut:refuse">{t("statut.refuse")}</option>
          </optgroup>

          <optgroup label={t("demandeConge.type")}>
            <option value="type:standard">{t("demandeConge.standard")}</option>
            <option value="type:exceptionnel">
              {t("demandeConge.exceptionnel")}
            </option>
            <option value="type:compensatoire">
              {t("demandeConge.compensatoire")}
            </option>
          </optgroup>
        </select>
      </div>
      <AlerteMessage
        errorMessage={errorMessage}
        successMessage={successMessage}
        clearMessage={clearMessage}
      />
      <div className="overflow-x-auto rounded-2xl shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">{t("matricule")}</th>
              <th className="px-3 py-2 text-left">{t("name")}</th>
              <th className="px-3 py-2 text-left hidden sm:table-cell">
                {t("user.table.conge_demandee")}
              </th>
              <th className="px-3 py-2 text-left">{t("user.table.periode")}</th>
              <th className="px-3 py-2 text-left hidden md:table-cell">
                {t("demandeConge.type")}
              </th>
              <th className="px-3 py-2 text-left hidden md:table-cell">
                {t("user.table.duree")}
              </th>
              <th className="px-3 py-2 text-left">{t("user.table.statut")}</th>
              <th className="px-3 py-2 text-center">{t("user.actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white text-xs lg:text-sm">
            {paginatedDemandes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-2 text-center">
                  {t("user.table.empty")}
                </td>
              </tr>
            )}
            {paginatedDemandes.map((d) => {
              const locked = isDecisionLocked(d.date_validation, lockMinutes);
              return (
                <tr
                  key={d.id}
                  className="border-b hover:bg-gray-50"
                  onClick={() => setSelectedDemande(d)}
                  title="Cliquez pour plus de détails"
                >
                  <td className="px-3 py-2">{d.personnel.matricule}</td>
                  <td className="px-3 py-2">
                    {d.personnel.nom} {d.personnel.prenoms}
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    {d.conge_demande}
                  </td>
                  <td className="px-3 py-2 leading-5">{d.periode}</td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {t("demandeConge." + d.type_demande)}
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {new Date(d.date_soumission).toLocaleString()}
                  </td>
                  {d.annule ? (
                    <td className="px-3 py-2">{t(`statut.annule`)}</td>
                  ) : (
                    <td className="px-3 py-2">{t(`statut.${d.statut}`)}</td>
                  )}
                  <td
                    className="px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(d.id, "valider")}
                        className={`px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer ${
                          (locked || d.annule || d.statut !== "en_attente") &&
                          "opacity-70 "
                        }`}
                      >
                        {t("admin.valider")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(d.id, "refuser")}
                        className={`px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer ${
                          (locked || d.annule || d.statut !== "en_attente") &&
                          "opacity-70"
                        }`}
                      >
                        {t("admin.refuser")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
                  <b>{t("names")} : </b> {selectedDemande.personnel?.prenoms}{" "}
                  {selectedDemande.personnel?.nom}
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
                  <b>{t("user.table.periode")} : </b> {selectedDemande.periode}
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

export default AdminDemandesTable;
