import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
// import { useAuth } from "../context/useAuth";

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [matricule, setMatricule] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // const { user } = useAuth();
  //   const [loading, setLoading] = useState(false);

  // console.log(user);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    // setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/request-reset-code/",
        {
          matricule,
        }
      );
      const data = response?.data;
      setSuccess(t("forgot.success"));
      localStorage.setItem("resetMatricule", matricule);
      if (data.expire_at) {
        localStorage.setItem("verifyExpireAt", String(data.expire_at));
      } else if (data.expire_at_iso) {
        localStorage.setItem(
          "verifyExpireAt",
          String(new Date(data.expire_at_iso).getTime())
        );
      } else {
        localStorage.setItem("verifyExpireAt", String(Date.now() + 150 * 1000));
      }
      if (data.masked_email) {
        localStorage.setItem("resetEmail", data.masked_email);
        console.log("email de reset password", data.masked_email);
      }
      if (data.nom || data.prenoms)
        localStorage.setItem(
          "resetName",
          `${data.nom || ""} ${data.prenoms || ""}`.trim()
        );

      setTimeout(() => {
        navigate("/verify-code");
      }, 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const detail = err.response.data?.detail || err.response.data?.error;
          setError(detail || t("forgot.error"));
        } else {
          setError(err.message);
        }
      }
    }
  };

  return (
    <div className="p-4 fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-md w-full bg-white rounded p-3 shadow-xl"
      >
        {/* <div className="flex max-w-lg w-full bg-white rounded-xl"> */}
        <div className="w-full px-3 py-2">
          <div className="flex justify-between mb-7 lg:mb-10">
            <h2 className="text-lg sm:text-xl  font-semibold">
              {t("forgotPassword.title")}
            </h2>
            <FaTimes
              onClick={() => navigate("/login")}
              className="lg:text-xl sm:text-lg cursor-pointer hover:text-red-400"
              title="Fermez le formulaire"
            />
          </div>
          <p className="text-sm text-justify mb-5 text-[#717171]">
            {t("forgotPassword.text")}
          </p>
          <form onSubmit={handleSubmit} method="POST" className="space-y-4">
            <input
              type="text"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              required
              placeholder={t("forgotPassword.matricule") || "Matricule"}
              className="w-full h-full py-2 px-4 mb-5 border border-[#717171] outline-none text-sm rounded focus:border-blue-600"
            />
            {error && (
              <p className="text-red-600 text-center text-sm">{error}</p>
            )}
            {success && (
              <p className="text-green-600 text-center text-sm">{success}</p>
            )}
            <button
              type="submit"
              //   disabled={loading}
              className="bg-blue-600 text-white py-2 border cursor-pointer rounded-md transition duration-500 ease-out w-full hover:bg-transparent hover:text-blue-600 hover:border-blue-600"
            >
              {
                //   loading ? t("forgotPassword.loading"):
                t("forgotPassword.sendCode")
              }
            </button>
          </form>
        </div>
        {/* </div> */}
      </motion.div>
    </div>
    // </div>
  );
};

export default ForgotPassword;
