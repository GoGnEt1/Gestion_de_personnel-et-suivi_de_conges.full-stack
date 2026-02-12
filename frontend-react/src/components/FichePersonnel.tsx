import React, { useRef } from "react";
import type { Personnel } from "../types/personnel";
import { useTranslation } from "react-i18next";

import HeaderOfficielTN from "./HeaderOfficielTN";
import rendersBoxes from "./rendersBoxes";
import { exportPdf } from "./PdfExportButton";

import LigneFiche from "./LigneFiche";
type FicheProps = {
  personnel: Personnel | null;
};

const FichePersonnel: React.FC<FicheProps> = ({ personnel }) => {
  const ficheRef = useRef<HTMLDivElement>(null); // ref pour capturer la fiche

  const { t } = useTranslation();

  //  helper pour rendre cin et matricule en cases

  const today = new Date().toLocaleDateString("fr-FR");

  return (
    <section className="p-4">
      {/* buton telecharger */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 disabled:bg-green-400"
          onClick={() =>
            exportPdf(
              ficheRef as React.RefObject<HTMLDivElement>,
              `fiche_personnel_${personnel?.nom || ""}_${personnel?.prenoms || ""}.pdf`,
            )
          }
        >
          {t("exportPersonnel.export")}
        </button>
      </div>

      <div
        ref={ficheRef}
        className="p-4 text-black max-w-3xl mx-auto pb-20 text-sm md:text-base"
      >
        {/* En-tête */}
        <HeaderOfficielTN />

        <div className="flex justify-center items-center mb-4">
          <p className="w-1/2 border-2" />
        </div>
        {/* titre */}
        <h2 className="font-bold text-center mb-4 italic text-base md:text-lg">
          {t("exportPersonnel.ficheTitle")}
        </h2>

        {/* cin et matricule */}
        <div className="flex justify-between mb-3">
          <div>
            <p className="mb-1">
              <span className="font-semibold">
                {t("personnel.cin")}
                {" : "}{" "}
              </span>
            </p>
            {personnel
              ? rendersBoxes(personnel?.cin || "", personnel?.cin?.length || 8)
              : rendersBoxes("", 8)}
          </div>

          <div>
            <p className="mb-1">
              <span className="font-semibold">
                {t("matricule")}
                {" : "}{" "}
              </span>
            </p>
            {personnel
              ? rendersBoxes(
                  personnel?.matricule || "",
                  personnel?.matricule?.length || 8,
                )
              : rendersBoxes("", 8)}
          </div>
        </div>

        {/* infos principales */}
        <div className="space-y-4">
          <LigneFiche
            label={t("names")}
            value={
              personnel ? personnel.nom + " " + personnel.prenoms : undefined
            }
          />

          <LigneFiche
            label={t("happyBirthday")}
            value={
              personnel && (personnel.birthday || personnel?.lieu_naissance)
                ? personnel.birthday + t("a") + personnel.lieu_naissance
                : personnel
                  ? personnel.birthday
                  : undefined
            }
          />
          {/* nationalité */}
          <LigneFiche
            label={t("nationnalite")}
            value={personnel ? personnel.nationalite : undefined}
          />

          {/* niveau etude */}
          <LigneFiche
            label={t("niveauEtude")}
            value={personnel ? personnel.niveau_etudes : undefined}
          />

          {/* certificats academiques */}
          <LigneFiche
            label={t("certificatsAcademic")}
            value={personnel ? personnel.certificats_academiques : undefined}
            _width="w-45"
          />

          {/* grade */}
          <LigneFiche
            label={t("personnel.grade")}
            value={personnel?.grade || personnel?.rang || undefined}
          />
          {/* specialite */}
          <LigneFiche
            label={t("personnel.specialite")}
            value={personnel?.specialite || undefined}
          />

          {/*  ecole origine */}
          <LigneFiche
            label={t("personnel.ecole_origine")}
            value={personnel?.ecole_origine || undefined}
            _width="w-45"
          />
          {/* date affectation */}
          <LigneFiche
            label={t("personnel.date_affectation")}
            value={personnel?.date_affectation || undefined}
          />
          {/* date passage grade */}
          <LigneFiche
            label={t("personnel.date_passage_grade")}
            value={personnel?.date_passage_grade || undefined}
            _width="w-50"
          />

          {/* adresse */}

          <div className="flex gap-4">
            <div>
              <span className="font-semibold">
                {t("adressePostale")}
                {" : "}{" "}
              </span>{" "}
              {personnel && personnel?.adresse ? (
                personnel?.adresse
              ) : (
                <span className="border-b border-dotted w-50 inline-block"></span>
              )}
            </div>

            <div>
              <span className="font-semibold">
                {t("codePostale")}
                {" : "}{" "}
              </span>{" "}
              {personnel && personnel?.code_postal ? (
                personnel?.code_postal
              ) : personnel ? (
                <span className="border-b border-dotted w-25 inline-block"></span>
              ) : (
                <span className="border-b border-dotted w-35 inline-block"></span>
              )}
            </div>
          </div>

          {/* email */}
          <LigneFiche label={t("personnel.email")} value={personnel?.email} />

          {/* Situation familiale */}
          <LigneFiche
            label={t("matrimoniale")}
            value={
              personnel && (
                <div className="flex gap-4">
                  {["celibat", "marie", "divorce", "veuf"].map((s) => (
                    <label key={s} className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={personnel.situation_familiale === s}
                        readOnly
                      />
                      {t(s)}
                    </label>
                  ))}
                </div>
              )
            }
            _width="w-45"
          />

          {personnel && personnel.situation_familiale !== "celibat" && (
            <>
              <LigneFiche
                label={t("personnel.partenaire")}
                value={personnel?.partenaire}
              />

              <LigneFiche
                label={t("personnel.nombre_enfants")}
                value={
                  personnel?.nombre_enfants !== undefined
                    ? personnel.nombre_enfants
                    : undefined
                }
              />
            </>
          )}

          <LigneFiche
            label={t("personnel.observations")}
            value={personnel?.observations}
            emptyLines={3}
          />

          <footer className="mt-4">
            <div className="flex justify-between mt-8">
              <p>
                {t("gabes")}, {today}
              </p>
              <p>{t("signature")}</p>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
};

export default FichePersonnel;
