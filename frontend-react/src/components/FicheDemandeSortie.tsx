import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import HeaderOfficielTN from "./HeaderOfficielTN";
import LigneFiche from "./LigneFiche";
import { exportPdf } from "./PdfExportButton";
import type { Demande, Personnel } from "../types/personnel";
import rendersBoxes from "./rendersBoxes";
import { formatDate, formatTime } from "../utils/date";

import { useParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";

type FicheProps = {
  personnel: Personnel | null;
};
const FicheDemandeSortie: React.FC<FicheProps> = ({ personnel }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [demande, setDemande] = useState<Demande | null>(null);

  const { slug } = useParams();
  const today = new Date().toLocaleDateString("fr-FR");

  const id = slug?.split("-")[0];

  useEffect(() => {
    if (!id) return;

    const access = localStorage.getItem("access");
    if (!access) return;

    axiosClient
      .get(`/demandes/last_demande_sortie/`, {
        params: { personnel_id: id },
        headers: {
          Authorization: `Bearer ${access}`,
        },
      })
      .then((res) => setDemande(res.data))
      .catch(() => setDemande(null));
  }, [id]);

  return (
    <section className="p-4">
      <div className="flex justify-end mb-4">
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 disabled:bg-green-400"
          onClick={() =>
            exportPdf(
              ref as React.RefObject<HTMLDivElement>,
              `demande_sortie_${personnel?.nom || ""}_${personnel?.prenoms || ""}.pdf`,
            )
          }
        >
          {t("exportPersonnel.export")}
        </button>
      </div>

      <div
        ref={ref}
        className="p-4 text-black max-w-3xl mx-auto pb-20 text-sm md:text-base"
      >
        <HeaderOfficielTN />

        <div className="flex justify-center items-center mb-4">
          <p className="w-1/2 border-2" />
        </div>
        {/* titre */}
        <h2 className="font-bold text-center mb-6 italic text-base md:text-lg">
          {t("demande.sortie")}
        </h2>

        {/* matricule */}

        <div className="mb-4 flex items-center gap-4">
          <p className="mb-1">
            <span className="font-semibold">
              {t("matricule")}
              {" : "}{" "}
            </span>
          </p>
          {personnel
            ? rendersBoxes(
                personnel.matricule || "",
                personnel.matricule?.length || 8,
              )
            : rendersBoxes("", 8)}
        </div>

        <LigneFiche
          label={t("names")}
          value={personnel ? personnel.nom + " " + personnel.prenoms : ""}
        />

        <LigneFiche
          label={t("personnel.grade")}
          value={personnel ? personnel.grade : ""}
        />

        <LigneFiche
          label={t("demande.dateSortie")}
          value={demande?.date_sortie ? formatDate(demande?.date_sortie) : ""}
        />
        <LigneFiche
          label={t("demande.heureSortie")}
          value={demande?.heure_sortie ? formatTime(demande?.heure_sortie) : ""}
        />
        <LigneFiche
          label={t("demande.heureRetour")}
          value={demande?.heure_retour ? formatTime(demande?.heure_retour) : ""}
        />
        <LigneFiche
          label={t("demande.motif")}
          emptyLines={3}
          value={demande?.motif}
        />

        <div className="mt-10 flex justify-between items-end" dir="ltr">
          <p>{t("gabes") + ", " + today}</p>

          <p className="font-semibold">{t("signature")}</p>

          <div className="border border-gray-400 p-4 w-60 h-40 pb-10">
            <p className="font-semibold text-center mb-2">{t("avisChef")}</p>
            <span className="border-b border-dotted w-full inline-block"></span>
            <span className="border-b border-dotted w-full inline-block"></span>
            <span className="border-b border-dotted w-full inline-block"></span>
            <span className="border-b border-dotted w-full inline-block"></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FicheDemandeSortie;
