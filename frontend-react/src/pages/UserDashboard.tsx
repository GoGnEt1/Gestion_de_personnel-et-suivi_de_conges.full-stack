import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { User, ClipboardList, Clock, File } from "lucide-react";
import { slugify } from "../utils/slugify";
import type { Personnel } from "../types/personnel";
import axiosClient from "../api/axiosClient";

type Card = {
  link: string;
  title: string;
  icon: React.ReactNode;
  color: string;
};

const UserDashboard: React.FC = () => {
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
        personnel?.prenoms || "user"
      )}`,
    [personnel]
  );
  const cards: Card[] = [
    {
      link: "historique-conges",
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
    {
      link: "mes-demandes-conges",
      title: "MesDemandesConges",
      icon: <File className="w-10 h-10" />,
      color: "bg-gray-500",
    },
    {
      link: `mon-profil/${personnel?.id}-${slugi}`,
      title: "MonProfil",
      icon: <User className="w-10 h-10" />,
      color: "bg-teal-500",
    },
  ];
  return (
    <div>
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

export default UserDashboard;
