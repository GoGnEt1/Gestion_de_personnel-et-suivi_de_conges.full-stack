import { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import type { User } from "../types/authTypes";
interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  // setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
  login: (access: string, refresh: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (access: string, refresh: string) => {
    try {
      const decodedToken: User = jwtDecode(access);
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      setUser(decodedToken);
      setIsAuthenticated(true);

      if (decodedToken.is_staff) {
        setIsAdmin(true);
        navigate("/dashboard/admin");
      } else {
        navigate("/dashboard/user");
      }
    } catch (error) {
      console.error("Erreur lors du parsing du token", error);
      logout();
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (access) {
      try {
        const decodedToken: User = jwtDecode(access);
        setUser(decodedToken);
        setIsAuthenticated(true);

        if (decodedToken.is_staff) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Erreur lors du parsing du token", error);
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ isAdmin, isAuthenticated, user, login, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
