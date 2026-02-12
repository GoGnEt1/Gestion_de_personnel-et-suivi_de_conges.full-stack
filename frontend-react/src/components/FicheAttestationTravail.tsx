import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import HeaderOfficielTN from "./HeaderOfficielTN";
import LigneFiche from "./LigneFiche";
import { exportPdf } from "./PdfExportButton";
import type { Demande, Personnel } from "../types/personnel";
import rendersBoxes from "./rendersBoxes";

import { useParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";

type FicheProps = {
  personnel: Personnel | null;
};

const FicheAttestationTravail: React.FC<FicheProps> = ({ personnel }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const today = new Date().toLocaleDateString("fr-FR");

  const [demande, setDemande] = useState<Demande | null>(null);

  const { slug } = useParams();

  const id = slug?.split("-")[0];

  useEffect(() => {
    if (!id) return;

    const access = localStorage.getItem("access");
    if (!access) return;

    axiosClient
      .get(`/demandes/last_demande_attestation/`, {
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
              `attestation_travail_${personnel?.nom || ""}_${personnel?.prenoms || ""}.pdf`,
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
          {t("demande.attestation")}
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
          label={t("happyBirthday")}
          value={
            personnel && (personnel.birthday || personnel.lieu_naissance)
              ? personnel.birthday + " à " + personnel.lieu_naissance
              : personnel
                ? personnel.birthday
                : ""
          }
          _width="w-50"
        />
        <LigneFiche
          label={t("personnel.grade")}
          value={personnel ? personnel.grade : ""}
        />

        <LigneFiche label={t("demande.lieuTravail")} value={t("fsg")} />

        <LigneFiche
          label={t("demande.requestLangue")}
          value={t(`${demande?.langue || ""}`)}
          _width="w-120"
        />

        <div className="my-4 flex items-center gap-4">
          <p className="mb-1">
            <span className="font-semibold">
              {t("demande.exemplaire")}
              {" : "}{" "}
            </span>
          </p>
          {demande
            ? rendersBoxes(demande?.nombre_copies || "", 1)
            : rendersBoxes("", 1)}
        </div>

        <div className="mt-15 flex justify-between items-end">
          <p>{t("gabes") + ", " + today}</p>

          <p className="font-medium">{t("signature")}</p>
        </div>
      </div>
    </section>
  );
};

export default FicheAttestationTravail;
