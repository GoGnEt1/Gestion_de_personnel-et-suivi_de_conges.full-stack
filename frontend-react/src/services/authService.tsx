import axios from "../api/axiosClient";
import type { User, LoginData, RegisterData } from "../types/authTypes";

// export default {
//   login: async ({ email, password }: { email: string; password: string }) => {
//     const res = await axios.post("/api/token", { email, password });
//     return { token: res.data.token };
//   },

//   register: async ({
//     email,
//     password,
//     name,
//   }: {
//     email: string;
//     password: string;
//     name: string;
//   }) => {
//     const res = await axios.post("/api/register", { email, password, name });
//     return { token: res.data.token };
//   },
// };

/* Fonction d'inscription */
export const register = async (
  userData: RegisterData
): Promise<{ user: User; token: string }> => {
  // userData est un objet contenant les données d'inscription
  const response = await axios.post("/auth/register", userData); // Envoie les données d'inscription au serveur
  return response.data; // Renvoie l'utilisateur inscrit ou un token JWT en cas d'inscription reussie ou une erreur
};

/* Fonction de connexion */
export const login = async (
  credentials: LoginData
): Promise<{ access: string; refresh: string }> => {
  const response = await axios.post("/auth/login/", credentials);
  const { access, refresh } = response.data; // django SimpleJWT renvoie un access et un refresh

  // Enregitrer le token JWT dans le localStorage
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);

  return { access: access, refresh };
};

export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

export const loginWithGoogle = async (
  gooleToken: string
): Promise<{ user: User; access: string }> => {
  const response = await axios.post("/auth/google/", { access: gooleToken });
  const { user, access } = response.data;
  localStorage.setItem("access", access);
  return { user, access };
};
