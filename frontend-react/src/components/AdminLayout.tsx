import React, { useState, useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/useAuth";
import Langue from "../i18n/Langue";
import type { Personnel } from "../types/personnel";
import axiosClient from "../api/axiosClient";
import { HomeIcon, UserIcon, Bars3Icon } from "@heroicons/react/24/solid";

import {
  BookOpen,
  ClipboardList,
  Briefcase,
  User,
  FileSpreadsheet,
  File,
} from "lucide-react";
import { slugify } from "../utils/slugify";

import AvatarMenu from "../layouts/AvatarMenu";
import Sidebar from "../layouts/Sidebar";

const AdminLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [personnel, setPersonnel] = useState<Personnel | null>(null);

  const { t } = useTranslation();
  const { logout } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchPersonnel = async () => {
      try {
        const response = await axiosClient.get("/personnels/me/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });
        if (!mounted) return;
        setPersonnel(response.data);
      } catch (error) {
        console.error("Error fetching personnel:", error);
      }
    };

    fetchPersonnel();

    return () => {
      mounted = false;
    };
  }, []);

  const slugi = useMemo(
    () =>
      `${slugify(personnel?.nom || "")}-${slugify(
        personnel?.prenoms || "user",
      )}`,
    [personnel],
  );

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
            link: "/dashboard/admin",
          },
          {
            key: "profile",
            icons: <UserIcon className="h-6 w-6" />,
            label: t("dasboard.cards.MonCompte"),
            link: `personnel/${personnel?.id}-${slugi}`,
          },
          {
            key: `fiche`,
            label: t("dasboard.ficheInstruction"),
            icons: <File className="w-5 h-5" />,
            link: `fiche-instruction`,
          },
        ],
      },
      {
        id: "personnels",
        title: t("dasboard.GestionPersonnels"),
        items: [
          {
            key: "add-personnel",
            label: t("dasboard.AjoutPersonnel"),
            icons: <User className="h-6 w-6" />,
            link: "ajout-personnel",
          },
          {
            key: "list-personnels",
            label: t("dasboard.listPersonnels"),
            icons: <Briefcase className="h-6 w-6" />,
            link: "list-personnels",
          },
        ],
      },

      {
        id: "conges",
        title: t("dasboard.GestionCongés"),
        items: [
          {
            key: "list-conges",
            label: t("dasboard.listConges"),
            icons: <ClipboardList className="h-6 w-6" />,
            link: "list-conges",
          },
          {
            key: "list-demandes",
            label: t("dasboard.GestionDemandesConges"),
            icons: <BookOpen className="h-6 w-6" />,
            link: "list-demandes",
          },
          {
            key: "regle-conges",
            label: t("dasboard.GestionReglesConges"),
            icons: <ClipboardList className="h-6 w-6" />,
            link: "regle-conges",
          },
          {
            key: "modifie-conges",
            link: "modifie-conges",
            label: t("dasboard.ModofieConges"),
            icons: <FileSpreadsheet className="h-6 w-6" />,
          },
        ],
      },
    ],
    [t, personnel, slugi],
  );
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
              onProfile={() => navigate(`personnel/${personnel?.id}-${slugi}`)}
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

export default AdminLayout;
