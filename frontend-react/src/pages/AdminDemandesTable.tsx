import React, { useCallback, useEffect, useState } from "react";
import type { DemandeConge } from "../api/conge_api";
import { fetchDemandes, validerConge, refuserConge } from "../api/conge_api";
import { isDecisionLocked } from "../utils/conges";
import { useTranslation } from "react-i18next";
import AlerteMessage from "../components/AlerteMessage";
import Pagination from "../components/Pagination";

type Props = { lockMinutes?: number };

const AdminDemandesTable: React.FC<Props> = ({ lockMinutes = 15 }) => {
  const { t } = useTranslation();
  const [demandes, setDemandes] = useState<DemandeConge[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [actingId, setActingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [statutFilter, setStatutFilter] = useState<
    "en_attente" | "valide" | "refuse" | "tous"
  >("tous");

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
    setActingId(id);

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
            Array.isArray(v) ? `${v.join(", ")}` : `${v}`
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
      } finally {
        setActingId(null);
      }
    }
  };

  const demandesFiltred =
    statutFilter === "tous"
      ? demandes
      : demandes.filter((d) => d.statut === statutFilter);

  const [currentPage, setCurrentPage] = useState(1);
  const congesPerPage = 10;

  const totalPages = Math.ceil(demandes.length / congesPerPage);
  const indexOfLastConge = (currentPage - 1) * congesPerPage;
  const indexOfFirstConge = indexOfLastConge + congesPerPage;
  const paginatedDemandes = demandesFiltred.slice(
    indexOfLastConge,
    indexOfFirstConge
  );
  const onPageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  if (loading)
    return <div className="p-4 animate-pulse">En cours de chargement…</div>;
  // if (errorMessage)
  // return <div className="p-4 text-red-600">{errorMessage}</div>;
  if (!demandes) return <div className="p-4">{t("user.table.empty")}</div>;

  return (
    <div className="p-4 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold mb-3">{t("user.table.title1")}</h2>
        <select
          aria-label="Filtrer les demandes par statut"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none"
          value={statutFilter}
          onChange={(e) =>
            setStatutFilter(
              e.target.value as "tous" | "valide" | "refuse" | "en_attente"
            )
          }
        >
          <option value="tous">{t("statut.all")}</option>
          <option value="en_attente">{t("statut.en_attente")}</option>
          <option value="valide">{t("statut.valide")}</option>
          <option value="refuse">{t("statut.refuse")}</option>
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
                {t("user.table.motif")}
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
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{d.personnel.matricule}</td>
                  <td className="px-3 py-2">
                    {d.personnel.nom} {d.personnel.prenoms}
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    {d.conge_demande}
                  </td>
                  <td className="px-3 py-2 leading-5">{d.periode}</td>
                  <td className="px-3 py-2 hidden md:table-cell">{d.motif}</td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {new Date(d.date_soumission).toLocaleString()}
                  </td>
                  {d.annule ? (
                    <td className="px-3 py-2">{t(`statut.annule`)}</td>
                  ) : (
                    <td className="px-3 py-2">{t(`statut.${d.statut}`)}</td>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(d.id, "valider")}
                        disabled={
                          locked ||
                          actingId === d.id ||
                          d.annule ||
                          d.statut !== "en_attente"
                        }
                        className="px-3 py-1 rounded-xl shadow cursor-pointer bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-white"
                        //className="px-3 py-1 rounded-xl shadow bg-green-600 text-white hover:opacity-90 disabled:bg-gray-300"
                      >
                        {t("admin.valider")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(d.id, "refuser")}
                        disabled={
                          locked ||
                          actingId === d.id ||
                          d.annule ||
                          d.statut !== "en_attente"
                        }
                        className={`px-3 py-1 rounded-xl shadow cursor-pointer transition-colors text-white 
                         disabled:bg-gray-400 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700
                        `}
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

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default AdminDemandesTable;
