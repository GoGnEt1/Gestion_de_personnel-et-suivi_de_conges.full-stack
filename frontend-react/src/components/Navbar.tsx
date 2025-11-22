import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useTranslation } from "react-i18next";
import { useLocation, Outlet } from "react-router-dom";
import Langue from "../i18n/Langue";

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  // const { lang, handleLangSwitch } = useLangue();
  const { t } = useTranslation();

  const location = useLocation();

  useEffect(() => {
    document.body.className = "navbar";
  });
  return (
    <div className="navbar">
      <nav className="w-full shadow-md fixed top-0 z-50 pb-4">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-semibold text-white">
            {t("staff")}
          </Link>

          <div className="flex items-center gap-10">
            <Langue />

            {location.pathname === "/" && !isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="bg-white text-[#00bcd4] px-4 py-1.5 border border-white rounded-md
                 hover:text-white hover:bg-transparent transition-all duration-500"
                >
                  {t("login")}
                </Link>
              </>
            ) : (
              isAuthenticated && (
                <>
                  <Link
                    to={user?.is_staff ? "/dashboard/admin" : "/dashboard/user"}
                    className="text-sm hover:text-[#f0b106da] text-[#eeb704]"
                  >
                    {t("dashboard")}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="bg-white text-[#00bcd4] px-4 py-1.5 rounded-md
                 hover:text-white hover:bg-transparent border border-white"
                  >
                    {t("logout")}
                  </button>
                  <span className=" text-white absolute top-1/2 right-1/2 mt-60">
                    {t("welcome", {
                      name: user?.is_staff ? "Admin" : "User",
                    })}
                  </span>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Navbar;
