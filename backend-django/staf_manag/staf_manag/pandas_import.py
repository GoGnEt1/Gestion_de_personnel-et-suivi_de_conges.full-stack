import pandas as pd
from datetime import datetime, date
from docx import Document

def lire_docx(fichier):
    document = Document(fichier)
    lignes = []
    en_tetes = []
    for table in document.tables:
        en_tetes = [cell.text.strip().lower() for cell in table.rows[0].cells]
        for row in table.rows[1:]:  # ignorer en-tête
            ligne = [cell.text.strip() for cell in row.cells]
            lignes.append(ligne)
    df = pd.DataFrame(lignes, columns=en_tetes)
    # columns=["nom", "prenoms", "grade", "specialite", "ecole_origine", "cin", "matricule", "telephone", "email", "date_affectation", "date_passage_grade"]
    return df

def parse_date(date_str):
    if pd.isna(date_str):
        return None
    if isinstance(date_str, (datetime, date)):
        return date_str.date() if isinstance(date_str, datetime) else date_str
    
    formats = ["%d/%m/%Y", "%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%m/%d/%Y", "%d.%m.%Y", "%Y.%m.%d"]
    for fmt in formats:
        try:
            return datetime.strptime(str(date_str).strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Format de date non reconnu : {date_str}")

