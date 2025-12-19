import axiosClient from "../api/axiosClient";
import type { Personnel } from "../types/personnel";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import { toast } from "react-hot-toast"; // ou ton showAlert
import { useTranslation } from "react-i18next";

type MediaItem = { label: string; field: keyof Personnel; url?: string | null };

const MEDIA_FIELDS: MediaItem[] = [
  { label: "personnel.pv_affectation", field: "pv_affectation" },
  { label: "personnel.cv", field: "cv" },
  { label: "personnel.decret_officiel", field: "decret_officiel" },
  { label: "personnel.fiche_fonction", field: "fiche_fonction" },
  { label: "personnel.fiche_module_fr", field: "fiche_module_fr" },
  { label: "personnel.fiche_module_en", field: "fiche_module_en" },
];

export default function PersonnelMedias({
  personnel,
  setPersonnel,
}: {
  personnel: Personnel;
  setPersonnel: (p: Personnel) => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.is_staff;
  const personnelId = personnel.id;

  const { t } = useTranslation();

  const uploadMedia = async (field: string, file: File) => {
    const form = new FormData();
    form.append("field", field);
    form.append("file", file);

    try {
      const res = await axiosClient.patch(
        `/personnels/${personnelId}/upload_media/`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success(res.data.message || "Fichier uploadé");
      // Rafraichir la ressource
      const refreshed = await axiosClient.get(`/personnels/${personnelId}/`);
      setPersonnel(refreshed.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error(err);
        const msg = err?.response?.data?.detail || "Erreur upload";
        toast.error(msg);
      }
    }
  };

  const deleteMedia = async (field: string) => {
    if (!confirm(t("personnel.confirmDelete"))) return;
    try {
      const res = await axiosClient.post(
        `/personnels/${personnelId}/delete_media/`,
        { field }
      );
      toast.success(res.data.message || "Fichier supprimé");
      const refreshed = await axiosClient.get(`/personnels/${personnelId}/`);
      setPersonnel(refreshed.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error(err);
        const msg = err?.response?.data?.detail || "Erreur upload";
        toast.error(msg);
      }
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-3">{t("personnel.medias")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEDIA_FIELDS.map((m) => {
          const url = personnel[m.field] as string | null | undefined;
          return (
            <div
              key={String(m.field)}
              className="border rounded p-3 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1">
                <div className="font-medium">{t(m.label)}</div>
                <div className="text-sm text-gray-500 lg:max-w-xs overflow-x-hidden">
                  {url ? url.split("/").pop() : t("personnel.noFile")}
                </div>
                {/* </div> */}

                <div className="flex items-center gap-3 mt-1">
                  {url && (
                    <div className="flex gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 text-sm hover:underline hover:text-green-700"
                      >
                        {t("personnel.apercu")}
                      </a>
                    </div>
                  )}

                  {isAdmin && (
                    <>
                      <label
                        className="cursor-pointer text-blue-500 text-sm hover:underline hover:text-blue-700"

                        // className="cursor-pointer text-sm text-white bg-green-600 px-2 py-1 rounded hover:bg-green-700"
                      >
                        {url
                          ? t("personnel.upload")
                          : t("personnel.ajoutFichier")}
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadMedia(String(m.field), file);
                          }}
                        />
                      </label>

                      {url && (
                        <button
                          onClick={() => deleteMedia(String(m.field))}
                          className="cursor-pointer text-sm text-red-600 hover:underline"
                        >
                          {t("personnel.delete")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
