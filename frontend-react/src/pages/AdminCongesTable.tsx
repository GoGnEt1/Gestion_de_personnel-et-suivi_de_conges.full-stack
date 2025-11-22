import React, { useState, useEffect } from "react";
import type { Conge } from "../api/conge_api";
import { fetchAllchConges } from "../api/conge_api";
import { useTranslation } from "react-i18next";
import Pagination from "../components/Pagination";
import { slugify } from "../utils/slugify";
import { useNavigate } from "react-router-dom";

const AdminCongesTable: React.FC = () => {
  const [conges, setConges] = useState<Conge[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const congesPerPage = 10;

  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      console.log("vous n'êtes pas connecté");
      window.location.href = "/login";
      return;
    }
    setLoading(true);

    fetchAllchConges(access)
      .then(setConges)
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);
  // const currentYear = new Date().getFullYear();
  const currentYear = conges[0]?.annee;

  useEffect(() => {
    setSearch("");
  }, [conges]);

  useEffect(() => {
    document.body.className = "admin-dashboard";
    return () => {
      document.body.className = "";
    };
  });

  // filtrage par recherche (nom ou matricule)
  const filteredConges = conges.filter((conge) => {
    const query = search.toLowerCase();
    return (
      conge.personnel.nom.toLowerCase().includes(query) ||
      conge.personnel.prenoms.toLowerCase().includes(query) ||
      conge.personnel.matricule.toLowerCase().includes(query)
    );
  });

  //  trier par ordre de nom
  const sortedConges = filteredConges.sort((a, b) => {
    return a.personnel.nom
      .toLowerCase()
      .localeCompare(b.personnel.nom.toLowerCase());
  });

  const totalPages = Math.ceil(sortedConges.length / congesPerPage);
  const indexOfLastConge = (currentPage - 1) * congesPerPage;
  const indexOfFirstConge = indexOfLastConge + congesPerPage;
  const paginatedConges = sortedConges.slice(
    indexOfLastConge,
    indexOfFirstConge
  );
  const onPageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) return <div className="p-4 animate-pulse">Chargement…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!conges) return <div className="p-4">Aucun congé trouvé</div>;

  return (
    <section className=" admin-dashboard">
      {/* header + barre de recherche */}
      <div className="mb-4 px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <h2 className="text-xl font-semibold">
          {t("admin.congesTable_title")}
        </h2>
        <input
          type="text"
          title={t("admin.searchCriteria")}
          placeholder={t("admin.search")}
          className="border border-gray-300 rounded px-3 py-1 outline-none focus:border-gray-400 "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-lg">
        <table className="min-w-full table-auto text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 text-sm font-semibold">
            <tr>
              {/* matricule, nom, prenoms, rang, le reste des : vacances currentYear, currentYear - 1, currentYear - 2, le total du reste des vacances, total des vacances compensatoires sum(n-1 et n-2)*/}
              <th className="px-3 py-3">{t("N°")}</th>
              <th className="px-3 py-3">{t("matricule")}</th>
              <th className="px-4 py-3">{t("name")}</th>
              <th className="px-4 py-3">
                {t("admin.table.vacancesRestantes")} {currentYear}
              </th>
              <th className="px-4 py-3">
                {t("admin.table.vacancesRestantes")} {currentYear - 1}
              </th>
              <th className="px-4 py-3">
                {t("admin.table.vacancesRestantes")} {currentYear - 2}
              </th>
              <th className="px-4 py-3">{t("admin.table.vacancesTotal")}</th>
              <th className="px-4 py-3 hidden md:table-cell">
                {t("admin.table.vacancesCompensatoires")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {conges.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center">
                  {t("admin.table.congesTable_noData")
                    .split(" ")
                    .slice(0, 3)
                    .join(" ")}
                </td>
              </tr>
            ) : filteredConges.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center">
                  {t("admin.table.congesTable_noData")} "{search.toLowerCase()}"
                </td>
              </tr>
            ) : (
              paginatedConges.map((conge, ind) => (
                <tr
                  key={conge.id}
                  onClick={() =>
                    navigate(
                      `/dashboard/admin/historique-conges/${
                        conge.personnel.id
                      }-${slugify(conge.personnel.nom || "")}-${slugify(
                        conge.personnel.prenoms || ""
                      )}`
                    )
                  }
                  className="hover:bg-gray-50 transition-colors duration-300"
                >
                  <td className="px-3 py-3">{ind}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {conge.personnel.matricule}
                  </td>
                  <td className="px-4 py-3">
                    {conge.personnel.nom} {conge.personnel.prenoms}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Math.round(conge.conge_restant_annee_courante)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Math.round(conge.conge_restant_annee_n_1)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Math.round(conge.conge_restant_annee_n_2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Math.round(conge.conge_total)}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-blue-600 hidden md:table-cell">
                    {Math.round(conge.conge_compasatoire)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </section>
  );
};

export default AdminCongesTable;
