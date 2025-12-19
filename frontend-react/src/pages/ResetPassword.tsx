import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../context/useAuth";

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const matricule = localStorage.getItem("resetMatricule") || "";

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axiosClient.post("/auth/reset-password/", {
        matricule,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      // comparer les deux mots de passe
      if (newPassword !== confirmPassword) {
        setError(t("resetPassword.passwordsDontMatch"));
        return;
      }
      setSuccess(response.data.message);
      localStorage.removeItem("resetMatricule");
      setTimeout(() => {
        // navigate("/login");
        login(response?.data.access, response?.data.refresh);
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(err?.response?.data?.error || t("error.general"));
        } else {
          setError(t("error.general"));
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
        className="max-w-md w-full bg-white rounded p-2 shadow-xl"
      >
        <div className="w-full px-3 py-2">
          <div className="flex justify-between mb-7 lg:mb-10">
            <h2 className="text-lg sm:text-xl  font-semibold">
              {t("resetPassword.title")}
            </h2>
            <FaTimes
              onClick={() => navigate("/login")}
              className="lg:text-xl sm:text-lg cursor-pointer hover:text-red-400"
              title={t("close")}
            />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder={t("resetPassword.newPassword") || "New Password"}
              className="w-full h-full py-2 px-4 mb-5 border border-[#717171] outline-none text-sm rounded focus:border-blue-600"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={
                t("resetPassword.confirmPassword") || "Confirm Password"
              }
              className="w-full h-full py-2 px-4 mb-5 border border-[#717171] outline-none text-sm rounded focus:border-blue-600"
            />
            {success && (
              <p className="mt-4 text-center text-sm text-green-600">
                {success}
              </p>
            )}
            {error && (
              <p className="mt-4 text-center text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 border cursor-pointer rounded-md transition duration-500 ease-out w-full hover:bg-transparent hover:text-blue-600 hover:border-blue-600"
            >
              {t("resetPassword.submit")}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
