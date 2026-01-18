from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP

def mois_de_travail(start_date: date, end_date: date = None) -> int:
    """
    Retourne le nombre de mois *complets* travaillés entre start_date et end_date inclus.
    Exemple: si start_date = 15/01/2022 et end_date = 03/03/2022 -> 2 mois (janv, feb) si on veut compter mois entamés
    """
    if end_date is None:
        end_date = date.today()
    if start_date is None or start_date > end_date:
        return 0
    
     # compter mois complets ( +1 si mois entamés)
    months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
    return max(0, months)
    
# pour normaliser et quantifier à 2 décimales
def to_decimal(value) -> Decimal:
    if value is None:
        return Decimal('0.00')
    if isinstance(value, Decimal):
        d = value
    else:
        d = Decimal(str(value))
    # quantize à 2 décimales pour respecter DecimalField(max_digits=5, decimal_places=2)
    return d.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

from datetime import date, datetime
from django.utils.dateparse import parse_date as django_parse_date

def ensure_date(d):
    """
    Retourne un datetime.date si possible, ou None.
    Accepte : date, datetime, string 'YYYY-MM-DD'.
    """
    if d is None:
        return None
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.date()
    # essayer parse string
    try:
        parsed = django_parse_date(str(d))
        return parsed
    except Exception:
        return None

# new_upadate
import pandas as pd
def safe_value(val, default):
    if pd.isna(val) or val in ['', None]:
        return default
    return val

def normalize(col):
    return (
        str(col)
        .lower()
        .strip()
        .replace("\u200f", "")
        .replace("\u200e", "")
        .replace("إ", "ا")
        .replace("أ", "ا")
        .replace("آ", "ا")
        .replace("ة", "ه")
        .replace("ى", "ي")
        .replace("  ", " ")
        .replace(" ", "")
    )
from django.utils import timezone
def normalize_map(col_map):
    return {
        key: [normalize(k) for k in values]
        for key, values in col_map.items()
    }

today = timezone.now().date().year
year_n = today
year_n_1 = today - 1
year_n_2 = today - 2

COL_MAP = {
    "matricule": [
        "matricule",
        "المعرفالوحيد",   # ← colonne réelle normalisée
    ],

    "reste_n_2": [
        "reste de congée {year_n_2}",
        f"الباقيمنالعطلهالاستراحه{year_n_2}",
    ],

    "reste_n_1": [
        "reste de congée {year_n_1}",
        f"الباقيمنالعطلهالاستراحه{year_n_1}",
    ],

    "reste_n": [
        f"reste de congée {year_n}",
        f"الباقيمنالعطلهالاستراحه{year_n}",
    ],

    "compensation": [
        "solde les heur.sup",
        "الباقيمنالعطلهالتعويضيه",
    ],

    "exceptionnel": [
        "solde suplémentaire",
        f"الباقيمنالعطلالااستثنائيه{year_n}",
    ],
}

# NORMALIZED_COL_MAP = normalize_map(COL_MAP)

def detect_header_row(df):
    for i in range(min(15, len(df))):
        row = df.iloc[i].astype(str).str.lower()
        if any(
            "matricule" in cell or "المعرف" in cell
            for cell in row
        ):
            return i
    raise ValueError("Ligne d’en-tête introuvable")

def get_col(row, keys):
    for col_name in row.index:
        if col_name in keys:
            val = row[col_name]
            if val is not None and not pd.isna(val):
                return val
    return None

def fill_conge_from_row(row, conge):
    for field, headers in COL_MAP.items():
        for h in headers:
            if h in row.index:
                val = row.get(h)
                if pd.notna(val) and str(val).strip() != "":
                    try:
                        setattr(conge, field, to_decimal(val))
                    except Exception:
                        pass  # ou logger l’erreur
                break
