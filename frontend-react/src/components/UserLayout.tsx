import React, { useState, useEffect, useMemo } from "react";
// import { motion } from "framer-motion";
import { Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import { FaTimes } from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import Langue from "../i18n/Langue";
import type { Personnel } from "../types/personnel";
import axiosClient from "../api/axiosClient";
import AvatarMenu from "../layouts/AvatarMenu";
import Sidebar from "../layouts/Sidebar";
import { slugify } from "../utils/slugify";

import {
  HomeIcon,
  // ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  Bars3Icon,
  WindowIcon,
} from "@heroicons/react/24/solid";

//
const UserLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel | null>(null);

  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

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
        console.error("Erreur lors de la récupération du personnel", error);
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

  // menu grouped
  const menuItems = useMemo(
    () => [
      {
        id: "home",
        title: t("dasboard.Personnalise"),
        items: [
          {
            key: "home",
            icons: <HomeIcon className="h-6 w-6" />,
            label: t("dasboard.home"),
            link: "/dashboard/user",
          },
          {
            key: `profile`,
            label: t("dasboard.cards.MonCompte"),
            icons: <UserIcon className="h-6 w-6" />,
            // label: "dasboard.profile", MonHistoriqueConges
            link: `mon-profil/${personnel?.id}-${slugi}`,
          },
        ],
      },
      {
        id: "conges",
        title: t("dasboard.GestionCongés"),
        items: [
          {
            key: "History-conge",
            label: t("dasboard.cards.MonHistoriqueConges"),
            icons: <DocumentTextIcon className="w-5 h-5" />,
            link: "historique-conges",
          },
          {
            key: "list-demandes",
            label: t("dasboard.cards.MesDemandesConges"),
            icons: <CalendarDaysIcon className="w-5 h-5" />,
            link: "mes-demandes-conges",
          },
          {
            key: "form-demande",
            label: t("dasboard.cards.DemandeCongesForm"),
            icons: <WindowIcon className="w-5 h-5" />,
            link: "demande-conges-form",
          },
        ],
      },
    ],
    [t, personnel, slugi]
  );

  if (!personnel) {
    return <div className="p-6">{t("noPersonnel")}</div>;
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        menuGroups={menuItems}
        onNavLinkClick={(link: string) => {
          navigate(link);
          setIsMenuOpen(false);
        }}
      />

      <div className="flex-1 flex flex-col min-h-screen transition-all">
        {/* TopBar */}
        <header className="flex items-center justify-between gap-4 p-3 border-white shadow-sm z-40 ">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen((s) => !s)}
              type="button"
              aria-label="Ouvrir le menu"
            >
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            </button>

            <h1 className="text-lg font-semibold">
              {t("welcome")},{" "}
              <span className="capitalize">
                {personnel
                  ? `${personnel?.nom} ${personnel?.prenoms}`
                  : t("Admin")}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Langue />
            <AvatarMenu
              personnel={personnel}
              onProfile={() => navigate(`mon-profil/${personnel?.id}-${slugi}`)}
              onSettings={() =>
                navigate(`parametres-compte/${personnel?.id}-${slugi}`)
              }
              onLogout={() => logout()}
            />
          </div>
        </header>

        <main className="flex-1 p-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
