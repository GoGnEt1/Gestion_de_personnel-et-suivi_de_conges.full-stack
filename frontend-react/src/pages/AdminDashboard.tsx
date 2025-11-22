import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Briefcase,
  Upload,
  Import,
  FileSpreadsheet,
  User,
  Clock,
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
  const location = useLocation();
  const success = location.state?.success || false;
  const [visible, setVisible] = useState(true);
  const [personnel, setPersonnel] = useState<Personnel | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

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
        personnel?.prenoms || "user"
      )}`,
    [personnel]
  );
  // cards pour le dashboard de l'admin, gerer les conges (voir les congés, demandes de conges pour valider ou refuser, etc); gérer des personnels (CRUD)
  const cards: Card[] = [
    // ajout de personnel
    {
      link: "ajout-personnel",
      title: "AjoutPersonnel",
      icon: <User className="w-10 h-10" />,
      color: "bg-amber-500",
    },
    {
      link: `historique-conges/${personnel?.id}-${slugi}`,
      title: "MonHistoriqueConges",
      icon: <Clock className="w-10 h-10" />,
      color: "bg-blue-500",
    },
    {
      link: "demande-conges-form",
      title: "DemandeCongesForm",
      icon: <ClipboardList className="w-10 h-10" />,
      color: "bg-green-500",
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
    // mon compte
    {
      link: `personnel/${personnel?.id}-${slugi}`,
      title: "MonCompte",
      icon: <User className="w-10 h-10" />,
      color: "bg-fuchsia-500",
    },
  ];

  return (
    <div>
      {success && visible && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {cards.map((card, index) => (
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
    </div>
  );
};

export default AdminDashboard;
