import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/useAuth";
import type { LoginData } from "../types/authTypes";
import { Link, useNavigate } from "react-router-dom";
// import { login as loginService } from "../services/authService";
import { FaTimes, FaEnvelope, FaLock, FaUnlock } from "react-icons/fa";
import axios from "axios";
import axiosClient from "../api/axiosClient";
// import { v4 as uuidv4 } from "uuid";

import "../styles/styles.css";

interface LoginProps {
  setAuth: (auth: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setAuth }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [visible, setVisible] = useState(false);
  const [showPassord, setshowPassord] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  // const [rememberDevice, setRememberDevice] = useState(false);
  // const deviceId = rememberDevice ? uuidv4() : null;
  const passwordVisibility = () => {
    setshowPassord((prev) => !prev);
  };
  // MAT00002
  useEffect(() => {
    setVisible(true);
  }, []);

  const onSubmit = async (data: LoginData) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const existingDeviceId =
        localStorage.getItem("trustedDeviceId") || undefined;
      const payload: {
        matricule: string;
        password: string;
        device_id?: string;
      } = {
        matricule: data.matricule,
        password: data.password,
      };
      if (existingDeviceId) {
        payload.device_id = existingDeviceId;
      }
      const res = await axiosClient.post("/auth/login/", payload);

      if (res.data.otp_required) {
        if (res.data.masked_email) {
          localStorage.setItem("resetEmail", res.data.masked_email);
        }
        if (res.data.nom || res.data.prenoms)
          localStorage.setItem(
            "resetName",
            `${res.data.nom || ""} ${res.data.prenoms || ""}`.trim(),
          );

        // stocke data utiles device_id_expected
        localStorage.setItem("resetMatricule", data.matricule);

        if (res.data.expire_at)
          localStorage.setItem("verifyExpireAt", String(res.data.expire_at));
        // si le backend attend un device_id -> generate and store one
        // navigate vers verify
        setSuccess(t("loginSuccess"));
        setTimeout(() => navigate("/verify-code"), 800);
        return;
      }

      // sinon login automatique (trusted device)
      login(res.data.access, res.data.refresh);
      // stocke user payload si present
      setAuth(true);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 401) {
          setError(t("wrongPassword"));
        } else {
          console.error(t("loginError : "), error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div
        className={`w-[95%] lg:w-full max-w-[720px] opacity-0 transition-opacity duration-500 
              ${
                visible
                  ? "opacity-100 pointer-events-auto"
                  : "pointer-events-none"
              } `}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          // animate={{ opacity: 1, y: 0, scale: [1, 1.2, 1] }}
        >
          {/* on va ameliorer de façon à obtenir à gauche une image et à droite le formulaire */}

          <div className="flex max-w-5xl w-full bg-white rounded-lg overflow-hidden p-4 sm:p-0">
            {/* image et texte */}
            <div className="login hidden max-w-2/5 items-center text-center w-full sm:flex flex-col gap-6 p-3 text-white bg-cover bg-center rounded-l-lg">
              <p className="lg:text-base sm:text-sm">
                {t("loginDescription1")}
              </p>
              <p className="text-[11px] lg:text-xs tracking-widest leading-5">
                {t("loginDescription2")}
              </p>
            </div>

            {/* formulaire */}
            <div className="w-full py-7 sm:p-5">
              <div className="flex justify-between">
                <h2 className="text-xl sm:text-2xl ml-28 mb-3 sm:mb-2 lg:mb-3 text-center capitalize font-semibold">
                  {t("login")}
                </h2>
                <FaTimes
                  onClick={() => navigate("/")}
                  className="lg:text-xl sm:text-lg cursor-pointer hover:text-red-400"
                  title={t("close")}
                />
              </div>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                method="POST"
                autoComplete="off"
              >
                <div className="h-13 w-full mt-5 relative mb-8">
                  <div className="">
                    <input
                      type="text"
                      {...register("matricule", {
                        required: t("requiredFieldMatricule"),
                      })}
                      className="peer w-full h-full pt-3 pb-3 pl-4 pr-11 border border-[#717171] outline-none text-lg rounded 
                          focus:border-[#19e8ff] focus:pt-4 focus:pb-1 valid:pt-4 valid:pb-1"
                      placeholder=" "
                    />
                    <label
                      className="absolute top-1/2 right-0 text-[#717171] transform -translate-y-3/5 left-4 pointer-events-none transition duration-500 ease-out
                        peer-focus:text-[#19e8ff] peer-focus:text-xs peer-focus:-translate-y-[130%]
                        peer-[&:not(:placeholder-shown)]:text-[#19e8ff] peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:-translate-y-[130%]"
                    >
                      {t("matricule")}
                    </label>
                  </div>
                  <FaEnvelope className="absolute top-1/2 right-5 text-[#717171] transform -translate-y-3/5" />
                  {errors.matricule && (
                    <p className="text-red-500 py-1 text-sm">
                      {errors.matricule.message}
                    </p>
                  )}
                </div>

                <div className="h-13 w-full mt-5 relative mb-6">
                  <div className="">
                    <input
                      type={showPassord ? "text" : "password"}
                      {...register("password", {
                        required: t("requiredFieldPswd"),
                      })}
                      className="peer w-full h-full pt-3 pb-3 pl-4 pr-11 border border-[#717171] outline-none text-lg rounded 
                          focus:border-[#19e8ff] focus:pt-4 focus:pb-1 valid:pt-4 valid:pb-1"
                      placeholder=" "
                    />
                    <label
                      className="absolute top-1/2 right-0 text-[#717171] transform -translate-y-3/5 left-4 pointer-events-none transition duration-500 ease-out
                        peer-focus:text-[#19e8ff] peer-focus:text-xs peer-focus:-translate-y-[130%]
                        peer-[&:not(:placeholder-shown)]:text-[#19e8ff] peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:-translate-y-[130%]"
                    >
                      {t("password")}
                    </label>
                  </div>

                  <button
                    type="button"
                    title="cliquer pour afficher le password"
                    onClick={passwordVisibility}
                    className="cursor-pointer absolute top-1/2 right-5 text-[#717171] transform -translate-y-3/5"
                  >
                    {showPassord ? <FaUnlock /> : <FaLock />}
                  </button>
                  {errors.password && (
                    <p className="text-red-500 py-1 text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-[#00bcd4] hover:underline text-sm"
                  >
                    {t("passwordForget?")}
                  </Link>
                </div>

                {error && (
                  <p className="text-red-600 text-center text-sm">{error}</p>
                )}
                {success && (
                  <p className="text-green-600 text-center text-sm">
                    {success}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  aria-label={t("login")}
                  className="bg-[#00bcd4] text-white py-2 px-0 border cursor-pointer rounded-md transition duration-500 ease-out w-full disabled:green-300"
                >
                  {t("loginSe")}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
