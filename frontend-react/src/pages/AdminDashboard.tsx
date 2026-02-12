import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Briefcase,
  Upload,
  Import,
  FileSpreadsheet,
  User,
  Users,
  Clock,
  File,
} from "lucide-react";

import { slugify } from "../utils/slugify";
import type { Personnel } from "../types/personnel";
import axiosClient from "../api/axiosClient";

type Card = {
  link: string;
  title: string;
  icon: React.ReactNode;
  color: string;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<Personnel | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await axiosClient.get("/personnels/me/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });
        setPersonnel(response.data);
      } catch (error) {
        console.error("Error fetching personnel:", error);
      }
    };

    fetchPersonnel();
  }, []);

  // slugi recalculé uniquement quand personnel change
  const slugi = useMemo(
    () =>
      `${slugify(personnel?.nom || "unknown")}-${slugify(
        personnel?.prenoms || "user",
      )}`,
    [personnel],
  );
  // cards pour le dashboard de l'admin, gerer les conges (voir les congés, demandes de conges pour valider ou refuser, etc); gérer des personnels (CRUD)
  const cards_admin: Card[] = [
    // ajout de personnel
    {
      link: "ajout-personnel",
      title: "AjoutPersonnel",
      icon: <Users className="w-10 h-10" />,
      color: "bg-amber-500",
    },
    // gestion des conges
    {
      link: "list-conges",
      title: "listConges",
      icon: <ClipboardList className="w-10 h-10" />,
      color: "bg-blue-500",
    },
    {
      link: "list-demandes",
      title: "GestionDemandesConges",
      icon: <BookOpen className="w-10 h-10" />,
      color: "bg-green-500",
    },
    // gestion des personnels
    {
      link: "list-personnels",
      title: "listPersonnels",
      icon: <Briefcase className="w-10 h-10" />,
      color: "bg-sky-500",
    },
    // règle de conges
    {
      link: "regle-conges",
      title: "GestionReglesConges",
      icon: <ClipboardList className="w-10 h-10" />,
      color: "bg-pink-500",
    },
    // importatoin de conges
    {
      link: "import-conges",
      title: "ImportConges",
      icon: <Import className="w-10 h-10" />,
      color: "bg-yellow-500",
    },
    {
      link: "fiche-instruction",
      title: "ficheInstruction",
      icon: <Upload className="w-10 h-10" />,
      color: "bg-orange-500",
    },
    {
      link: "modifie-conges",
      title: "ModofieConges",
      icon: <FileSpreadsheet className="w-10 h-10" />,
      color: "bg-violet-500",
    },
  ];

  // espace personnel
  const cards_perso: Card[] = [
    {
      link: `historique-conges/${personnel?.id}-${slugi}`,
      title: "MonHistoriqueConges",
      icon: <Clock className="w-10 h-10" />,
      color: "bg-blue-500",
    },
    {
      // link: "demande-conges-form",
      // title: "DemandeCongesForm",
      link: "demandes-en-ligne",
      title: "DemandesEnLigne",
      icon: <ClipboardList className="w-10 h-10" />,
      color: "bg-green-500",
    },
    // mes demandes de congés
    {
      link: "mes-demandes-conges",
      title: "MesDemandesConges",
      icon: <File className="w-10 h-10" />,
      color: "bg-gray-500",
    },
    // mon compte
    {
      link: `personnel/${personnel?.id}-${slugi}`,
      title: "MonCompte",
      icon: <User className="w-10 h-10" />,
      color: "bg-fuchsia-500",
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">
        {t(`dasboard.cards.EspaceAdmin`)}
        <hr className="ml-2 mb-1 inline-block w-[40%] lg:w-3/5 border border-gray-300 rounded-lg shadow-md bg-gray-50" />
      </h1>
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {cards_admin.map((card, index) => (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className={`p-6 rounded-xl shadow text-white h-35 lg:h-40 flex flex-col justify-between hover:shadow-md transition ${card.color}`}
            onClick={() => navigate(card.link)}
            key={index}
          >
            {/* <div className="flex items-center mb-2"> */}
            <div className="mr-2">{card.icon}</div>
            <h2
              className="text-sm lg:text-text-base font-semibold cursor-pointer"
              onClick={() => navigate(card.link)}
            >
              {t(`dasboard.cards.${card.title}`)}
            </h2>
            {/* </div> */}
          </motion.div>
        ))}
      </motion.main>

      <h1 className="text-2xl font-semibold mb-4 mt-8">
        {t(`dasboard.cards.EspacePersonnel`)}
        <hr className="ml-2 mb-1 inline-block w-[40%] lg:w-3/5 border border-gray-300 rounded-lg shadow-md bg-gray-50" />
      </h1>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {cards_perso.map((card, index) => (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className={`p-6 rounded-xl shadow text-white h-35 lg:h-40 flex flex-col justify-between hover:shadow-md transition ${card.color}`}
            onClick={() => navigate(card.link)}
            key={index}
          >
            <div className="mr-2">{card.icon}</div>
            <h2
              className="text-sm lg:text-text-base font-semibold cursor-pointer"
              onClick={() => navigate(card.link)}
            >
              {t(`dasboard.cards.${card.title}`)}
            </h2>
          </motion.div>
        ))}
      </motion.main>
    </div>
  );
};

export default AdminDashboard;
