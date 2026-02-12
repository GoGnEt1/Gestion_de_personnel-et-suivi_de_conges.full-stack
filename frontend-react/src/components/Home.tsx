import React, { useEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useTranslation } from "react-i18next";
import Langue from "../i18n/Langue";
import { motion } from "framer-motion";
import Footer from "./Footer";

import slide1 from "../assets/fsg1.webp";
import slide2 from "../assets/fsg2.jpg";
import slide3 from "../assets/fsg3.jpg";

const slides = [slide1, slide2, slide3];

const Home: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [now, setNow] = useState(() =>
    new Date().toLocaleString("fr-FR", { timeZone: "Africa/Tunis" }),
  );

  // autoplay + clock
  useEffect(() => {
    // preload
    slides.forEach((s) => {
      const img = new Image();
      img.src = s;
    });

    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 10000);

    const clock = window.setInterval(() => {
      setNow(new Date().toLocaleString("fr-FR", { timeZone: "Africa/Tunis" }));
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      window.clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    document.title = `${t("personnel.management")} - FSG Gabès`;
  }, [t]);

  const welcomeVariants = {
    hidden: { opacity: 0, y: -6 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAV - fixed top */}
      <header className="headerH relative top-0 left-0 right-0 z-50 pb-4">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-white">
            {t("staff")}
          </Link>

          <div className="flex items-center gap-3">
            <Langue />
            {location.pathname === "/" && !isAuthenticated ? (
              <Link
                to="/login"
                className="bg-white text-sky-700 px-4 py-1.5 rounded-md shadow"
              >
                {t("login")}
              </Link>
            ) : (
              isAuthenticated && (
                <>
                  <Link
                    to={user?.is_staff ? "/dashboard/admin" : "/dashboard/user"}
                    className="text-sm text-white/90 hover:text-white transition"
                  >
                    {t("dashboard")}
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="bg-white text-sky-700 px-3 py-1 rounded-md shadow"
                  >
                    {t("logout")}
                  </button>

                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={welcomeVariants}
                    transition={{ duration: 0.35 }}
                    className="hidden md:block text-white text-sm ml-3"
                    aria-live="polite"
                  >
                    {t("welcome", {
                      name: user?.prenoms
                        ? `${user.prenoms} ${user.nom}`
                        : user?.matricule || "Utilisateur",
                    })}
                  </motion.div>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="min-h-[100vh] w w-full relative overflow-hidden">
        {/* images stacked */}
        {slides.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Slide ${i + 1}`}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-900 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={{ willChange: "opacity" }}
          />
        ))}

        {/* centered content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg">
            {t("personnel.management")}
          </h1>
          <p className="mt-2 text-white/90 max-w-2xl">
            {t("personnel.subtitle")}
          </p>
        </div>
      </div>
      {/* </section> */}

      {/* main page content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-12 z-10 w-full">
        <Outlet />
      </main>

      {/* footer */}
      <Footer now={now} />
    </div>
  );
};

export default Home;
