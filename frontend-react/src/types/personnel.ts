import type { Conge } from "../api/conge_api";
import { API_URL, authHeaders } from "../api/http";
export type Personnel = {
  id: number;
  matricule: string;
  cin: string;
  nom?: string;
  prenoms?: string;
  role?: string;
  email?: string;
  grade?: string;
  rang?: string;
  telephone?: string;
  specialite?: string;
  ecole_origine?: string;

  photo?: string | null;

  pv_affectation?: string | null;
  cv?: string | null;
  decret_officiel?: string | null;
  fiche_fonction?: string | null;
  fiche_module_fr?: string | null;
  fiche_module_en?: string | null;

  date_affectation?: string;
  date_passage_grade?: string;

  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_owner?: boolean;

  adresse?: string;
  telephone_mobile?: string;
  code_postal?: string;
  pays?: string;
  nationalite?: string;
  lieu_naissance?: string;
  niveau_etudes?: string;
  ville?: string;
  birthday?: string;
  partenaire?: string;
  certificats_academiques?: string;
  situation_familiale?: string;
  nombre_enfants?: number;
  observations?: string;
};

export type Demande = {
  id: number;
  statut: string;
  personnel?: Personnel;
  conge?: Conge;
  date_sortie?: string;
  heure_sortie?: string;
  heure_retour?: string;
  type_demande: "sortie" | "attestation";
  langue: "fr" | "en" | "ar";
  nombre_copies?: number;
  motif: string | null;
  date_soumission: string;
  date_validation: string | null;
};

export async function approuverDemande(access: string, id: number) {
  const res = await fetch(`${API_URL}/demandes/${id}/approuver/`, {
    method: "POST",
    headers: authHeaders(access),
    body: JSON.stringify({}),
  });

  const data = await res.json();

  if (!res.ok) {
    throw data; // force le catch
  }
  return data;
}

export function getErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const errObj = err as Record<string, unknown>;
    if ("detail" in errObj) return String(errObj.detail);
    if ("message" in errObj) return String(errObj.message);
  }
  return "Erreur de serveur. Ressayez plus tard";
}

export async function refuserDemande(access: string, id: number) {
  const res = await fetch(`${API_URL}/demandes/${id}/refuser/`, {
    method: "POST",
    headers: authHeaders(access),
    body: JSON.stringify({}),
  });

  const data = await res.json();

  if (!res.ok) {
    throw data; // force le catch
  }
  return data;
}
export type Password = {
  old_password: string;
  new_password: string;
  confirm_password: string;
};

export type Preferences = {
  email_notifications: boolean;
  sms_notifications: boolean;
};
