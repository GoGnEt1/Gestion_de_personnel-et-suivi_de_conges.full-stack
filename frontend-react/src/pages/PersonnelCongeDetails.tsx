import React, { useState, useEffect } from "react";
import type { Conge, DemandeConge } from "../api/conge_api";
import { fetchMesConges } from "../api/conge_api";
import { useTranslation } from "react-i18next";
// import { slugify } from "../utils/slugify";
import { useParams } from "react-router-dom";

const PersonnelCongeDetails: React.FC = () => {
  const [conges, setConges] = useState<Conge[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [demandes, setDemandes] = useState<DemandeConge[]>([]);

  const { t } = useTranslation();
  const { slug } = useParams(); // slug vient de l'URL : "2-Jadelle-Katy"
  // extraire id depuis slug (si présent)
  const personnelIdFromUrl = slug ? Number(slug.split("-")[0]) : undefined;

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) return;

    let mounted = true;
    setLoading(true);

    fetchMesConges(access, personnelIdFromUrl)
      .then((conges) => {
        if (!mounted) return;
        setConges(conges);
        console.log("conges", conges);
        // si on a des conges -> prendre demandes du premier conge (ou choisir la logique)
        if (Array.isArray(conges) && conges.length > 0) {
          setDemandes(
            Array.isArray(conges[0].demandes) ? conges[0].demandes : []
          );
        } else {
          setDemandes([]);
        }
      })
      .catch((e) => {
        console.error(e);
        setErr(String(e));
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) return <div className="p-4 animate-pulse">Chargement…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!conges.length) return <div className="p-4">Aucun congé trouvé</div>;

  const conge = conges[0];
  const demande = demandes[0];
  const rows: Array<[string, string | number]> = [
    ["matricule", conge.personnel.matricule],
    [
      `restantConge ${new Date().getFullYear()}`,
      Math.round(conge.conge_restant_annee_courante),
    ],
    [
      `restantConge ${new Date().getFullYear() - 1}`,
      Math.round(conge.conge_restant_annee_n_1),
    ],
    [
      `restantConge ${new Date().getFullYear() - 2}`,
      Math.round(conge.conge_restant_annee_n_2),
    ],
    ["totalConge", Math.round(conge.conge_total)],
    // ["quotaMensuel", conge.quota_mensuel],
    [
      "resteCumules",
      Object.values(conge.conge_mensuel_restant || {}).reduce(
        (acc, val) => acc + Number(val || 0),
        0
      ),
    ],

    ["conge_compasatoire", Math.round(conge.conge_compasatoire)],
    ["conge_exceptionnel", Math.round(conge.conge_exceptionnel)],
  ];
  console.log("resteCumules: ", conge.conge_mensuel_restant || 0);

  return (
    <section className="p4">
      <div className="mx-auto max-w-3xl bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t("congeDetails.title") +
            " " +
            conge.personnel.nom +
            " " +
            conge.personnel.prenoms}
        </h2>

        <fieldset className="border border-gray-300 p-0 rounded-lg overflow-hidden">
          <legend className="sr-only">Détails du congé</legend>

          <table className="w-full">
            <tbody className="divide-y divide-gray-100">
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    {t(label.split(" ")[0]) + " " + label.split(" ").slice(1)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    {String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </fieldset>

        {/* dernière demande de conge si conge_demande != null et conge_demande != 0 et son statut, sa periode */}
        {
          // conge.demandes &&
          demande && demande.conge_demande && demande.conge_demande !== 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">
                {t("congeDetails.lastDemande")}
              </h2>
              <div className="flex items-center justify-between px-4 py-2 border-b-0 last:border-b">
                <h3 className="text-sm font-medium mb-2 text-gray-700">
                  {t("congeDetails.congeDemande")}
                </h3>
                <p className="text-sm font-medium text-gray-700">
                  {demande.conge_demande}
                </p>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b-0 last:border-b">
                <h3 className="text-sm font-medium mb-2 text-gray-700">
                  {t("congeDetails.periode")}
                </h3>
                <p className="text-sm font-medium text-gray-700">
                  {demande.periode}
                </p>
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-b-0 last:border-b">
                <h3 className="text-sm font-medium mb-2 text-gray-700">
                  {t("congeDetails.statut")}
                </h3>
                {demande.annule ? (
                  <p className="text-sm text-red-400">{t(`statut.annule`)}</p>
                ) : (
                  <span
                    className={
                      demande.statut === "en_attente"
                        ? "text-yellow-700"
                        : demande.statut === "valide"
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {t(`statut.${demande.statut}`)}
                  </span>
                )}
              </div>
              {/* date de validation en utilisant new Date(conges.date_validation).toLocaleDateString() */}
              {demande.statut === "valide" && (
                <div className="flex items-center justify-between px-4 py-2 border-b-0 last:border-b">
                  <h3 className="text-sm font-medium mb-2 text-gray-700">
                    {t("congeDetails.dateValidation")}
                  </h3>
                  <p className="text-sm font-medium text-gray-700">
                    {demande.date_validation &&
                      new Date(demande.date_validation).toLocaleString(
                        "fr-FR",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        }
                      )}
                  </p>
                </div>
              )}
            </div>
          )
        }
      </div>
    </section>
  );
};

export default PersonnelCongeDetails;
