import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Personnel, Preferences, Password } from "../types/personnel";
import axiosClient from "../api/axiosClient";
import { motion } from "framer-motion";
import { Edit, Camera, Lock, Bell } from "lucide-react";
import { useAuth } from "../context/useAuth";
import Alert from "../components/Alert";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import ImageCropper from "../components/ImageCropper";

const ParametresCompte: React.FC = () => {
  // const ParametresCompte: React.FC<{ isMe?: boolean }> = ({ isMe = false }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<Preferences>({
    email_notifications: true,
    sms_notifications: false,
  });
  // const [password, setPassword] = useState<Password | null>(null);
  const { t } = useTranslation();

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { slug } = useParams();
  // recuperer uniquement l'id au debut de 'slug'
  const id = slug?.split("-")[0];
  const isMe = user?.personnel?.id.toString() === id;

  const [valeurActuelle, setValeurActuelle] = useState<Personnel | null>(null);

  const [preferencesActuelles, setPreferencesActuelles] =
    useState<Preferences | null>(null);
  useEffect(() => {
    // if (personnel?.matricule) {
    const url = isMe ? `/personnels/me/` : `/personnels/${id}/`;
    axiosClient
      .get(url)
      .then((res) => {
        setPersonnel(res.data);
        setValeurActuelle(res.data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
    // }

    //  charger les preferences
    axiosClient
      .get(`/auth/preferences/`)
      .then((res) => {
        setPreferences(res.data);
        setPreferencesActuelles(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [id, isMe]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response;
        if (isMe) {
          response = await axiosClient.get("/personnels/me/");
        } else {
          response = await axiosClient.get(`/personnels/${id}/`);
        }
        setPersonnel(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [isMe, id]);

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  //  mise à jour des infos générales
  const pattern = /(ouvrier|ouvrière|administrateur|technicien|assistant)/i;

  const handleProfileSave = async () => {
    // si aucun changement, alors on affiche un message d'erreur si on essai de sauvegarder
    if (
      personnel?.nom === valeurActuelle?.nom &&
      personnel?.prenoms === valeurActuelle?.prenoms &&
      personnel?.telephone === valeurActuelle?.telephone &&
      personnel?.email === valeurActuelle?.email &&
      personnel?.matricule === valeurActuelle?.matricule &&
      personnel?.cin === valeurActuelle?.cin &&
      personnel?.ecole_origine === valeurActuelle?.ecole_origine &&
      // personnel?.role === valeurActuelle?.role &&
      personnel?.grade === valeurActuelle?.grade &&
      personnel?.specialite === valeurActuelle?.specialite &&
      personnel?.date_affectation === valeurActuelle?.date_affectation &&
      personnel?.date_passage_grade === valeurActuelle?.date_passage_grade &&
      personnel?.is_staff === valeurActuelle?.is_staff &&
      personnel?.is_superuser === valeurActuelle?.is_superuser &&
      personnel?.is_active === valeurActuelle?.is_active &&
      personnel?.adresse === valeurActuelle?.adresse &&
      personnel?.ville === valeurActuelle?.ville &&
      personnel?.code_postal === valeurActuelle?.code_postal &&
      personnel?.pays === valeurActuelle?.pays &&
      personnel?.niveau_etudes === valeurActuelle?.niveau_etudes &&
      personnel?.certificats_academiques ===
        valeurActuelle?.certificats_academiques &&
      personnel?.nationalite === valeurActuelle?.nationalite &&
      personnel?.situation_familiale === valeurActuelle?.situation_familiale &&
      personnel?.telephone_mobile === valeurActuelle?.telephone_mobile &&
      personnel?.nombre_enfants === valeurActuelle?.nombre_enfants &&
      personnel?.partenaire === valeurActuelle?.partenaire &&
      personnel?.birthday === valeurActuelle?.birthday &&
      personnel?.lieu_naissance === valeurActuelle?.lieu_naissance
    ) {
      showAlert(t("parametre.errorNoChange"), "error");
      return;
    }

    // verifier si le numeor de telephone est valide (8 chiffres: ex: 12345678 ou 12 34 56 78)
    if (
      !personnel?.telephone?.match(/^\d{8}$/) &&
      !personnel?.telephone?.match(/^\d{2}\s\d{2}\s\d{2}\s\d{2}$/)
    ) {
      showAlert(t("parametre.errorPhone"), "error");
      return;
    }

    if (personnel?.grade && !pattern.test(personnel?.grade)) {
      showAlert(t("personnel.gradeError"), "error");
    }

    // partenaire obligatoire si non celibat ou nombre d'enfants > 0
    if (personnel?.situation_familiale) {
      if (
        personnel?.situation_familiale !== "celibat" ||
        (personnel?.nombre_enfants && personnel?.nombre_enfants > 0)
      ) {
        if (!personnel?.partenaire) {
          showAlert(t("personnel.partenaireObligatoire"), "error");
          return;
        }
      }
    }

    // cin doit avoir 8 alphanumeriques
    if (!personnel?.cin?.match(/^[A-Za-z0-9]{8}$/)) {
      showAlert(t("parametre.cinError"), "error");
    }

    // matricule doit avoir 8 alphanumeriques
    if (!personnel?.matricule?.match(/^[A-Za-z0-9]{8}$/)) {
      showAlert(t("parametre.matriculeError"), "error");
    }

    try {
      const url = isMe ? `/personnels/me/` : `/personnels/${id}/`;
      const playload: Partial<Personnel> = {
        telephone: personnel?.telephone,

        adresse: personnel?.adresse,
        ville: personnel?.ville,
        code_postal: personnel?.code_postal,
        pays: personnel?.pays,
        niveau_etudes: personnel?.niveau_etudes,
        certificats_academiques: personnel?.certificats_academiques,
        nationalite: personnel?.nationalite,
        situation_familiale: personnel?.situation_familiale,
        telephone_mobile: personnel?.telephone_mobile,
        nombre_enfants: personnel?.nombre_enfants,
        partenaire: personnel?.partenaire,
        birthday: personnel?.birthday,
        lieu_naissance: personnel?.lieu_naissance,
      };

      // Ajout des champs supplémentaires uniquement si l'utilisateur est staff
      if (user?.is_superuser) {
        Object.assign(playload, {
          nom: personnel?.nom,
          prenoms: personnel?.prenoms,
          email: personnel?.email,
          cin: personnel?.cin,
          matricule: personnel?.matricule,
          ecole_origine: personnel?.ecole_origine,
          // role: personnel?.role,
          grade: personnel?.grade,
          specialite: personnel?.specialite,
          date_affectation: personnel?.date_affectation,
          date_passage_grade: personnel?.date_passage_grade,
          is_staff: personnel?.is_staff,
          is_active: personnel?.is_active,
          is_superuser: personnel?.is_superuser,
        });
      }

      // filtrer les champs non vides
      const filteredPlayload = Object.fromEntries(
        Object.entries(playload).filter(
          ([, value]) => value !== undefined && value !== null && value !== ""
        )
      );

      const res = await axiosClient.patch(url, filteredPlayload);
      setPersonnel(res.data);
      setValeurActuelle(res.data);
      console.log("données envoyées: ", filteredPlayload);
      showAlert(t("parametre.successProfile"), "success");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          console.log("err.response.data: ", err.response.data);
          const backendMessage =
            err.response.data.message ||
            err.response.data.error ||
            Object.entries(err.response.data)
              .map(
                ([key, value]) =>
                  `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
              )
              .join(" • ") ||
            t("parametre.errorProfile");
          console.log("backendMessage: ", backendMessage);
          showAlert(backendMessage, "error");
        } else {
          showAlert("Impossible de contacter le serveur.", "error");
        }
      }
    }
  };

  // mise à jour de la photo de profil

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedFile, setCroppedFile] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  // Lorsqu'on choisit une photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSavePhoto = async () => {
    if (!croppedFile) {
      showAlert(t("parametre.errorPhotoCrop"), "error");
      return;
    }

    const formData = new FormData();
    formData.append("photo", croppedFile, "profile.jpg");

    try {
      const url = isMe ? `/personnels/update_profile/` : `/personnels/${id}/`;
      const res = await axiosClient.patch(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      setPersonnel(res.data);
      showAlert(t("parametre.successProfile"), "success");
      setShowCropper(false);
      setCroppedFile(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const backendMessage =
            err.response.data.message ||
            err.response.data.error ||
            t("parametre.errorProfile");
          showAlert(backendMessage, "error");
        } else {
          showAlert("Impossible de contacter le serveur.", "error");
        }
      }
    }
  };

  // mise à jour du mot de passe
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Password>();

  const newPassword = watch("new_password");
  const handlePasswordSave = async (data: Password) => {
    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/auth/change-password/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify(data),
        }
      );

      const response = await res.json();
      if (res.ok) {
        showAlert(response.message, "success");
      } else {
        if (response.new_password?.includes("This password is too common.")) {
          showAlert(t("parametre.passwordCommon"), "error");
        } else {
          showAlert(
            response.message ||
              response.detail ||
              response.non_field_errors ||
              response.error ||
              t("parametre.errorPassword"),
            "error"
          );
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          showAlert("Impossible de contacter le serveur.", "error");
        }
      }
    }
  };

  // mise à jour des preferences de notifications
  const handlePreferenceSave = async () => {
    if (preferences === null) {
      return;
    }
    if (
      preferences.email_notifications ===
        preferencesActuelles?.email_notifications &&
      preferences.sms_notifications === preferencesActuelles?.sms_notifications
    ) {
      showAlert(t("parametre.errorNoChange"), "error");
      return;
    }
    try {
      const res = await axiosClient.patch(`/auth/preferences/`, preferences);
      setPreferences(res.data);
      showAlert(t("parametre.successNotifications"), "success");
      setPreferencesActuelles(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const backendMessage =
            err.response.data.message ||
            err.response.data.error ||
            t("parametre.errorNotifications");
          showAlert(backendMessage, "error");
        } else {
          showAlert("Impossible de contacter le serveur.", "error");
        }
      }
    }
  };
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
          &gt; {t("personnel.parametres")} {" : "}
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
            <div className="flex flex-col items-center mb-4 p-4 lg:max-w-[300px] bg-white rounded border border-gray-300 shadow">
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

              <ul className="mt-4 w-full text-sm flex flex-col gap-2">
                {/* les boutons pour les fonctionnalités des paramètres de compte  */}
                <li
                  onClick={() => setActiveTab("profile")}
                  className={`flex flex-row-reverse items-center justify-between cursor-pointer rounded p-2 border-b border-gray-500 ${
                    activeTab === "profile" ? "bg-gray-200" : ""
                  }`}
                >
                  <Edit size={18} /> {t("parametre.profil")}
                </li>
                {isMe && (
                  <li
                    onClick={() => setActiveTab("password")}
                    className={`flex flex-row-reverse items-center justify-between cursor-pointer rounded p-2 border-b border-gray-500 ${
                      activeTab === "password" ? "bg-gray-200" : ""
                    }`}
                  >
                    <Lock size={18} /> {t("parametre.password")}
                  </li>
                )}
                {isMe && (
                  <li
                    onClick={() => setActiveTab("preferences")}
                    className={`flex flex-row-reverse items-center justify-between cursor-pointer rounded p-2 border-b border-gray-500 ${
                      activeTab === "preferences" ? "bg-gray-200" : ""
                    }`}
                  >
                    <Bell size={18} /> {t("parametre.notifications")}
                  </li>
                )}
                <li
                  onClick={() => setActiveTab("photo")}
                  className={`flex items-center justify-between p-2 cursor-pointer rounded border-b border-gray-500 ${
                    activeTab === "photo" ? "bg-gray-200" : ""
                  }`}
                >
                  {t("parametre.photo")}
                  <Camera size={18} />
                </li>
              </ul>
            </div>
          </motion.div>

          {/* right card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 lg:col-span-8"
          >
            {alert && <Alert message={alert.message} type={alert.type} />}

            {activeTab === "profile" ? (
              <div className="border border-gray-400 rounded">
                <div className="bg-gray-500 flex text-white items-center gap-3 px-3 py-2">
                  <Edit size={18} />
                  <h2 className="text-lg font-semibold">
                    {t("parametre.profil")}
                  </h2>
                </div>

                <div className="px-3 py-2 mt-1">
                  <h3 className="text-lg font-semibold ">
                    {t("personnel.infoGenerale")}
                  </h3>
                  <hr className="my-2 border-gray-300" />
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("Matricule")}
                      </label>
                      <input
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-100 focus:border-gray-500"
                        type="text"
                        value={personnel?.matricule}
                        disabled={!user?.is_superuser}
                        placeholder={t("Matricule")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            matricule: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.cin")}
                      </label>
                      <input
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-100 focus:border-gray-500"
                        type="text"
                        value={personnel?.cin}
                        disabled={!user?.is_superuser}
                        placeholder={t("personnel.cin")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            cin: e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* nom, prenoms, telephone, email */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.nom")}
                      </label>
                      <input
                        type="text"
                        disabled={!user?.is_superuser}
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.nom || ""}
                        placeholder={t("personnel.nom")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            nom: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.prenom")}
                      </label>
                      <input
                        type="text"
                        disabled={!user?.is_superuser}
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.prenoms || ""}
                        placeholder={t("personnel.prenom")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            prenoms: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* date de naissance, lieu de naissance */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.dateNaissance")}
                      </label>
                      <input
                        type="date"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.birthday || ""}
                        placeholder={t("personnel.dateNaissance")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            birthday: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.lieuNaissance")}
                      </label>
                      <input
                        type="text"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.lieu_naissance || ""}
                        placeholder={t("personnel.lieuNaissance")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            lieu_naissance: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.telephonePortable")}
                      </label>
                      <input
                        type="tel"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.telephone || ""}
                        placeholder={t("personnel.telephonePortable")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            telephone: e.target.value,
                          })
                        }
                        minLength={8}
                        maxLength={8}
                        // pattern="[1-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}"
                        onInput={(e) => {
                          const input = e.target as HTMLInputElement;
                          const value = input.value.replace(/\D+/g, "");
                          const formattedValue = value.replace(
                            /(\d{2})(\d{2})(\d{2})(\d{2})/,
                            "$1 $2 $3 $4"
                          );
                          input.value = formattedValue;
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.email")}
                      </label>
                      <input
                        type="email"
                        disabled={!user?.is_superuser}
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.email || ""}
                        placeholder={t("personnel.email")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* informations professionnelles */}
                <div className="px-3 py-2 mt-1">
                  <h3 className="text-lg font-semibold ">
                    {t("personnel.infoProfessionnelle")}
                  </h3>
                  <hr className="my-2 border-gray-300" />

                  {!user?.is_staff ? (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <h4 className="font-medium">
                          {t("personnel.specialite")}
                        </h4>
                        <p className="capitalize">{personnel?.specialite}</p>
                      </div>
                      <div className="flex flex-col gap-1 text-sm">
                        <h4 className="font-medium">{t("personnel.grade")}</h4>
                        <p className="capitalize">{personnel?.grade}</p>
                      </div>{" "}
                      <div className="flex flex-col gap-1 text-sm">
                        <h4 className="font-medium">
                          {t("personnel.date_affectation")}
                        </h4>
                        <p>{personnel?.date_affectation}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">
                            {t("personnel.specialite")}
                          </label>
                          <input
                            type="text"
                            className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                            value={personnel?.specialite || ""}
                            placeholder={t("personnel.specialite")}
                            onChange={(e) =>
                              setPersonnel({
                                ...personnel,
                                specialite: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">
                            {t("personnel.grade")}
                            <span className="text-violet-400">
                              {" "}
                              {personnel.grade
                                ? " (" + personnel.grade + ")"
                                : ""}
                            </span>
                          </label>
                          <input
                            type="text"
                            className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                            placeholder={t("personnel.grade")}
                            value={personnel?.grade || ""}
                            onChange={(e) =>
                              setPersonnel({
                                ...personnel,
                                grade: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">
                            {t("personnel.niveau_etudes")}
                          </label>
                          <input
                            type="text"
                            className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                            value={personnel?.niveau_etudes || ""}
                            placeholder={t("personnel.niveau_etudes")}
                            onChange={(e) =>
                              setPersonnel({
                                ...personnel,
                                niveau_etudes: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">
                            {t("personnel.certificats_academiques")}
                          </label>
                          <input
                            type="text"
                            className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                            value={personnel?.certificats_academiques || ""}
                            placeholder={t("personnel.certificats_academiques")}
                            onChange={(e) =>
                              setPersonnel({
                                ...personnel,
                                certificats_academiques: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">
                            {t("personnel.date_affectation")}
                          </label>
                          <input
                            type="date"
                            // maximum date d'aujourd'hui
                            max={new Date().toISOString().split("T")[0]}
                            className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                            value={personnel?.date_affectation || ""}
                            placeholder={t("personnel.date_affectation")}
                            onChange={(e) =>
                              setPersonnel({
                                ...personnel,
                                date_affectation: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">
                            {t("personnel.date_passage_grade")}
                          </label>
                          <input
                            type="date"
                            // maximum date d'aujourd'hui
                            max={new Date().toISOString().split("T")[0]}
                            className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                            value={personnel?.date_passage_grade || ""}
                            placeholder={t("personnel.date_passage_grade")}
                            onChange={(e) =>
                              setPersonnel({
                                ...personnel,
                                date_passage_grade: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* informations de localisation (adresse, pays, ville, code postal, telephone mobile, nationalite) */}
                <div className="px-3 py-2 mt-1">
                  <h3 className="text-lg font-semibold">
                    {t("personnel.infoLocalisation")}
                  </h3>
                  <hr className="my-2 border-gray-300" />

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.pays")}
                      </label>
                      <input
                        type="text"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.pays || ""}
                        placeholder={t("personnel.pays")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            pays: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.ville")}
                      </label>
                      <input
                        type="text"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.ville || ""}
                        placeholder={t("personnel.ville")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            ville: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.adresse")}
                      </label>
                      <input
                        type="text"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.adresse || ""}
                        placeholder={t("personnel.adresse")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            adresse: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.code_postal")}
                      </label>
                      <input
                        type="text"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.code_postal || ""}
                        placeholder={t("personnel.code_postal")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            code_postal: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.telephoneMobile")}
                      </label>
                      <input
                        type="text"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.telephone_mobile || ""}
                        placeholder={t("personnel.telephoneMobile")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            telephone_mobile: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.nationalite")}
                      </label>
                      <input
                        type="text"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        value={personnel?.nationalite || ""}
                        placeholder={t("personnel.nationalite")}
                        onChange={(e) =>
                          setPersonnel({
                            ...personnel,
                            nationalite: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* informations techniques */}
                {user?.is_superuser && (
                  <div className="px-3 py-2 mt-1">
                    <h3 className="text-lg font-semibold ">
                      {t("personnel.infoTechnique")}
                    </h3>
                    <hr className="my-2 border-gray-300" />

                    <div className="mt-6">
                      <div className="flex flex-row-reverse justify-between mt-3 ml-4">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={personnel?.is_superuser}
                            placeholder={t("personnel.is_superuser")}
                            onChange={(e) => {
                              setPersonnel({
                                ...personnel,
                                is_superuser: e.target.checked,
                              });
                            }}
                            // checked={confirmation}
                          />
                          <span>{t("personnel.is_superuser")}</span>
                        </label>

                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={personnel?.is_staff}
                            placeholder={t("personnel.is_staff")}
                            onChange={(e) => {
                              setPersonnel({
                                ...personnel,
                                is_staff: e.target.checked,
                              });
                            }}
                            onClick={() => {
                              if (
                                !confirm(
                                  "vous êtes sûr de modifier ce champ technique ?"
                                )
                              )
                                return;
                            }}
                          />
                          <span>{t("personnel.is_staff")}</span>
                        </label>

                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={personnel?.is_active}
                            placeholder={t("personnel.is_active")}
                            onChange={(e) => {
                              setPersonnel({
                                ...personnel,
                                is_active: e.target.checked,
                              });
                            }}
                            onClick={() => {
                              if (
                                !confirm(
                                  "vous êtes sûr de modifier ce champ technique ?"
                                )
                              )
                                return;
                            }}
                          />
                          <span>{t("personnel.is_active")}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* autres informations */}
                <div className="px-3 py-2 mt-1">
                  <h3 className="text-lg font-semibold">
                    {t("personnel.autresInformations")}
                  </h3>
                  <hr className="my-2 border-gray-300" />

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* situation familiale (celibataire / marie / veuf / divorce), partenaire de mariage, nombre d'enfants */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.situationFamiliale")}
                        {/* {personnel?.situation_familiale || "nn"} */}
                      </label>
                      <select
                        name="situationFamiliale"
                        aria-label={t("personnel.situationFamiliale")}
                        value={personnel?.situation_familiale || ""}
                        onChange={(e) => {
                          setPersonnel({
                            ...personnel,
                            situation_familiale: e.target.value,
                          });
                        }}
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                      >
                        <option value="celibat">{t("celibat")}</option>
                        <option value="marie">{t("marie")}</option>
                        <option value="veuf">{t("veuf")}</option>
                        <option value="divorce">{t("divorce")}</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.partenaire")}
                      </label>
                      <input
                        type="text"
                        name="partenaire"
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        placeholder={t("personnel.partenaire")}
                        value={personnel?.partenaire || ""}
                        onChange={(e) => {
                          setPersonnel({
                            ...personnel,
                            partenaire: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        {t("personnel.nombre_enfants")}
                      </label>
                      <input
                        type="number"
                        name="nombre_enfants"
                        min={0}
                        className="p-2 border text-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                        placeholder={t("personnel.nombre_enfants")}
                        value={
                          personnel?.situation_familiale === "celibat"
                            ? ""
                            : personnel?.nombre_enfants
                        }
                        onChange={(e) => {
                          setPersonnel({
                            ...personnel,
                            nombre_enfants: Number(e.target.value),
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
                {/* le composant alert ici si on a déja scrollé la fenêtre à sa moitié */}
                {alert && window.scrollY > window.innerHeight / 2 && (
                  <Alert message={alert.message} type={alert.type} />
                )}

                {/* buttons de sauvegarde et annulation */}
                <div className="mt-4 py-3 text-sm flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.history.back();
                      setPersonnel(valeurActuelle);
                    }}
                    className="px-5 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors duration-300"
                  >
                    {t("parametre.annuler")}
                  </button>
                  <button
                    type="submit"
                    onClick={handleProfileSave}
                    disabled={loading}
                    className="px-5 py-2 bg-green-500 text-white rounded cursor-pointer hover:bg-green-600 transition-colors duration-300"
                  >
                    {loading ? t("loading") : t("parametre.enregistrer")}
                  </button>
                </div>
              </div>
            ) : activeTab === "photo" ? (
              <div className="border border-gray-400 rounded">
                <div className="bg-gray-500 flex text-white items-center gap-3 px-3 py-2">
                  <Camera size={18} />
                  <h2 className="text-lg font-semibold">
                    {t("parametre.photo")}
                  </h2>
                </div>

                <div className="px-3 py-2 mt-1">
                  <div className="flex flex-col gap-3">
                    {croppedPreview ? (
                      <img
                        src={croppedPreview}
                        alt="Preview"
                        className="w-40 h-40 object-cover rounded"
                      />
                    ) : (
                      personnel?.photo && (
                        <img
                          src={personnel?.photo}
                          alt={personnel?.matricule}
                          className="w-40 h-40 rounded object-cover"
                        />
                      )
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="border text-sm border-gray-300 outline-none rounded bg-gray-50
                          file:mr-4 file:py-2 file:px-4
                          file:text-sm file:font-semibold
                        file:bg-gray-50 file:text-gray-700
                          hover:file:bg-gray-100 file:cursor-pointer
                          file:transition-all file:duration-500"
                      // className="mt-2 border p-2 rounded"
                      placeholder="Ajouter une photo"
                    />

                    {/* Ouverture du cropper */}
                    {showCropper && cropImage && (
                      <ImageCropper
                        imageSrc={cropImage}
                        onClose={() => setShowCropper(false)}
                        onSave={(file, url) => {
                          setCroppedFile(file);
                          setCroppedPreview(url);
                        }}
                      />
                    )}

                    {/* buton de sauvegarde avec le handlePhotoChange */}
                    <button
                      type="button"
                      onClick={handleSavePhoto}
                      className="px-5 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700 transition-colors duration-300"
                    >
                      {t("parametre.save")}
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === "password" ? (
              <div className="border border-gray-400 rounded">
                <div className="bg-gray-500 flex text-white items-center gap-3 px-3 py-2">
                  <Lock size={18} />
                  <h2 className="text-lg font-semibold">
                    {t("parametre.password")}
                  </h2>
                </div>
                <div className="px-3 py-2 mt-1">
                  <h3 className="text-lg font-semibold ">
                    {t("parametre.formulairePassword")}
                  </h3>
                  <hr className="my-2 border-gray-300" />

                  <form
                    onSubmit={handleSubmit(handlePasswordSave)}
                    className="mt-3 flex flex-col gap-2"
                  >
                    <input
                      type="password"
                      className="p-2 border text-sm lg:w-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                      {...register("old_password", { required: true })}
                      placeholder={t("parametre.old_password")}
                    />
                    {errors.old_password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.old_password.message}
                      </p>
                    )}
                    <input
                      type="password"
                      className="p-2 border text-sm lg:w-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                      {...register("new_password", {
                        required: true,
                        validate: {
                          minLength: (value: string) => {
                            if (value.length < 8) {
                              return t("parametre.passwordLength");
                            }
                            return true;
                          },
                          hasLowercase: (value: string) =>
                            /[a-z]/.test(value) ||
                            t("parametre.passwordLowercase"),
                          hasUppercase: (value: string) =>
                            /[A-Z]/.test(value) ||
                            t("parametre.passwordUppercase"),
                          hasNumber: (value: string) =>
                            /[0-9]/.test(value) ||
                            t("parametre.passwordNumber"),
                          hasSpecialCharacter: (value: string) =>
                            /[!@#$%^&*()_+\-={};':"|.<>?]/.test(value) ||
                            t("parametre.passwordSpecialCharacter"),
                          notCommon: (value: string) => {
                            const commonPasswords = [
                              "password",
                              "123456",
                              "12345678",
                              "123456789",
                              "1234567890",
                              "azerty",
                              "qwerty",
                              "admin",
                              "user",
                            ];
                            return (
                              !commonPasswords.includes(value.toLowerCase()) ||
                              t("parametre.passwordCommon")
                            );
                          },
                        },
                      })}
                      placeholder={t("parametre.new_password")}
                    />
                    {errors.new_password && (
                      <p className="text-red-500">
                        {errors.new_password.message}
                      </p>
                    )}
                    <input
                      type="password"
                      className="p-2 border text-sm lg:w-sm border-gray-300 outline-none rounded bg-gray-50 focus:border-gray-500"
                      {...register("confirm_password", {
                        required: true,
                        validate: (value: string) =>
                          value === newPassword ||
                          t("parametre.passwordCorrespond"),
                      })}
                      placeholder={t("parametre.confirm_password")}
                    />
                    {errors.confirm_password && (
                      <p className="text-red-500">
                        {errors.confirm_password.message}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="px-3 py-2 mt-2 lg:w-sm bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition-colors duration-300"
                    >
                      {t("parametre.enregistrer")}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="border border-gray-400 rounded">
                <div className="bg-gray-500 flex text-white items-center gap-3 px-3 py-2">
                  <Bell size={18} />
                  <h2 className="text-lg font-semibold">
                    {t("parametre.notifications")}
                  </h2>
                </div>
                <div className="px-3 py-2 mt-1">
                  <h3 className="text-lg font-semibold">
                    {t("parametre.preferenceNotifications")}
                  </h3>
                  <hr className="my-2 border-gray-300" />

                  <label className="flex items-center gap-2 mb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={preferences.email_notifications}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          email_notifications: e.target.checked,
                        })
                      }
                      placeholder="notification"
                    />
                    <span>{t("parametre.emailNotifications")}</span>
                  </label>

                  <label className="flex items-center gap-2 mb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={preferences.sms_notifications}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          sms_notifications: e.target.checked,
                        })
                      }
                      placeholder="notification"
                    />
                    <span>{t("parametre.smsNotifications")}</span>
                  </label>

                  <button
                    type="submit"
                    onClick={handlePreferenceSave}
                    className="px-3 py-2 mt-2 bg-purple-500 text-white rounded cursor-pointer hover:bg-purple-600 transition-colors duration-300"
                  >
                    {t("parametre.enregistrer")}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ParametresCompte;
