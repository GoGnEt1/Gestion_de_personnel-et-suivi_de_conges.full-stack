import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Personnel } from "../types/personnel";
import axiosClient from "../api/axiosClient";
import { Settings } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { slugify } from "../utils/slugify";
import { useParams, useNavigate } from "react-router-dom";

import FichePersonnel from "../components/FichePersonnel";

import PersonnelMedia from "../components/PersonnelMedia";

const PersonnelDetails: React.FC = () => {
  // const PersonnelDetails: React.FC<{ isMe?: boolean }> = ({ isMe = false }) => {
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"info" | "medias" | "fiche">(
    "info"
  );
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  //   const { id } = useParams<{ id: string }>();
  const { slug } = useParams();
  // recuperer uniquement l'id au debut de 'slug'
  const id = slug?.split("-")[0];
  const isMe = user?.personnel?.id.toString() === id;
  console.log(user?.personnel?.id.toString(), id);
  const slugi =
    slugify(personnel?.nom || "") + "-" + slugify(personnel?.prenoms || "");
  console.log("is_superuser: ", user);
  useEffect(() => {
    setLoading(true);

    const url = isMe ? `/personnels/me/` : `/personnels/${id}/`;
    axiosClient
      .get(url)
      .then((res) => {
        setPersonnel(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isMe]);

  if (loading) {
    return <div className="p-6">{t("loading")}</div>;
  }
  if (!personnel) {
    return (
      <div className="p-6">
        <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow p-4 h-72 animate-pulse"></div>
            <div className="bg-white rounded-2xl shadow p-4 h-40 animate-pulse"></div>
            <div className="bg-white rounded-2xl shadow p-4 h-40 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 bg-white rounded-xl shadow">
        <div className="text-sm text-gray-500 border-b-4 border-gray-200 py-2 px-4 z-50 ">
          <button
            onClick={() => window.history.back()}
            type="button"
            className="cursor-pointer hover:underline"
          >
            {t("personnel.acceuil")}
          </button>{" "}
          &gt; {t("personnel.detail")} {" : "}
          <span className="font-semibold">
            {personnel.prenoms?.charAt(0).toUpperCase() +
              (personnel.prenoms?.slice(1).toLowerCase() || "")}{" "}
            {personnel.nom?.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* left card */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className=" p-6 lg:col-span-4"
          >
            <div className="flex flex-col items-center mb-4 p-4 lg:max-w-[250px] bg-white rounded border border-gray-300 shadow">
              <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-400">
                {personnel.photo ? (
                  <img
                    //   src="/src/assets/profile.jpg"
                    src={personnel.photo}
                    alt={personnel.prenoms}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 rounded-full text-5xl text-gray-400">
                    {personnel.prenoms?.charAt(0).toUpperCase() || ""}
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-semibold mt-4 text-center">
                {personnel.prenoms?.charAt(0).toUpperCase() +
                  (personnel.prenoms?.slice(1).toLowerCase() || "")}{" "}
                {personnel.nom?.toUpperCase()}
              </h2>

              <div className="mt-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      personnel.is_active ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  <span className="font-medium text-gray-700">
                    {personnel.is_active
                      ? t("personnel.actif")
                      : t("personnel.inactif")}
                  </span>
                </div>
              </div>

              <div className="mt-4 w-full text-left flex flex-col gap-3">
                <p className="text-sm text-gray-500">
                  <strong>
                    {t("personnel.grade")}
                    {" : "}{" "}
                  </strong>{" "}
                  {personnel.grade?.charAt(0).toUpperCase() +
                    (personnel.grade?.slice(1).toLowerCase() || "")}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>
                    {t("personnel.role")}
                    {" : "}{" "}
                  </strong>{" "}
                  {personnel.role ? personnel.role : "non_renseigne"}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>
                    {t("personnel.specialite")}
                    {" : "}{" "}
                  </strong>{" "}
                  {personnel.specialite}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>
                    {t("personnel.ecole_origine")}
                    {" : "}{" "}
                  </strong>{" "}
                  {personnel.ecole_origine}
                </p>

                <hr className="border-gray-400" />

                <button
                  onClick={() => {
                    if (user?.is_staff) {
                      navigate(
                        `/dashboard/admin/parametres-compte/${personnel.id}-${slugi}`
                      );
                    } else {
                      navigate(
                        `/dashboard/user/parametres-compte/${personnel.id}-${slugi}`
                      );
                    }
                  }}
                  type="button"
                  className="flex items-center gap-2 text-gray-900 cursor-pointer hover:text-blue-700"
                >
                  <Settings className="w-5 h-5 mr-2 text-blue-500" />
                  {t("personnel.parametres")}
                </button>
              </div>
            </div>
          </motion.div>

          {/* right card */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8"
          >
            <div>
              <div className="border-b px-6 py-3">
                <nav className="flex gap-4">
                  <button
                    onClick={() => setActiveTab("info")}
                    type="button"
                    className={`py-2 px-3 ${
                      activeTab === "info"
                        ? "text-blue-600 border-b-2 border-blue-500"
                        : "text-gray-600"
                    }`}
                  >
                    {t("personnel.infoGenerale")}
                  </button>
                  <button
                    onClick={() => setActiveTab("medias")}
                    type="button"
                    className={`py-2 px-3 ${
                      activeTab === "medias"
                        ? "text-blue-600 border-b-2 border-blue-500"
                        : "text-gray-600"
                    }`}
                  >
                    {t("personnel.medias")}
                  </button>
                  {user?.is_staff && (
                    <button
                      onClick={() => setActiveTab("fiche")}
                      type="button"
                      className={`py-2 px-3 ${
                        activeTab === "fiche"
                          ? "text-blue-600 border-b-2 border-blue-500"
                          : "text-gray-600"
                      }`}
                    >
                      {t("personnel.fiche")}
                    </button>
                  )}
                </nav>
              </div>

              <div className="">
                {activeTab === "info" && (
                  <div className="bg-white rounded border border-gray-300 shadow p-6 ">
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-2 border-gray-300">
                          {t("personnel.infoPersonnelle")}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p>
                            <strong>
                              {t("personnel.prenom")} {" : "}{" "}
                            </strong>{" "}
                            {personnel.prenoms}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.nom")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.nom}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.cin")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.cin}
                          </p>
                          <p>
                            <strong>
                              {t("matricule")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.matricule}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.nationalite")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.nationalite}
                          </p>
                          {personnel.birthday && (
                            <p>
                              <strong>
                                {t("personnel.birthday")}
                                {" : "}{" "}
                              </strong>{" "}
                              {new Date(`${personnel.birthday}`).toDateString()}{" "}
                              {" à "} {personnel.lieu_naissance}
                            </p>
                          )}
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 mt-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-2 border-gray-300">
                          {t("personnel.infoProfessionnelle")}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p>
                            <strong>
                              {t("personnel.grade")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.grade?.charAt(0).toUpperCase() +
                              (personnel.grade?.slice(1).toLowerCase() || "")}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.specialite")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.specialite}
                          </p>
                          {personnel.niveau_etudes && (
                            <p>
                              <strong>
                                {t("personnel.niveau_etudes")}
                                {" : "}{" "}
                              </strong>{" "}
                              {personnel.niveau_etudes}
                            </p>
                          )}
                          {personnel.certificats_academiques && (
                            <p>
                              <strong>
                                {t("personnel.certificats_academiques")}
                                {" : "}{" "}
                              </strong>{" "}
                              {personnel.certificats_academiques}
                            </p>
                          )}
                          <p>
                            <strong>
                              {t("personnel.ecole_origine")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.ecole_origine}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.date_affectation")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.date_affectation}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.date_passage_grade")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.date_passage_grade || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 mt-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-2 border-gray-300">
                          {t("personnel.infoContact")}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p>
                            <strong>
                              {t("personnel.email")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.email}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.telephone")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.telephone}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.telephone_mobile")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.telephone_mobile}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 mt-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-2 border-gray-300">
                          {t("personnel.infoLocalisation")}
                        </h3>
                        <div className="grid grid-cols-2 space-y-2 text-sm text-gray-700">
                          <p>
                            <strong>
                              {t("personnel.pays")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.pays}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.ville")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.ville}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.adresse")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.adresse}
                          </p>
                          <p>
                            <strong>
                              {t("personnel.code_postal")}
                              {" : "}{" "}
                            </strong>{" "}
                            {personnel.code_postal}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "medias" && (
                  <PersonnelMedia
                    personnel={personnel}
                    setPersonnel={setPersonnel}
                  />
                  // <div className="p-6">
                  //   <h3 className="text-lg font-semibold mb-3">
                  //     {t("personnel.medias")}
                  //   </h3>
                  //   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  //     {[
                  //       {
                  //         label: "personnel.pv_affectation",
                  //         url: personnel.pv_affectation,
                  //       },
                  //       { label: "personnel.cv", url: personnel.cv },
                  //       {
                  //         label: "personnel.decret_officiel",
                  //         url: personnel.decret_officiel,
                  //       },
                  //       {
                  //         label: "personnel.fiche_fonction",
                  //         url: personnel.fiche_fonction,
                  //       },
                  //       {
                  //         label: "personnel.fiche_module_fr",
                  //         url: personnel.fiche_module_fr,
                  //       },
                  //       {
                  //         label: "personnel.fiche_module_en",
                  //         url: personnel.fiche_module_en,
                  //       },
                  //     ].map((items, index) => (
                  //       <div
                  //         key={index}
                  //         className="border rounded p-3 items-center justify-between border-gray-400 hover:border-blue-300"
                  //       >
                  //         <div>
                  //           <div className="font-medium">
                  //             {t(`${items.label}`)}
                  //           </div>
                  //           <div className="text-sm text-gray-500">
                  //             {items.url
                  //               ? items.url.split("/").pop()
                  //               : `${t("personnel.noFile")}`}
                  //           </div>
                  //         </div>
                  //         <div>
                  //           {items.url ? (
                  //             <a
                  //               href={items.url}
                  //               target="_blank"
                  //               rel="noreferrer"
                  //               className="text-blue-500 hover:underline"
                  //             >
                  //               {t("personnel.download")}
                  //             </a>
                  //           ) : null}
                  //         </div>
                  //       </div>
                  //     ))}
                  //   </div>
                  // </div>
                )}

                {activeTab === "fiche" && personnel && (
                  <div>
                    <FichePersonnel personnel={personnel} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelDetails;
