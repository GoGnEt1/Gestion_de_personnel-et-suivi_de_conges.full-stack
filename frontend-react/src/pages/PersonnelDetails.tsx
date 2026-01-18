import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Personnel } from "../types/personnel";
import axiosClient from "../api/axiosClient";
import {
  Settings,
  User,
  IdCard,
  Globe,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  GraduationCap,
  School,
  Landmark,
  Info,
  Folders,
  FileText,
  Building2,
  ShieldCheck,
  Locate,
  Barrel,
  ShieldX,
  CalendarPlus,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { slugify } from "../utils/slugify";
import { useParams, useNavigate } from "react-router-dom";

import FichePersonnel from "../components/FichePersonnel";

import PersonnelMedia from "../components/PersonnelMedia";

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  // icon: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 text-sm text-gray-700">
    <Icon className="w-4 h-4 font-semibold" />
    <strong>{label} :</strong>
    <span className="font-medium -ml-1">{value}</span>
  </div>
);

const PersonnelDetails: React.FC = () => {
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
  const slugi =
    slugify(personnel?.nom || "") + "-" + slugify(personnel?.prenoms || "");
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

              <div className="mt-3 text-sm gap-2 items-center">
                {personnel.is_active ? (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-green-500 w-4 h-4" />
                    <span className="font-medium text-gray-700">
                      {t("personnel.actif")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldX className="text-red-500 w-4 h-4" />
                    <span className="font-medium text-gray-700">
                      {t("personnel.inactif")}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 w-full text-left flex flex-col gap-3">
                {personnel.grade && (
                  <InfoRow
                    icon={Landmark}
                    label={t("personnel.grade")}
                    value={personnel.grade}
                  />
                )}
                {personnel.role && (
                  <InfoRow
                    icon={User}
                    label={t("personnel.role")}
                    value={personnel.role}
                  />
                )}
                {personnel.specialite && (
                  <InfoRow
                    icon={GraduationCap}
                    label={t("personnel.specialite")}
                    value={personnel.specialite}
                  />
                )}
                {personnel.ecole_origine && (
                  <InfoRow
                    icon={Building2}
                    label={t("personnel.ecole_origine")}
                    value={personnel.ecole_origine}
                  />
                )}

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
                    className={`py-2 px-3 flex items-center gap-2 ${
                      activeTab === "info"
                        ? "text-blue-600 border-b-2 border-blue-500"
                        : "text-gray-600"
                    }`}
                  >
                    <Info className="w-5 h-5" />
                    {t("personnel.infoGenerale")}
                  </button>
                  <button
                    onClick={() => setActiveTab("medias")}
                    type="button"
                    className={`py-2 px-3 flex items-center gap-2 ${
                      activeTab === "medias"
                        ? "text-blue-600 border-b-2 border-blue-500"
                        : "text-gray-600"
                    }`}
                  >
                    <Folders className="w-5 h-5" />
                    {t("personnel.medias")}
                  </button>
                  {user?.is_staff && (
                    <button
                      onClick={() => setActiveTab("fiche")}
                      type="button"
                      className={`py-2 px-3 flex items-center gap-2 ${
                        activeTab === "fiche"
                          ? "text-blue-600 border-b-2 border-blue-500"
                          : "text-gray-600"
                      }`}
                    >
                      <FileText className="w-5 h-5" />
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
                        <div className="space-y-3">
                          <InfoRow
                            icon={User}
                            label={t("names")}
                            value={personnel.prenoms + " " + personnel.nom}
                          />
                          <InfoRow
                            icon={IdCard}
                            label={t("personnel.cin")}
                            value={personnel.cin}
                          />
                          <InfoRow
                            icon={IdCard}
                            label={t("matricule")}
                            value={personnel.matricule}
                          />
                          <InfoRow
                            icon={Globe}
                            label={t("personnel.nationalite")}
                            value={personnel.nationalite}
                          />
                          {personnel.birthday && (
                            <InfoRow
                              icon={Calendar}
                              label={t("personnel.birthday")}
                              value={
                                new Date(
                                  `${personnel.birthday}`
                                ).toDateString() +
                                " à " +
                                personnel.lieu_naissance
                              }
                            />
                          )}
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 mt-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-2 border-gray-300">
                          {t("personnel.infoProfessionnelle")}
                        </h3>
                        <div className="space-y-3">
                          {personnel.grade && (
                            <InfoRow
                              icon={Landmark}
                              label={t("personnel.grade")}
                              value={
                                personnel.grade?.charAt(0).toUpperCase() +
                                (personnel.grade?.slice(1).toLowerCase() || "")
                              }
                            />
                          )}
                          {personnel.specialite && (
                            <InfoRow
                              icon={GraduationCap}
                              label={t("personnel.specialite")}
                              value={personnel.specialite}
                            />
                          )}
                          {personnel.niveau_etudes && (
                            <InfoRow
                              icon={School}
                              label={t("personnel.niveau_etudes")}
                              value={personnel.niveau_etudes}
                            />
                          )}

                          {personnel.certificats_academiques && (
                            <InfoRow
                              icon={Briefcase}
                              label={t("personnel.certificats_academiques")}
                              value={personnel.certificats_academiques}
                            />
                          )}
                          <InfoRow
                            icon={Building2}
                            label={t("personnel.ecole_origine")}
                            value={personnel.ecole_origine || "FSG"}
                          />
                          <InfoRow
                            icon={Calendar}
                            label={t("personnel.date_affectation")}
                            value={personnel.date_affectation}
                          />
                          <InfoRow
                            icon={CalendarPlus}
                            label={t("personnel.date_passage_grade")}
                            value={personnel.date_passage_grade || "-"}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 mt-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-2 border-gray-300">
                          {t("personnel.infoContact")}
                        </h3>
                        <div className="space-y-3">
                          <InfoRow
                            icon={Mail}
                            label={t("personnel.email")}
                            value={personnel.email}
                          />
                          {personnel.telephone && (
                            <InfoRow
                              icon={Phone}
                              label={t("personnel.telephone")}
                              value={personnel.telephone}
                            />
                          )}
                          {personnel.telephone_mobile && (
                            <InfoRow
                              icon={Phone}
                              label={t("personnel.telephone_mobile")}
                              value={personnel.telephone_mobile}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 mt-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-2 border-gray-300">
                          {t("personnel.infoLocalisation")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <InfoRow
                            icon={Locate}
                            label={t("personnel.ville")}
                            value={personnel.ville}
                          />
                          {personnel.code_postal && (
                            <InfoRow
                              icon={Barrel}
                              label={t("personnel.code_postal")}
                              value={personnel.code_postal}
                            />
                          )}

                          {personnel.adresse && (
                            <InfoRow
                              icon={MapPin}
                              label={t("personnel.adresse")}
                              value={personnel.adresse}
                            />
                          )}
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
