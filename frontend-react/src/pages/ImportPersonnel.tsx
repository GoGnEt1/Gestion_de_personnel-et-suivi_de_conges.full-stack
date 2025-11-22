import React, { useState } from "react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import type { Personnel } from "../types/personnel";
import { useTranslation } from "react-i18next";

const ImportPersonnel: React.FC = () => {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Personnel[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  const { t } = useTranslation();
  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    // preview like before
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
      }) as Personnel[];
      setPreview(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipFile(file);
  };

  const handleUpload = async () => {
    if (!zipFile && !excelFile) {
      showAlert(t("importPersonnel.errorNoFile"), "error");
      return;
    }
    setLoading(true);
    setReport(null);

    const form = new FormData();
    if (zipFile) form.append("zip", zipFile);
    if (excelFile) form.append("fichier", excelFile);
    // optionnel: overwrite flag
    form.append("overwrite", "true");

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/personnels/import_zip_excel/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: form,
        }
      );

      const data = await res.json();
      if (res.ok) {
        showAlert(data.message || "Import terminé", "success");
        setReport(data);
      } else {
        showAlert(data.error || "Erreur import", "error");
        setReport(data);
      }
    } catch (err) {
      console.error(err);
      showAlert("Erreur réseau ou serveur.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-xl font-semibold mb-4">
        {t("importPersonnel.title2")}
      </h2>

      {alert && (
        <div
          className={`p-3 rounded ${
            alert.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("importPersonnel.excelFile")}
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelChange}
            placeholder="Fichier Excel (.xlsx)"
          />
          {excelFile && (
            <div className="mt-2 text-sm">
              {t("importPersonnel.selected")} {excelFile.name}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("importPersonnel.zipFile")}
          </label>
          <input
            type="file"
            accept=".zip"
            onChange={handleZipChange}
            placeholder="Archive ZIP (docs)"
          />
          {zipFile && (
            <div className="mt-2 text-sm">
              {t("importPersonnel.selected")} {zipFile.name}
            </div>
          )}
        </div>
      </div>

      {preview.length > 0 && excelFile && (
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="my-4 max-w-3xl sm:max-w-xl max-h-96 mx-auto w-full overflow-x-auto"
          >
            <h2 className="text-lg font-semibold mb-2">
              {t("importPersonnel.preview")}
            </h2>

            <table className="mt-4 text-sm">
              <thead>
                {preview.map((row, index) => (
                  <tr key={index}>
                    {index === 0 &&
                      Object.values(row).map((value, j) => (
                        <td
                          key={j}
                          className="text-center font-medium px-2 py-1 border border-gray-300"
                        >
                          {value as string}
                        </td>
                      ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index}>
                    {index > 0 &&
                      Object.values(row).map((value, j) => (
                        <td
                          key={j}
                          className="text-center px-2 py-1 border border-gray-300"
                        >
                          {value as string}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Import en cours..." : "Importer"}
        </button>
        <button
          onClick={() => {
            setExcelFile(null);
            setZipFile(null);
            setPreview([]);
            setReport(null);
          }}
          className="px-3 py-2 bg-gray-100 rounded"
        >
          {t("importPersonnel.reset")}
        </button>
      </div>

      {report && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="font-semibold">Rapport</h4>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  );
};

export default ImportPersonnel;
