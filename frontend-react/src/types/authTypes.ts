// utilisateur retourné par l'API
import React from "react";
import type { Personnel } from "../types/personnel";
export interface User {
  id: number;
  nom?: string;
  prenoms?: string;
  matricule: string;
  exp?: number;
  personnel?: Personnel;
  // personnel?: {
  //   id: number;
  //   photo?: string;
  // };
  is_staff?: boolean;
  is_superuser?: boolean;
  role: "admin" | "utilisateur"; // Ajout de la propriétaire si tu n'as pas de role
}

// Données envoyées à l'API pour s'incrire
export interface RegisterData {
  matricule: string;
  password: string;
  name: string;
  acceptTerms: boolean;
}

// Données envoyées à l'API pour se connecter
export interface LoginData {
  matricule: string;
  password: string;
}

export interface MenuItem {
  key: string;
  label: string;
  icons?: React.ReactNode;
  link?: string;
}

export interface MenuGroup {
  id: string;
  title?: string;
  items: MenuItem[];
}
