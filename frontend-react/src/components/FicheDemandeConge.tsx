import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import HeaderOfficielTN from "./HeaderOfficielTN";
import LigneFiche from "./LigneFiche";
import { exportPdf } from "./PdfExportButton";
import type { Personnel } from "../types/personnel";
import type { DemandeConge } from "../api/conge_api";
import { fetchMesConges } from "../api/conge_api";
import rendersBoxes from "./rendersBoxes";
import { useParams } from "react-router-dom";
type FicheProps = {
  personnel: Personnel | null;
};

const FicheDemandeConge: React.FC<FicheProps> = ({ personnel }) => {
  // export const DemandeConge = ({ personnel }: { personnel: Personnel }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [demandes, setDemandes] = useState<DemandeConge[]>([]);

  const today = new Date().toLocaleDateString("fr-FR");

  const { slug } = useParams(); // slug vient de l'URL : "2-Jadelle-Katy"
  // extraire id depuis slug (si présent)
  const personnelIdFromUrl = slug ? Number(slug.split("-")[0]) : undefined;

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) return;

    let mounted = true;

    fetchMesConges(access, personnelIdFromUrl)
      .then((conges) => {
        if (!mounted) return;
        // si on a des conges -> prendre demandes du premier conge (ou choisir la logique)
        if (Array.isArray(conges) && conges.length > 0) {
          setDemandes(
            Array.isArray(conges[0].demandes) ? conges[0].demandes : [],
          );
        } else {
          setDemandes([]);
        }
      })
      .catch((e) => {
        console.error(e);
        // setErr(String(e));
      });
    // .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [slug]);

  const last_demande = demandes[0];

  return (
    <section className="p-4">
      <div className="flex justify-end mb-4">
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 disabled:bg-green-400"
          onClick={() =>
            exportPdf(
              ref as React.RefObject<HTMLDivElement>,
              `demande_conge_${personnel?.nom || ""}_${personnel?.prenoms || ""}.pdf`,
            )
          }
        >
          {t("exportPersonnel.export")}
        </button>
      </div>

      <div
        ref={ref}
        className="p-4 text-black max-w-3xl mx-auto pb-20 text-sm md:text-base"

        // className="bg-white text-black p-6 w-[210mm] min-h-[297mm] space-y-10"
      >
        {" "}
        <HeaderOfficielTN />
        <div className="flex justify-center items-center mb-4">
          <p className="w-1/2 border-2" />
        </div>
        {/* titre */}
        <h2 className="font-bold text-center mb-6 italic text-base md:text-lg">
          {t("demande.conge")}
        </h2>
        {/* matricule */}
        <div className="mb-4 flex items-center gap-4">
          <p className="mb-1">
            <span className="font-semibold">
              {t("matricule")}
              {" : "}{" "}
            </span>
          </p>
          {last_demande
            ? rendersBoxes(
                last_demande.personnel.matricule || "",
                last_demande.personnel.matricule?.length || 8,
              )
            : rendersBoxes("", 8)}
        </div>
        <LigneFiche
          label={t("names")}
          value={
            personnel ? personnel.nom + " " + personnel.prenoms : undefined
          }
        />
        <LigneFiche label={t("personnel.grade")} value={personnel?.grade} />
        <LigneFiche label={t("demande.lieuTravail")} value={t("fsg")} />
        <LigneFiche label={t("demandeConge.type")} />
        <LigneFiche label={t("conge.du")} />
        <LigneFiche label={t("conge.au")} />
        <LigneFiche label={t("adressePostale")} value={personnel?.adresse} />
        <LigneFiche
          label={t("personnel.telephone")}
          value={personnel?.telephone}
        />
        <div className="mt-10 flex justify-between items-end" dir="ltr">
          <p>{t("gabes") + ", " + today}</p>

          <p className="font-semibold">{t("signature")}</p>

          <div className="border border-gray-400 p-4 w-60 h-40 pb-10">
            <p className="font-semibold text-center mb-2">{t("avisChef")}</p>
            {/* <div className="space-y-3"> */}
            <span className="border-b border-dotted w-full inline-block"></span>
            <span className="border-b border-dotted w-full inline-block"></span>
            <span className="border-b border-dotted w-full inline-block"></span>
            <span className="border-b border-dotted w-full inline-block"></span>
            {/* </div> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FicheDemandeConge;
