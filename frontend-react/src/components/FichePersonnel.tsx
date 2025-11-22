import React, { useRef, useState } from "react";
import type { Personnel } from "../types/personnel";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

type FicheProps = {
  personnel: Personnel | null;
};

const FichePersonnel: React.FC<FicheProps> = ({ personnel }) => {
  const ficheRef = useRef<HTMLDivElement>(null); // ref pour capturer la fiche

  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  //  helper pour rendre cin et matricule en cases
  const rendersBoxes = (text: string | number, length: number) => {
    const chars =
      typeof text === "string" ? text.split(" ").join("").split("") : "";

    return (
      <div className="flex space-x-1">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className="w-6.5 h-6.5 border border-black flex items-center justify-center text-sm font-medium"
          >
            {(chars ? chars[i] : text) || ""}
          </div>
        ))}
      </div>
    );
  };

  // Fonction de téléchargement en pdf
  const handleDowloadPDF = async () => {
    setLoading(true);
    if (!ficheRef.current) return;

    const element = ficheRef.current;
    // convertir en canvas avec html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "ffffff",
    });
    const imgData = canvas.toDataURL("image/png");

    // créer un document pdf A4
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    // adapter l'image au format A4
    const marginX = 10;
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - marginX * 2;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", marginX / 2, 5, pdfWidth, pdfHeight);

    pdf.save(
      `fiche_personnel_${personnel?.nom || ""}_${personnel?.prenoms || ""}.pdf`
    );
    setLoading(false);
  };

  return (
    <section className="p-4">
      {/* buton telecharger */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          disabled={loading}
          onClick={handleDowloadPDF}
          className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading
            ? t("exportPersonnel.downloaded")
            : t("exportPersonnel.export")}
        </button>
      </div>

      <div ref={ficheRef} className="p-4 text-black max-w-3xl mx-auto pb-20">
        {/* En-tête */}
        <div className="flex justify-between items-center gap-20 text-sm mb-4">
          <img
            src="/src/assets/logo_fsg-removebg-preview.png"
            alt="logo_tunisie"
            className="h-18 ml-auto border-none"
          />
          <div className="text-center max-w-72">
            <p className="font-semibold">{t("minisTuni")}</p>
            <span>******</span>

            <p className="font-semibold">{t("univerGa")}</p>
            <span>******</span>

            <p className="font-medium">{t("fsg")}</p>
          </div>
        </div>

        <div className="flex justify-center items-center mb-4">
          <p className="w-1/2 border-2" />
        </div>
        {/* titre */}
        <h2 className="font-bold text-center mb-4 italic">
          {t("exportPersonnel.ficheTitle")}
        </h2>

        {/* cin et matricule */}
        <div className="flex justify-between mb-3 text-sm">
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
                  personnel?.matricule?.length || 8
                )
              : rendersBoxes("", 8)}
          </div>
        </div>

        {/* infos principales */}
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-semibold">
              {t("names")} {" : "}{" "}
            </span>{" "}
            {personnel && (personnel.prenoms || personnel?.nom) ? (
              personnel.nom + " " + personnel.prenoms
            ) : (
              <span className="border-b border-dotted w-3/4 inline-block"></span>
            )}
          </p>

          <p>
            <span className="font-semibold">
              {t("happyBirthday")}
              {" : "}{" "}
            </span>{" "}
            {personnel && (personnel.birthday || personnel?.lieu_naissance) ? (
              personnel.birthday + " à " + personnel.lieu_naissance
            ) : personnel ? (
              <span className="border-b border-dotted w-77.5 inline-block"></span>
            ) : (
              <span className="border-b border-dotted w-99.5 inline-block"></span>
            )}{" "}
          </p>

          <p>
            <span className="font-semibold">
              {t("nationnalite")}
              {" : "}{" "}
            </span>{" "}
            {personnel && personnel?.nationalite ? (
              personnel.nationalite
            ) : personnel ? (
              <span className="border-b border-dotted w-96.75 inline-block"></span>
            ) : (
              <span className="border-b border-dotted w-118.75 inline-block"></span>
            )}{" "}
          </p>

          <p>
            <span className="font-semibold">
              {t("niveauEtude")}
              {" : "}{" "}
            </span>{" "}
            {personnel && personnel?.niveau_etudes ? (
              personnel.niveau_etudes
            ) : personnel ? (
              <span className="border-b border-dotted w-85.5 inline-block"></span>
            ) : (
              <span className="border-b border-dotted w-107 inline-block"></span>
            )}{" "}
          </p>

          <p>
            <span className="font-semibold">
              {t("certificatsAcademic")}
              {" : "}{" "}
            </span>{" "}
            {personnel && personnel?.certificats_academiques ? (
              personnel.certificats_academiques
            ) : personnel ? (
              <>
                <span className="border-b border-dotted w-87.5 inline-block "></span>
                <span className="border-b border-dotted w-[95%] inline-block"></span>
              </>
            ) : (
              <>
                <span className="border-b border-dotted w-99 inline-block "></span>
                <span className="border-b border-dotted w-[95%] inline-block"></span>
              </>
            )}
          </p>

          {personnel && personnel?.grade ? (
            <p>
              <span className="font-semibold">
                {t("personnel.grade")}
                {" : "}{" "}
              </span>
              {personnel.grade}
            </p>
          ) : personnel?.rang ? (
            <p>
              <span className="font-semibold">
                {t("personnel.rang")}
                {" : "}{" "}
              </span>
              {personnel.rang}{" "}
            </p>
          ) : (
            <div className="flex gap-4">
              <div className="">
                <span className="font-semibold">
                  {t("personnel.grade")}
                  {" : "}{" "}
                </span>{" "}
                <span className="border-b border-dotted w-60 inline-block"></span>
              </div>
              <div>
                <span className="font-semibold">
                  {t("rang")}
                  {" : "}{" "}
                </span>{" "}
                {personnel ? (
                  <span className="border-b border-dotted w-42 inline-block"></span>
                ) : (
                  <span className="border-b border-dotted w-54 inline-block"></span>
                )}
              </div>
            </div>
          )}

          <p>
            <span className="font-semibold">
              {t("personnel.specialite")}
              {" : "}{" "}
            </span>{" "}
            {personnel && personnel?.specialite ? (
              personnel?.specialite
            ) : !personnel ? (
              <span className="border-b border-dotted w-123 inline-block"></span>
            ) : (
              <span className="border-b border-dotted w-1/2 inline-block"></span>
            )}
          </p>

          <p>
            <span className="font-semibold">
              {t("personnel.ecole_origine")}
              {" : "}{" "}
            </span>{" "}
            {personnel && personnel?.ecole_origine ? (
              personnel?.ecole_origine
            ) : personnel ? (
              <span className="border-b border-dotted w-1/2 inline-block"></span>
            ) : (
              <span className="border-b border-dotted w-100.75 inline-block"></span>
            )}
          </p>

          <p>
            <span className="font-semibold">
              {t("personnel.date_affectation")}
              {" : "}{" "}
            </span>{" "}
            {personnel && personnel?.date_affectation ? (
              personnel?.date_affectation
            ) : !personnel ? (
              <span className="border-b border-dotted w-109.5 inline-block"></span>
            ) : (
              <span className="border-b border-dotted w-1/2 inline-block"></span>
            )}
          </p>

          <p>
            <span className="font-semibold">
              {t("personnel.date_passage_grade")}
              {" : "}{" "}
            </span>{" "}
            {personnel && personnel?.date_passage_grade ? (
              personnel?.date_passage_grade
            ) : personnel ? (
              <span className="border-b border-dotted w-1/2 inline-block"></span>
            ) : (
              <span className="border-b border-dotted w-97 inline-block"></span>
            )}
          </p>

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

          <p>
            <span className="font-semibold">
              {t("personnel.email")}
              {" : "}{" "}
            </span>{" "}
            {personnel && personnel?.email ? (
              personnel?.email
            ) : personnel ? (
              <span className="border-b border-dotted w-1/2 inline-block"></span>
            ) : (
              <span className="border-b border-dotted w-114 inline-block"></span>
            )}
          </p>

          <div className="flex gap-4">
            <div>
              <span className="font-semibold">
                {t("personnel.telephonePortable")}
                {" : "}{" "}
              </span>{" "}
              {/* {personnel
                ? rendersBoxes(personnel?.telephone || "", 8)
                : rendersBoxes("", 8)} */}
              {personnel && personnel?.telephone ? (
                personnel?.telephone
              ) : (
                <span className="border-b border-dotted w-35 inline-block"></span>
              )}
            </div>
            <div>
              <span className="font-semibold">
                {t("personnel.telephoneMobile")}
                {" : "}{" "}
              </span>{" "}
              {/* {personnel
                ? rendersBoxes(personnel?.telephone || "", 8)
                : rendersBoxes("", 8)} */}
              {personnel && personnel?.telephone_mobile ? (
                personnel?.telephone_mobile
              ) : personnel ? (
                <span className="border-b border-dotted w-35 inline-block"></span>
              ) : (
                <span className="border-b border-dotted w-42 inline-block"></span>
              )}{" "}
            </div>
          </div>

          {/* situation matrimoniale */}
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {t("matrimoniale")}
              {" : "}{" "}
            </span>{" "}
            <div className="flex gap-4">
              <label className="flex gap-1 items-center">
                <input
                  type="radio"
                  checked={personnel?.situation_familiale === "celibat"}
                  value={"celibat"}
                  placeholder={t("celibat")}
                  className="w-3.5 h-3.5"
                />
                {t("celibat")}
              </label>
              <label className="flex gap-1 items-center">
                <input
                  type="radio"
                  checked={personnel?.situation_familiale === "marie"}
                  value={"marie"}
                  placeholder={t("marie")}
                  className="w-3.5 h-3.5"
                />
                {t("marie")}
              </label>
              <label className="flex gap-1 items-center">
                <input
                  type="radio"
                  checked={personnel?.situation_familiale === "divorce"}
                  value={"divorce"}
                  placeholder={t("divorce")}
                  className="w-3.5 h-3.5"
                />
                {t("divorce")}
              </label>
              <label className="flex gap-1 items-center">
                <input
                  type="radio"
                  checked={personnel?.situation_familiale === "veuf"}
                  value={"veuf"}
                  placeholder={t("veuf")}
                  className="w-3.5 h-3.5"
                />
                {t("veuf")}
              </label>
            </div>
          </div>

          {personnel &&
          personnel?.situation_familiale !== "celibat" &&
          !personnel?.partenaire ? (
            <p>
              <span className="font-semibold">
                {t("personnel.partenaire")}
                {" : "}{" "}
              </span>{" "}
              <span className="border-b border-dotted w-107 inline-block"></span>
            </p>
          ) : personnel?.partenaire ? (
            <p>
              <span className="font-semibold">
                {t("personnel.partenaire")}
                {" : "}{" "}
              </span>{" "}
              {personnel?.partenaire}
            </p>
          ) : (
            !personnel && (
              <p>
                <span className="font-semibold">
                  {t("personnel.partenaire")}
                  {" : "}{" "}
                </span>{" "}
                <span className="border-b border-dotted w-115 inline-block"></span>
              </p>
            )
          )}

          {personnel && personnel?.situation_familiale !== "celibat" ? (
            <div className="flex gap-3 items-center">
              <span className="font-semibold">
                {t("personnel.nombre_enfants")}
                {" : "}{" "}
              </span>{" "}
              {personnel?.nombre_enfants
                ? personnel.nombre_enfants
                : rendersBoxes(personnel?.nombre_enfants || "", 1)}
            </div>
          ) : (
            !personnel && (
              <div className="flex gap-3 items-center">
                <span className="font-semibold">
                  {t("personnel.nombre_enfants")}
                  {" : "}{" "}
                </span>{" "}
                {!personnel && rendersBoxes("", 1)}
              </div>
            )
          )}

          <p>
            <span className="font-semibold">
              {t("personnel.observations")}
              {" : "}{" "}
            </span>{" "}
            {personnel && personnel?.observations ? (
              personnel?.observations
            ) : personnel ? (
              <>
                <span className="border-b border-dotted w-97 inline-block"></span>
                <span className="border-b border-dotted w-[95%] inline-block"></span>
                <span className="border-b border-dotted w-[95%] inline-block"></span>
              </>
            ) : (
              <>
                <span className="border-b border-dotted w-104 inline-block"></span>
                <span className="border-b border-dotted w-[95%] inline-block"></span>
                <span className="border-b border-dotted w-[95%] inline-block"></span>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
};

export default FichePersonnel;
