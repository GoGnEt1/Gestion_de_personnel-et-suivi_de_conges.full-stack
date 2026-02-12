import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../context/useAuth";

const EXPIRATION_SECONDS = 150;
const REDIRECTION_APRES_EXPIRATION_SECONDS = 60;

function generateDeviceId(): string {
  // Utilise la Crypto API si disponible
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Utilise la Web Crypto API si disponible
  if (window.crypto && window.crypto.getRandomValues) {
    const buffer = new Uint8Array(16);
    window.crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // fallback
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

// ON VA MAPPER LES MESSAGES BACKEND
const mapBackendMessageToTranslationKey = (msg: string | null) => {
  // si on a des messages backend, on les mappe ici vers les clé i18n
  // exp: si backend renvoie "code incorrect", on renvoie "verify.codeIncorrect
  if (!msg) return null;
  const lower = msg.toLowerCase();
  if (lower.includes("code incorrect")) return "verifyCode.errorIncorrect";
  if (lower.includes("code expiré")) return "verifyCode.errorExpired";
  if (lower.includes("trop de tentatives"))
    return "verifyCode.errorTooManyAttempts";
  if (lower.includes("code non trouvé")) return "verifyCode.errorNotFound";
  if (lower.includes("périphérique") || lower.includes("device")) return null; // Géré séparément

  // si on a un message brut, on affiche celui-ci tel quel
  return null;
};

const VerifyCode: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const compteInitialCountdown = useCallback(() => {
    const save = localStorage.getItem("verifyExpireAt");
    if (save) {
      const expireAt = parseInt(save, 10);
      if (!Number.isNaN(expireAt)) {
        const diffSec = Math.floor((expireAt - Date.now()) / 1000);
        return diffSec > 0 ? diffSec : 0;
      }
    }
    // pas de valeur sauvegardée → utilise default EXPIRATION_SECONDS
    return EXPIRATION_SECONDS;
  }, []);

  const [countdown, setCountdown] = useState<number>(compteInitialCountdown);
  const [expire, setExpire] = useState<boolean>(
    () => compteInitialCountdown() <= 0,
  );
  const [redirectionSecond, setRedirectionSecond] = useState<number>(
    REDIRECTION_APRES_EXPIRATION_SECONDS,
  );
  const matricule = localStorage.getItem("resetMatricule") || "";

  // recupérer l'adresse email de l'utilisateur à partir du matricule
  // afficher le masque d'email
  const maskedEmail = localStorage.getItem("resetEmail") || "";

  const maskedName = localStorage.getItem("resetName") || "";

  // référence pour éviter modification après un unmount
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // s'assurer que verifyExpireAt existe
  useEffect(() => {
    const save = localStorage.getItem("verifyExpireAt");
    if (!save) {
      const expireAt = Date.now() + EXPIRATION_SECONDS * 1000;
      localStorage.setItem("verifyExpireAt", String(expireAt));
      setCountdown(EXPIRATION_SECONDS);
      setExpire(false);
    } else {
      // si sauvegardé mais expiré déjà, on marque comme expiré
      const expireAt = parseInt(save, 10);
      if (!Number.isNaN(expireAt) && expireAt <= Date.now()) {
        setCountdown(0);
        setExpire(true);
      } else {
        setCountdown(Math.floor((expireAt - Date.now()) / 1000));
        setExpire(false);
      }
    }
  }, []);

  // compte à rebours
  useEffect(() => {
    if (expire) return;

    const id = setInterval(() => {
      const saved = localStorage.getItem("verifyExpireAt");
      if (!saved) {
        // nothing saved -> consider expired (safer)
        if (isMounted.current) {
          setCountdown(0);
          setExpire(true);
        }
        clearInterval(id);
        return;
      }
      const expireAt = parseInt(saved, 10);
      const diff = Math.floor((expireAt - Date.now()) / 1000);
      if (diff <= 0) {
        if (isMounted.current) {
          setCountdown(0);
          setExpire(true);
        }
        localStorage.removeItem("verifyExpireAt"); // cleanup
        clearInterval(id);
        return;
      }
      if (isMounted.current) setCountdown(diff);
    }, 1000);

    return () => clearInterval(id);
  }, [expire]);

  // si le code est expiré, démarrer le compte à rebours de redirection
  useEffect(() => {
    if (!expire) return;

    setError(null);
    setSuccess(null);

    let id: number | null = null;
    // ensure no verifyExpireAt remains
    localStorage.removeItem("verifyExpireAt");

    id = window.setInterval(() => {
      setRedirectionSecond((s) => {
        if (s <= 1) {
          clearInterval(id!);
          try {
            navigate("/login");
          } catch (e) {
            console.error(e);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (id) clearInterval(id);
    };
  }, [expire, navigate]);

  // formatage mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const remainingSeconds = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  /* gestion du device_id */
  const [rememberDevice, setRememberDevice] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string | null>(
    localStorage.getItem("trustedDeviceId") || null,
  );

  // générer device id local si l'utilisateur coche et qu'il n'y en a pas
  useEffect(() => {
    if (rememberDevice && !deviceId) {
      const id = generateDeviceId();
      setDeviceId(id);
    }
  }, [rememberDevice, deviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const matricule = localStorage.getItem("resetMatricule") || "";
      const payload: {
        matricule: string;
        code: string;
        device_id?: string;
        trust_device?: boolean;
      } = { matricule, code };
      if (rememberDevice && deviceId) {
        payload.trust_device = true;
        payload.device_id = deviceId;
      }
      // MAT00001
      const response = await axiosClient.post("/auth/verify-code/", payload);

      // Si tokens -> store tokens
      if (response.data.access && response.data.refresh) {
        localStorage.setItem("access", response.data.access);
        localStorage.setItem("refresh", response.data.refresh);

        // Si backend a renvoyé device_id (ou on en a un côté client) -> stocker en localStorage
        const returnedDeviceId = response.data.device_id || deviceId;
        if (returnedDeviceId && rememberDevice) {
          localStorage.setItem("trustedDeviceId", returnedDeviceId);
          // stocke expiry (30 days) en ms pour vérification côté client
          const expiryMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
          localStorage.setItem("trustedDeviceExpiry", String(expiryMs));
        }

        // si must_change_password -> rediriger
        if (response.data.must_change_password) {
          navigate("/reset-password");
          return;
        }

        // sinon login
        login(response.data.access, response.data.refresh);
        return;
      }

      // fallback (ancienne impl)
      setSuccess(response.data.message);
      // setRememberDevice(false);

      //  liberer le localStorage
      localStorage.removeItem("resetMatricule");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetName");
      // localStorage.removeItem("deviceId");
      // localStorage.removeItem("access");
      // localStorage.removeItem("refresh");
    } catch (err: unknown) {
      let errorMessage: string = t("error.general");

      if (axios.isAxiosError(err)) {
        const resp = err?.response;

        if (resp?.status === 409 || resp?.status === 400) {
          // Erreur de device déjà enregistré
          const errorData = resp.data;

          if (
            errorData.error &&
            (errorData.error.includes("périphérique") ||
              errorData.error.includes("device"))
          ) {
            // ✅ COMBINER error ET message
            const fullMessage = errorData.message
              ? `${errorData.error}\n\n${errorData.message}`
              : errorData.error;

            setError(fullMessage);
            console.log("fullMessage :", fullMessage);

            // Générer un nouveau device_id pour la prochaine tentative
            // const newDeviceId = generateDeviceId();
            // setDeviceId(newDeviceId);
            // localStorage.removeItem("trustedDeviceId");
            // localStorage.removeItem("trustedDeviceExpiry");

            // Décocher automatiquement la case
            setRememberDevice(false);

            return;
          }
        }

        // Autres erreurs
        if (resp?.data) {
          const backendMsg =
            resp.data.error ||
            resp.data.detail ||
            resp.data.message ||
            (Array.isArray(resp.data.non_field_errors) &&
              resp.data.non_field_errors[0]) ||
            JSON.stringify(resp.data);

          const key = mapBackendMessageToTranslationKey(backendMsg);
          errorMessage = key ? t(key) : backendMsg;
        }
      }

      setError(errorMessage);
    }
  };
  // si expire, on affiche le panneau rouge d'expiration full-screen
  if (expire) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-red-50 z-50">
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="max-w-lg w-full bg-red-600 text-white rounded-lg shadow-lg p-6 mx-4"
        >
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-bold">
              {t("verifyCode.expiredTitle")}
            </h2>
            <button
              onClick={() => navigate("/login")}
              aria-label={t("close")}
              className="ml-2 text-white/90 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>

          <p className="mt-4 text-sm">{t("verifyCode.expiredMessage")}</p>

          <div className="mt-6 text-center">
            <p className="text-xl font-semibold">
              {t("verifyCode.redirectIn", { seconds: redirectionSecond })}
            </p>
            <p className="mt-3 text-sm">{t("verifyCode.tryAgainTip")}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-white text-red-600 rounded shadow"
              >
                {t("verifyCode.goToLogin")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // si pas d'expire, on affiche le formulaire
  return (
    <div className="p-4 fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-40">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-sm sm:max-w-lg w-full bg-white rounded-xl p-5 shadow-xl"
      >
        <div className="w-full px-3 py-2">
          <div className="flex justify-between">
            <h2 className="text-lg mb-7 lg:mb-10 text-center capitalize font-semibold">
              {t("verifyCode.title", {
                name: maskedName || "M/Mme",
              })}
            </h2>
            <FaTimes
              onClick={() => navigate("/login")}
              className="lg:text-xl sm:text-lg cursor-pointer hover:text-red-400"
              title={t("close")}
            />
          </div>

          {/* instruction / email masqué */}
          <div className="rounded border-blue-100 bg-blue-50 p-3 text-sm text-blue-700 mb-4">
            <strong>! </strong>
            {maskedEmail
              ? t("verifyCode.enterCodeSentTo", { email: maskedEmail })
              : t("verifyCode.enterCode")}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* un champ non modifiable qui contient le matricule */}
            <input
              type="text"
              className="w-full h-full py-2 px-4 mb-5 border border-[#717171] outline-none text-sm rounded focus:border-blue-600"
              value={matricule}
              readOnly
              placeholder="Matricule"
              aria-label="matricule" // pour le lecteur d'écran
            />
            <input
              type="text"
              inputMode="numeric"
              // pattern="\d*"
              maxLength={6}
              className="w-full h-full py-2 px-4 mb-5 border border-[#717171] outline-none text-sm rounded focus:border-blue-600"
              placeholder={t("verifyCode.placeholder") || "Code"}
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              required
              disabled={expire}
            />

            {/* timer */}
            <div className="flex justify-between items-center text-sm">
              <p className="text-sm">
                {t("verifyCode.expiresIn")}
                <span className="font-semibold"> {formatTime(countdown)}</span>
              </p>
              <button
                type="submit"
                aria-label={t("verifyCode.verify")}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
                // className="bg-blue-600 text-white py-2 px-4 border cursor-pointer rounded-md transition duration-500 ease-out w-full hover:bg-transparent hover:text-blue-600 hover:border-blue-600 disabled:opacity-50"
                disabled={expire}
              >
                {t("verifyCode.verify")}
              </button>
            </div>
            <label htmlFor="" className="text-sm">
              <input
                title="Fais confiance à cet appareil"
                type="checkbox"
                name="remember_device"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="mr-2"
                // onChange={(e) => setRememberDevice(e.target.checked)}
              />
              {t("verifyCode.rememberDevice")}
            </label>
            {error && (
              <p className="text-red-600 text-center text-sm">{error}</p>
            )}
            {success && (
              <p className="text-green-600 text-center text-sm">{success}</p>
            )}
          </form>

          {/* petit text footer */}
          <div className="mt-6 text-xs text-gray-500">
            <p>{t("verifyCode.helpText")}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyCode;
