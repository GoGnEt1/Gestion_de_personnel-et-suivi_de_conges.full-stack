/* indispensable pour centraliser la configuration de axios(base URL, headers, interceptors, etc) et eviter de dupliquer la logique dans les services */
import axios from "axios";
import { API_URL } from "./http";

const axiosClient = axios.create({
  // baseURL: import.meta.env.VITE_API_URL, // la var d'en est contraint de commencer par VITE_ pour pouvoir être lu par meta
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // withCredentials: true, // permet de récupérer les cookies de l'utilisateur côté serveur
});

//intercepteur : on ajoute automatiquement le token JWT dans les headers de la requête
axiosClient.interceptors.request.use(
  (config) => {
    /*const access = localStorage.getItem("access");
    if (access && config.headers) {
      config.headers.Authorization = `Bearer ${access}`;
    }*/
    const skip = [
      "/auth/request-reset-code/",
      "/auth/verify-code/",
      "/auth/reset-password/",
    ];
    if (!skip.some((p) => config.url?.includes(p))) {
      const token = localStorage.getItem("access");
      if (token) config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// intercepteur de reponse : on gère les erreurs globales du serveur (ex: 401 Unauthorized)
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem("refresh");
        if (refresh) {
          const res = await axios.post(
            "http://127.0.0.1:8000/api/auth/login/refresh/",
            { refresh }
          );

          localStorage.setItem("access", res.data.access);
          axiosClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${res.data.access}`;

          return axiosClient(originalRequest);
        }
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login"; // redirige vers la page de connexion
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
