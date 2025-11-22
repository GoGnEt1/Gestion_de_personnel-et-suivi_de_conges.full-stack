import React, { useState } from "react";
import { X, FileSpreadsheet } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();

  const allColunms = [
    { key: "id", label: t("id") },
    {
      key: "cin",
      label: t("personnel.cin"),
    },
    {
      key: "matricule",
      label: t("matricule"),
    },
    {
      key: "nom",
      label: t("personnel.nom"),
    },
    {
      key: "prenoms",
      label: t("personnel.prenom"),
    },
    {
      key: "grade",
      label: t("personnel.grade"),
    },
    {
      key: "specialite",
      label: t("personnel.specialite"),
    },
    {
      key: "ecole_origine",
      label: t("personnel.ecole_origine"),
    },
    {
      key: "email",
      label: t("personnel.email"),
    },
    {
      key: "telephone",
      label: t("personnel.telephone"),
    },
    {
      key: "date_affectation",
      label: t("personnel.date_affectation"),
    },
    {
      key: "date_passage_grade",
      label: t("personnel.date_passage_grade"),
    },
    {
      key: "is_active",
      label: t("personnel.is_active"),
    },
    {
      key: "pays",
      label: t("personnel.pays"),
    },
    {
      key: "cv",
      label: t("personnel.cv"),
    },
    {
      key: "pv_affectation",
      label: t("personnel.pv_affectation"),
    },
    {
      key: "decret_officiel",
      label: t("personnel.decret_officiel"),
    },
    {
      key: "fiche_fonction",
      label: t("personnel.fiche_fonction"),
    },
  ];

  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    allColunms.map((col) => col.key) // Par defaut tout est coché
  );
  const [loading, setLoading] = useState(false);
  // const [lang, setLang] = useState<"fr" | "ar">("fr");

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleDownload = async () => {
    const langToSend = i18n.language === "ar" ? "ar" : "fr";
    setLoading(true);
    try {
      const res = await axiosClient.get(
        `/personnels/export_personnel/?columns=${selectedColumns.join(
          ","
        )}&lang=${langToSend}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "personnels_fsg.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("Erreur export :", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg lg:w-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b">
          <h2 className="text-sm font-semibold text-gray-700">
            {t("exportPersonnel.title")}
          </h2>
          <button
            title={t("close")}
            onClick={onClose}
            className="text-gray-400 hover:text-red-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* choix des colonnes */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("exportPersonnel.choixColumns")}
          </h3>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded p-2 border border-gray-400">
            {allColunms.map((col) => (
              <label key={col.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                />
                {col.label}
              </label>
            ))}
          </div>
        </div>

        {/* buton export */}
        <div className="mt-6 flex justify-center items-center">
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading || selectedColumns.length === 0}
            className="flex items-center justify-center gap-2 w-2/3 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-400"
          >
            <FileSpreadsheet size={18} />{" "}
            {!loading
              ? t("exportPersonnel.download")
              : t("exportPersonnel.downloaded")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ExportModal;
