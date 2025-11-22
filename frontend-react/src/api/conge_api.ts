// src/api/conges.ts
import { API_URL, authHeaders } from "./http";
export type Personnel = {
  id: number;
  matricule: string;
  nom: string;
  prenoms: string;
};
export type RegleCongeData = {
  id: number;
  conge_initial_tech: number;
  conge_initial_autres: number;
  modifie_par: Personnel;
  date_maj: string;
};

export type DemandeConge = {
  id: number;
  personnel: Personnel;
  statut: "en_attente" | "valide" | "refuse";
  conge_demande: number;
  debut_conge: string;
  periode: string;
  motif: string | null;
  date_soumission: string;
  date_validation: string | null;
  annule?: boolean;
};
export type Conge = {
  id: number;
  annee: number;
  conge_restant_annee_n_2: number;
  conge_restant_annee_n_1: number;
  conge_restant_annee_courante: number;
  conge_initial: number;
  conge_total: number;
  conge_exceptionnel: number;
  conge_compasatoire: number;
  conge_mensuel_restant?: Record<string, number>;
  // quota_mensuel: number;
  personnel: Personnel;
  demandes?: DemandeConge | null;
};

// gestion des erreurs json
export async function parseErrorResponse(res: Response) {
  const text = await res.text();
  try {
    // si le serveur renvoie un json, on le parse
    return JSON.parse(text);
  } catch {
    return { detail: text || res.statusText };
  }
}

// export async function fetchMesConges(access: string): Promise<Conge[]> {
//   const res = await fetch(`${API_URL}/conges/`, {
//     headers: authHeaders(access),
//   });
//   if (!res.ok) {
//     console.error(
//       `erreur de chargement des conges ${res.status} ${res.statusText}`
//     );
//     throw new Error(
//       `erreur de chargement des conges ${res.status} ${res.statusText}`
//     );
//   }
//   return res.json();
// }

// api/conge_api.ts (ou fichier équivalent)
export async function fetchMesConges(
  access: string,
  personnelId?: number
): Promise<Conge[]> {
  let url = `${API_URL}/conges/`;
  if (personnelId) {
    url += `?personnel_id=${personnelId}`;
  }
  const res = await fetch(url, {
    headers: authHeaders(access),
  });
  if (!res.ok) {
    console.error(
      `erreur de chargement des conges ${res.status} ${res.statusText}`
    );
    throw new Error(
      `erreur de chargement des conges ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

export async function fetchAllchConges(access: string): Promise<Conge[]> {
  const res = await fetch(`${API_URL}/conges/`, {
    headers: authHeaders(access),
  });
  if (!res.ok) throw new Error("Erreur chargement congés(admin)");
  return res.json();
}
export async function fetchDemandes(access: string): Promise<DemandeConge[]> {
  const res = await fetch(`${API_URL}/conges/demande-conge/demandes/`, {
    headers: authHeaders(access),
  });
  if (!res.ok) throw new Error("Erreur chargement demandes");
  return res.json();
}

export async function validerConge(access: string, id: number) {
  const res = await fetch(`${API_URL}/conges/demande-conge/${id}/valider/`, {
    method: "POST",
    headers: authHeaders(access),
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const errorBody = await parseErrorResponse(res);
    throw errorBody;
  }
  return res.json();
}

export async function refuserConge(access: string, id: number) {
  const res = await fetch(`${API_URL}/conges/demande-conge/${id}/refuser/`, {
    method: "POST",
    headers: authHeaders(access),
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const errorBody = await parseErrorResponse(res);
    throw errorBody;
  }
  return res.json();
}

export async function fetchRecentRegles(
  access: string
): Promise<RegleCongeData[]> {
  const res = await fetch(`${API_URL}/conges/regle-conge/get_regle_courante/`, {
    headers: authHeaders(access),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data;
}

export async function fetchAllRegles(
  access: string
): Promise<RegleCongeData[]> {
  const res = await fetch(`${API_URL}/conges/regle-conge/get_all_regles/`, {
    headers: authHeaders(access),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data;
}
