import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { API_URL } from "../api/http";

const ImportConges: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const year_n = new Date().getFullYear();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleFilechange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      setLogs([t("importConges.noFile")]);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("fichier", file);

    try {
      const response = await fetch(`${API_URL}/conges/import_conges/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: formData,
      });
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        setLogs(data.logs || []);
        navigate("/dashboard/admin/list-conges");
      } else {
        const text = await response.text();
        console.error("Réponse non JSON:", text);
        setLogs(["Une erreur est survenue"]);
        return;
      }
    } catch (error) {
      console.error(error);
      setLogs(["Une erreur est survenue"]);
    }
  };
  return (
    <section className="import flex flex-col gap-5 justify-center items-center min-h-full bg-gray-50">
      <div className="mt-6 text-xs bg-blue-50 p-4 rounded-lg">
        <p className="font-semibold mb-2">En-tête Excel obligatoire :</p>
        <ul className="list-disc list-inside">
          <li>المعرف</li>
          <li>الباقي من العطلة الإستراحة {year_n}</li>
          <li>الباقي من العطلة الإستراحة {year_n - 1}</li>
          <li>الباقي من العطلة الإستراحة {year_n - 2}</li>
          <li>الباقي من العطلة التعويضية</li>
          <li>الباقي من العطل الاستثنائية {year_n}</li>
        </ul>
      </div>

      <div className="p-6 pl-10 max-w-sm w-full mx-auto bg-white shadow-xl rounded-2xl">
        <h2 className="text-xl font-semibold mb-8 flex items-center gap-5">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          {t("importConges.title")}
          <FaTimes
            className="text-lg ml-2 cursor-pointer hover:text-red-500 transition-colors duration-500 ease-in-out"
            onClick={() => window.history.back()}
            title={t("close")}
          />
        </h2>

        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFilechange}
          placeholder={t("importConges.placeholder")}
          className="mb-8 block w-full text-sm text-gray-900
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
        file:bg-green-50 file:text-green-700
        hover:file:bg-green-100
         file:transition-all file:duration-500"
        />

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-3 py-1 w-full rounded-xl shadow bg-green-600 text-white hover:opacity-90 cursor-pointer disabled:cursor-default disabled:bg-gray-300"
        >
          {loading ? t("importConges.loading") : t("importConges.upload")}
        </button>

        {logs.length > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-xl max-h-60 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">
              {t("importConges.logs")}
            </h3>
            <ul className="list-disc list-inside">
              {logs.map((log, index) => (
                <li
                  key={index}
                  className={
                    log.includes("succès") ? "text-green-600" : "text-red-600"
                  }
                >
                  {log}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default ImportConges;
