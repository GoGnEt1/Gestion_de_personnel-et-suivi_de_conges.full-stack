from pathlib import Path
from django.core.files.base import ContentFile
from .models import Personnel
from django.db.models import Q
from staf_manag.pandas_import import parse_date
import pandas as pd
import mimetypes, os, urllib.parse, urllib.request, requests

# import spécial pour safe_resolve_local_path
from typing import Optional, Tuple

FILE_COLUMNS_MAP = {
    "cv": ["cv", "cv_url", "lien_cv"],
    "pv_affectation": ["pv_affectation", "pv_affectation_url", "lien_pv_affectation", "pv"],
    "decret_officiel": ["decret_officiel", "decret_officiel_url", "lien_decret_officiel", "decret"],
    "fiche_fonction": ["fiche_fonction", "fiche_fonction_url", "lien_fiche_fonction"],
    "fiche_module_fr": ["fiche_module_fr", "fiche_module_fr_url", "lien_fiche_module_fr", "module_fr"],
    "fiche_module_en": ["fiche_module_en", "fiche_module_en_url", "lien_fiche_module_en", "module_en"],
}

def is_remote_url(value: str) -> bool:
    v = value.strip().lower()
    return v.startswith("http://") or v.startswith("https://")

def dowload_remote_file(url: str):
    try:
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        parsed = urllib.parse.urlparse(url)
        filename = os.path.basename(parsed.path)
        if not os.path.splitext(filename)[1]:
            ct = resp.headers.get('content-type')
            ext = mimetypes.guess_extension(ct.split(';')[0]) if ct else None
            if ext:
                filename += ext
        return ContentFile(resp.content), filename, None
    except Exception as e:
        return None, None, str(e)
    
def safe_resolve_local_path(value: str, base_dir: Path, allow_name_search: bool = True) -> Tuple[Optional[Path], Optional[str]]:
    """
    Résout une valeur vers un path autorisé sous base_dir.
    - value peut contenir un chemin relatif (exp: "../mon_cv.pdf") ou absolu (exp: "/mon_cv.pdf") ou "file:///C:/.../mon_cv.pdf"
    ou un chemin qui contient 'doc_excel_personnel' (exp: "doc_excel_personnel/mon_cv.pdf")
    - base_dir est le dossier de travail de l'importation et doit être Path(BASE_DIR / "doc_excel_personnel").
    - allow_name_search indique si on autorise la recherche par nom de fichier.
        si false : Retourne (None, error_message)
        si true : Retourne (path, None)
    """
    raw = str(value or "").strip()
    if not raw:
        return None, "Champ vide."
    
    # normalise backslashes et espaces
    raw_norm = os.path.normpath(raw)

    #  si la chaine contient "doc_excel_personnel" -> extraire la portion après "doc_excel_personnel" et
    # l'interpreter comme un chemin relatif
    lower = raw_norm.lower().replace("\\", "/") # uniformiser pour la recherche
    maker = "doc_excel_personnel"
    if maker in lower:
        # trouver position (sur la version normalisée avec slash)
        idx = lower.find(maker)
        # extraire la partie apres "doc_excel_personnel"
        start_pos = None
        # trouver occurrence correcte en se basant sur raw_norm remplacé par slash
        tmp = raw_norm.replace("\\", "/")
        start_pos = tmp.lower().find(maker)
        if start_pos != -1:
            relative_part = tmp[start_pos+len(maker):].lstrip("/\\")
            candidate = (base_dir / relative_part).resolve(strict=False)
        else:
            candidate = None # pas de fichier correspondant. fallback pour logique suivante

    else:
        candidate = None
        
    # si pas de candidate, gérer le cas ou la chaine commence par "file://"  ou un chemin absolu
    if candidate is None:
        # gerer file:// URI
        if raw_norm.lower().startswith("file:"):
            parsed = urllib.parse.urlparse(raw_norm)
            try:
                local_path = urllib.request.url2pathname(parsed.path)
            except Exception:
                local_path = parsed.path
            candidate = Path(local_path)
        else:
            candidate = Path(raw_norm)

        # si relatif -> interpreter comme un chemin relatif à la base_dir
        if not candidate.is_absolute():
            candidate = (base_dir / candidate).resolve(strict=False)
        else:
            # resout l'absolu
            candidate = candidate.resolve(strict=False)
    
    # resolution du base_dir (exige qu'il existe)
    try:
        base_resolved = base_dir.resolve(strict=True)
    except Exception as exc:
        return None, f"Le dossier de travail introuvable: {exc}"
    
    # sécurité : vérifier que candidate est sous base_resolved
    try:
        candidate.relative_to(base_resolved)
    except Exception:
        # si échoue, on peut tenter une heuristique permissive : chercher par nom de fichier dans base_dir
        if allow_name_search:
            name = Path(candidate).name
            matches = list(base_resolved.rglob(name))
            if matches:
                # prend le premier qui correspond
                candidate = matches[0]
            else:
                return None, f"Chemin local non autorisé: (doit être dans doc_excel_personnel)."
        else:
            return None, f"Chemin local non autorisé (doit être dans doc_excel_personnel)."
    
    # verifier existence et type
    if not candidate.exists():
        return None, f"Le chemin local introuvable sur le disque."
    if not candidate.is_file():
        return None, f"Le chemin local n'est pas un fichier."
    
    return candidate, None

def read_local_file(path: Path):
    try:
        with open(path, "rb") as f:
            return ContentFile(f.read()), path.name, None
    except Exception as e:
        return None, None, str(e)
    
def import_df_and_attach_files(df: pd.DataFrame, base_docs_dir: Path):
    df.columns = [str(c).strip().lower() for c in df.columns]
    # detecter les colonnes fichiers
    file_columns_found = {}
    for model_field, aliases in FILE_COLUMNS_MAP.items():
        for a in aliases:
            if a in df.columns:
                # on prend le premier trouvé et on quitte la boucle
                file_columns_found[model_field] = a
                break

    # les colonnes obligatoires de du fichier excel à importer
    expected_cols = [
        'nom et prénom', 'grade', 'spécialité', "etablissement d'origine",
        'cin', 'matricule', 'telephone', 'n° téléphone', 'adresse e-mail', "date d'affectation", 'date de passage de grade'
    ]
    # on lui ajoute les champs fichiers trouvés
    for v in file_columns_found.values():
        expected_cols.append(v)
    # ignorer les colonnes non désirées
    extra_colunms = [col for col in df.columns if col not in expected_cols]

    nb_inserts = 0
    doub = 0
    nb_total = len(df)
    personnels_ignores = []

    for idx, row in df.iterrows():
        try:
            # nettoyage des champs
            cin = str(row.get('cin', '')).strip() if pd.notna(row.get('cin')) else ''
            matricule = str(row.get('matricule', '')).strip() if pd.notna(row.get('matricule')) else ''
            nomComplet = str(row['nom et prénom']).strip().split(' ', 1)

            if not cin or not matricule or not nomComplet:
                personnels_ignores.append(f"Ligne {idx + 2}: cin ou matricule ou nom complet vide")
                continue
            
            # Ignorer les doublons
            if not Personnel.objects.filter(Q(cin=cin) | Q(matricule=matricule)).exists():
                nomComplet = str(row['nom et prénom']).strip().split(' ', 1)
                nom = nomComplet[0]
                prenoms = nomComplet[1] if len(nomComplet) > 1 else ""
                grade = str(row.get('grade')).strip()
                email=str(row.get('adresse e-mail')).strip()

                personnel = Personnel.objects.create(
                    nom=nom,
                    prenoms=prenoms,
                    grade=grade,
                    specialite=row.get('spécialité', ''),
                    ecole_origine=row.get("etablissement d'origine", 'FSG'),
                    cin=cin,
                    matricule=matricule,
                    telephone=row.get('n° téléphone', ''), #or row.get('telephone', ''),
                    email=email,
                    date_passage_grade=parse_date(row.get('date de passage de grade')),
                    date_affectation=parse_date(row.get("date d'affectation")),
                )
                nb_inserts += 1

                # verifier les doublons
            elif matricule and Personnel.objects.filter(matricule=matricule).exists():
                personnels_ignores.append(f"Ligne {idx + 2}:  la matricule {row['matricule']} existe déjà.")
                doub += 1
                continue
            elif cin and Personnel.objects.filter(cin=cin).exists():
                personnels_ignores.append(f"Ligne {idx + 2}:  le CIN {row['CIN']} existe déjà.")
                doub += 1
                continue
            else:
                continue
            
            # ajouter les valeurs des colonnes fichiers
            file_errors = []
            for model_field, col_name in file_columns_found.items():
                raw_val = row.get(col_name)
                src = str(raw_val).strip()
                if pd.isna(raw_val) or not src:
                    continue
                if is_remote_url(src):
                    content_file, file_name, err = dowload_remote_file(src)
                    if err:
                        file_errors.append(f"{model_field}: {err}")
                        continue
                else:
                    resolved_path, err = safe_resolve_local_path(src, base_docs_dir)
                    if err:
                        file_errors.append(f"{model_field}: {err}")
                        continue
                    content_file, file_name, err = read_local_file(resolved_path)
                    if err:
                        file_errors.append(f"{model_field}: {err}")
                        continue

                if content_file and file_name:
                    try:
                        getattr(personnel, model_field).save(file_name, content_file, save=False)
                    except Exception as e:
                        file_errors.append(f"{model_field}: erreur de sauvegarde ({e})")
                        continue
            
            personnel.save()
            if file_errors:
                personnels_ignores.append(f"Ligne {idx+2}: erreurs fichoers - "+"; ".join(file_errors))

        except Exception as e:
            personnels_ignores(f"Ligne {idx+2}: erreur import ({e})")

    return {
        "message": f"{nb_inserts} personnels importés avec succès sur {nb_total} ignorés ( {doub} doublons)",
        "personnels_ignores": personnels_ignores,
        "colonnes_ignorees": extra_colunms if extra_colunms else None,
        "colonnes_detectees_fichiers": file_columns_found
    }
