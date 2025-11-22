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
