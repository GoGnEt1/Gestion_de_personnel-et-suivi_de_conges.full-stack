import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Personnel } from "../types/personnel";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";
import { slugify } from "../utils/slugify";

import ExportModal from "../components/ExportModal";

const PersonnelList: React.FC = () => {
  const [personnels, setPersonnels] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const personnelPerPage = 10;

  const { t } = useTranslation();

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      window.location.href = "/login";
      return;
    }
    axiosClient
      .get("/personnels/", {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      })
      .then((res) => {
        setPersonnels(res.data);
      })
      .catch((err) => {
        setErr(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setSearch("");
  }, [personnels]);

  useEffect(() => {
    document.body.className = "personnel-list";
    return () => {
      document.body.className = "";
    };
  });

  const personnelSearch = personnels.filter((personnel) => {
    const query = search.toLowerCase();
    return (
      personnel.nom?.toLowerCase().includes(query) ||
      personnel.matricule.toLowerCase().includes(query) ||
      personnel.prenoms?.toLowerCase().includes(query) ||
      personnel.specialite?.toLowerCase().includes(query)
    );
  });

  const sortedPersonnels = personnelSearch.sort((a, b) => {
    return (a.nom?.toLowerCase() || "").localeCompare(
      b.nom?.toLowerCase() || "",
    );
  });

  const totalPages = Math.ceil(sortedPersonnels.length / personnelPerPage);
  const indexOfLastConge = (currentPage - 1) * personnelPerPage;
  const indexOfFirstConge = indexOfLastConge + personnelPerPage;
  const paginatedPersonnels = sortedPersonnels.slice(
    indexOfLastConge,
    indexOfFirstConge,
  );
  const onPageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return <div>{t("loading")}</div>;
  }
  if (err) {
    return <div>{err}</div>;
  }
  if (!personnels) {
    return <div>{t("personnelList.noPersonnel")}</div>;
  }

  return (
    <section className="p-4 personnel-list">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <h2 className="text-xl font-semibold">{t("personnelList.title")}</h2>
        <input
          type="text"
          title={t("personnelList.searchCriteria")}
          placeholder={t("personnelList.search")}
          className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-gray-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* <ExportPersonnels /> */}
        <div className="">
          <button
            type="button"
            className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setIsOpen(true)}
          >
            {t("exportPersonnel.export")}
          </button>
          <ExportModal onClose={() => setIsOpen(false)} isOpen={isOpen} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-lg">
        <table className="min-w-full table-auto text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 text-sm font-semibold">
            <tr>
              <th className="px-4 py-3">{t("name")}</th>
              <th className="px-4 py-3 hidden md:table-cell">
                {t("personnel.grade")}
              </th>
              <th className="px-4 py-3">{t("personnel.specialite")}</th>
              <th className="px-4 py-3">{t("personnel.ecole_origine")}</th>
              <th className="px-4 py-3">{t("matricule")}</th>
              <th className="px-4 py-3">{t("personnel.cin")}</th>
              <th className="px-4 py-3">{t("personnel.telephone")}</th>
              <th className="px-4 py-3 hidden md:table-cell">
                {t("personnel.date_affectation")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {personnels.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center">
                  {t("personnelList.noPersonnel")
                    .split(" ")
                    .slice(0, 3)
                    .join(" ")}
                </td>
              </tr>
            ) : personnelSearch.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center">
                  {t("personnelList.noPersonnel")} "{search.toLowerCase()}"
                </td>
              </tr>
            ) : (
              paginatedPersonnels.map((personnel) => (
                <tr
                  key={personnel.id}
                  onClick={() =>
                    navigate(
                      `/dashboard/admin/personnel/${personnel.id}-${slugify(
                        personnel.nom || "",
                      )}-${slugify(personnel.prenoms || "")}`,
                    )
                  }
                  className="hover:bg-gray-50 transition-colors duration-300"
                >
                  <td className="px-4 py-3 capitalize">
                    {personnel.nom?.toUpperCase()} {personnel.prenoms}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap capitalize">
                    {personnel.grade}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap capitalize">
                    {personnel.specialite}
                  </td>
                  <td className="px-4 py-3">
                    {personnel.ecole_origine?.toLowerCase().includes("fsg")
                      ? t("fsg")
                      : personnel.ecole_origine}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {personnel.matricule}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {personnel.cin}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {personnel.telephone}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap capitalize">
                    {personnel.date_affectation}
                  </td>
                  {/* <td className="px-4 py-3">{personnel.pv_affectation}</td> */}
                  {/* <td className="px-4 py-3">{personnel.decret_officiel}</td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-row-reverse justify-between items-center">
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

export default PersonnelList;
