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

export type Password = {
  old_password: string;
  new_password: string;
  confirm_password: string;
};

export type Preferences = {
  email_notifications: boolean;
  sms_notifications: boolean;
};
