from django.db import models
from personnel.models import Personnel
from accounts.models import CustomUser
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from decimal import Decimal, ROUND_HALF_UP
from django.core.exceptions import ValidationError as DjangoValidationError

import re
from datetime import date
from staf_manag.utils.conges import mois_de_travail, to_decimal
from staf_manag.pandas_import import parse_date

def get_lock_minutes():
    return getattr(settings, "CONGE_DECISION_LOCK_MINUTES", 15)

DEC2 = Decimal("0.01")
def _quant(d: Decimal) -> Decimal:
    return d.quantize(DEC2, rounding=ROUND_HALF_UP)

class RegleConge(models.Model):
    conge_initial_tech = models.IntegerField(default=72)
    conge_initial_autres = models.IntegerField(default=45)
    date_maj = models.DateTimeField(auto_now=True, editable=False)
    modifie_par = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='regles_conges')
    
    def __str__(self):
        nom = ""
        prenoms = ""
        if self.modifie_par and hasattr(self.modifie_par, "personnel") and self.modifie_par.personnel:
            nom = self.modifie_par.personnel.nom
            prenoms = self.modifie_par.personnel.prenoms
        return f"tech : {self.conge_initial_tech}, autres : {self.conge_initial_autres} par {nom} {prenoms}"
    
   
class Conge(models.Model):
    personnel = models.ForeignKey(Personnel, on_delete=models.CASCADE, related_name='conges')
    annee = models.IntegerField(editable=False) # annee courant déterminé dynamiquement 
    conge_restant_annee_n_2 = models.DecimalField(max_digits=5, decimal_places=2, default=0, editable=False) # annee courant - 2
    conge_restant_annee_n_1 = models.DecimalField(max_digits=5, decimal_places=2, default=0, editable=False) # annee courant - 1 
    conge_restant_annee_courante = models.DecimalField(max_digits=5, decimal_places=2, default=0, editable=False)
    conge_initial = models.IntegerField(default=0)  # 45 ou 72, selon le grade
    conge_total = models.DecimalField(max_digits=5, decimal_places=2, default=0, editable=False)  # calculé dynamiquement
    
    conge_exceptionnel = models.IntegerField(default=6)
    conge_compensatoire = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    date_maj = models.DateTimeField(auto_now=True, editable=False)

    conge_mensuel_restant = models.JSONField(default=dict, editable=False)
    class Meta:
        unique_together = ('personnel', 'annee') # Un seul état de conges par personnel et par année
        ordering = ['-annee'] # ordonner par annee decroissante

    def __str__(self):
        return f"{self.personnel.nom} ({self.annee}) : {self.conge_total} jour(s)"

    
    def initialiser(self):
        self.annee = timezone.now().year
        if not self.conge_initial:
            self.conge_initial = self.get_default_conge_initial()

        self.conge_exceptionnel = 6
        self.conge_restant_annee_n_1 = to_decimal(self.get_conge_restant(self.annee - 1))
        self.conge_restant_annee_n_2 = to_decimal(self.get_conge_restant(self.annee - 2))

        total = to_decimal(self.conge_initial)
        if total <= 0:
            self.conge_mensuel_restant = {f"{m:02d}": 0.0 for m in range(1, 13)}
            self.conge_restant_annee_courante = Decimal("0.00")
            return

        part = _quant(total / Decimal(12))

        # date d'affectation et date actuelle
        date_aff = parse_date(getattr(self.personnel, "date_affectation", None))
        today = timezone.now().date()

        months = [f"{m:02d}" for m in range(1, 13)]
        result = {m: Decimal("0.00") for m in months}

        if date_aff and date_aff.year == self.annee:
            mois_debut = date_aff.month
            mois_courant = today.month
            months_to_fill = [f"{m:02d}" for m in range(mois_debut, mois_courant + 1)]
        elif date_aff and date_aff.year < self.annee:
            mois_courant = today.month
            months_to_fill = [f"{m:02d}" for m in range(1, mois_courant + 1)]
        else:
            months_to_fill = []

        # remplir par parts
        for m in months_to_fill:
            result[m] = part

        # somme des acquis
        self.conge_restant_annee_courante = sum(result[m] for m in months_to_fill)

        # stocker en JSON
        self.conge_mensuel_restant = {k: float(v or 0.0) for k, v in result.items()}

        self.recalculer_total_conges(save=False)
        
    def save(self, *args, **kwargs):
        if not getattr(self, "annee", None):
            self.annee = timezone.now().year

        # garantir types float pour JSON (défensive)
        try:
            self.conge_mensuel_restant = {k: float(v or 0.0) for k, v in (self.conge_mensuel_restant or {}).items()}
        except Exception:
            self.conge_mensuel_restant = {f"{m:02d}": 0.0 for m in range(1, 13)}

        # recalculer conge_total sans save récursif
        self.conge_total = (
            to_decimal(self.conge_restant_annee_n_1) +
            to_decimal(self.conge_restant_annee_n_2) +
            to_decimal(self.conge_restant_annee_courante)
        )

        super().save(*args, **kwargs)
    
    def recalculer_total_conges(self, save: bool = True):
        self.conge_total =(
            to_decimal(self.conge_restant_annee_n_1) +
            to_decimal(self.conge_restant_annee_n_2) +
            to_decimal(self.conge_restant_annee_courante)
        )
        # quantize le reultat
        # self.conge_total = to_decimal(self.conge_total)
        
        if save: 
            self.save()
    
    def recalculer_acquisition_mensuelle(self, as_of=None, save=True):
        if as_of is None:
            as_of = timezone.now().date()

        # self.annee = as_of.year
        if self.annee != as_of.year:
            return

        date_aff = parse_date(getattr(self.personnel, "date_affectation", None))
        if not date_aff:
            return

        part = _quant(Decimal(self.conge_initial) / Decimal(12))
        mois_courant = as_of.month
        mois_str = f"{mois_courant:02d}"

        if self.conge_mensuel_restant.get(mois_str, 0) == part:
            return

        result = {f"{m:02d}": Decimal("0.00") for m in range(1, 13)}

        if date_aff.year == self.annee:
            mois_debut = date_aff.month
            mois_range = range(mois_debut, mois_courant + 1)
        elif date_aff.year < self.annee:
            mois_range = range(1, mois_courant + 1)
        else:
            mois_range = []

        for m in mois_range:
            result[f"{m:02d}"] = part

        self.conge_mensuel_restant = {k: float(v) for k, v in result.items()}
        self.conge_restant_annee_courante = sum(result.values())

        self.recalculer_total_conges(save=False)

        if save:
            self.save()

    def get_conges_valides(self):
        return DemandeConge.objects.filter(
            personnel=self.personnel, annee=self.annee, statut='valide'
        ).aggregate(total=models.Sum('conge_demande'))['total'] or 0
    
    def get_default_conge_initial(self):
        regle = RegleConge.objects.order_by('-date_maj').first()
        grade = self.personnel.grade
        
        if not regle:
            # on utilise les valeurs par défaut définies dans le modèle
            if grade and (re.search(r'technicien(ne)?', grade, re.IGNORECASE) or re.search(r'assistant(e)?', grade, re.IGNORECASE)):
                return 72
            return 45
        
        if grade and re.search(r'technicien(ne)?', grade, re.IGNORECASE) or re.search(r'assistant(e)?', grade, re.IGNORECASE):
            return regle.conge_initial_tech
        return regle.conge_initial_autres
    
    def get_conge_restant(self, annee_cible):
        if self.personnel.date_affectation and self.personnel.date_affectation.year > annee_cible:
            return 0
        
        # Rechercher le congé existant pour cette année
        ancien_conge = Conge.objects.filter(personnel=self.personnel, annee=annee_cible).order_by('-id').first()

        if ancien_conge:
            return ancien_conge.conge_restant_annee_courante
        return 0
    
    def jours_acquis(self, as_of: date = None) -> Decimal:
        """Nombre de jours de congés acquis au jours as_of (par defaut aujourd'hui)
        utilise le quota mensuel = conge_initial / 12, et multiplie par le nombre de mois 
        de travail depuis la date d'affectation
        """
        if as_of is None:
            as_of_date = date.today()
        else:
            as_of_date = parse_date(as_of)
            if as_of_date is None:
                return Decimal('0.00')
        
        date_aff = self.personnel.date_affectation
        date_aff = parse_date(date_aff) if date_aff is not None else None
        if not date_aff or date_aff > as_of_date:
            return Decimal('0.00')
        
        mois_courant = mois_de_travail(date_aff, as_of_date)
        quota_mensuel = Decimal(str(self.get_default_conge_initial())) / Decimal('12')
        
        result = _quant(quota_mensuel * Decimal(mois_courant))

        return result

    def prelement_conges(self, montant: Decimal, as_of: date = None) -> Decimal:
        """
        Débite `amount` jours du solde disponible en suivant l'ordre:
        1. Les conges restants de l'annee n-2
        2. Les conges restants de l'annee n-1
        3. Les conges restants mensuels de l'annee courante (des mois anterieurs au mois de la demande)
        4. Les conges exceptionnels de l'annee courante
        Retourne la valeur restante (Decimal)
        Modifie et sauvegarde self mais sans self.save() 
        """
        if as_of is None:
            as_of = date.today()
        montant = to_decimal(montant) # assurer que le montant est un Decimal
        if Decimal('0.00') >= montant:
            return Decimal('0.00')
        
        # 1. Les conges restants de l'annee n-2
        n2 = to_decimal(self.conge_restant_annee_n_2)
        if n2 > 0:
            debit = min(montant, n2)
            self.conge_restant_annee_n_2 = _quant(n2 - debit)
            montant = montant - debit

        # 2. Les conges restants de l'annee n-1
        if montant > 0:
            n1 = to_decimal(self.conge_restant_annee_n_1)
            if n1 > 0:
                debit = min(montant, n1)
                self.conge_restant_annee_n_1 = _quant(n1 - debit)
                montant = montant - debit

        # 3. Les conges restants mensuels de l'annee courante (des mois anterieurs au mois de la demande)
        if montant > 0:
            mois_limit = int(as_of.month)
            for m in range(1, mois_limit):
                if montant <= 0:
                    break
                key = f'{m:02d}'
                available = to_decimal(self.conge_mensuel_restant.get(key, 0))
                if available <= Decimal('0.00'):
                    continue

                debit = min(montant, available)
                new_val = _quant(available - debit)
                self.conge_mensuel_restant[key] = float(new_val)
                montant = montant - debit
                # décrémenter le conge restant de l'annee courante
                self.conge_restant_annee_courante = _quant(to_decimal(self.conge_restant_annee_courante) - debit)

        # 4. Les conges exceptionnels de l'annee courante
        if montant > 0:
            exceptionnel = to_decimal(self.conge_exceptionnel)
            if exceptionnel > 0:
                debit = min(montant, exceptionnel)
                # self.conge_exceptionnel = _quant(exceptionnel - debit)
                self.conge_exceptionnel = int(exceptionnel - debit)
                montant = montant - debit

        # Après prélèvements, recalculer conge total sans save
        self.recalculer_total_conges(save=False)
        # s'assurer que les valeurs de conges mensuels sont des floats serializables en json
        self.conge_mensuel_restant = {k: float(v) for k, v in (self.conge_mensuel_restant or {}).items()}
        return _quant(montant)

# Models Demande Congé à créer
class DemandeConge(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('refuse', 'Refusé'),
    ]
    
    personnel = models.ForeignKey(Personnel, on_delete=models.CASCADE, related_name='demandes_conges')
    conge = models.ForeignKey(Conge, on_delete=models.CASCADE, related_name='demandes')
    annee = models.IntegerField(editable=False, default=timezone.now().year)
    conge_demande = models.PositiveIntegerField(default=0, blank=True, null=True) # PositiveIntegerField empêche les entiers négatifs
    debut_conge = models.DateField(null=True, blank=True)
    periode = models.CharField(max_length=100, blank=True, null=True, editable=False)  # exemple : "12/05/2025 - 22/05/2025"
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    motif = models.TextField(blank=True, null=True)
    date_soumission = models.DateTimeField(auto_now_add=True, editable=False)
    date_validation = models.DateTimeField(null=True, blank=True, editable=False)
    annule = models.BooleanField(null=True, blank=True)
    date_annulation = models.DateTimeField(null=True, blank=True, editable=False)
    
    class Meta:
        ordering =  ['-date_soumission']

    def is_locked(self) -> bool:
        """Après une décision (valider/refuser), on empêche toute modification 
        du statut au-delà d'un délai paramétrable ici 15 mn"""
        if not self.date_validation:
            return False
        lock_after = self.date_validation + timedelta(minutes=get_lock_minutes())
        return timezone.now() >= lock_after
    
    def valider(self):
        """
        Valider une demande de conge si disponibilité suffisante en suivant les règles
        de prélèvement de conges
        """
        demande_jours = to_decimal(self.conge_demande or 0)
        if demande_jours <= Decimal('0.00'):
            return DjangoValidationError({'conge_demande': 'Le nombre de jours demandé doit être supérieur a 0'})
        
        #  on locke la demande de conge pour la sécurité
        # with transaction.atomic():
        demande = DemandeConge.objects.select_for_update().get(pk=self.pk)
        conge = Conge.objects.select_for_update().get(pk=demande.conge.pk)

        #  calculer droit acquis à la date de soumission
        as_of = parse_date(self.debut_conge) if self.debut_conge else timezone.now()
        droit_acquis = to_decimal(conge.jours_acquis(as_of=as_of))

        #  calculer restes mensuels jusqu' avant prélèvement
        mois_debut = as_of.month
        restes_mensuels = Decimal('0.00')
        for m in range(1, mois_debut):
            key=f"{m:02d}"
            restes_mensuels += to_decimal(conge.conge_mensuel_restant.get(key, 0))

        total_dispo = (
            to_decimal(conge.conge_restant_annee_n_2) +
            to_decimal(conge.conge_restant_annee_n_1) +
            restes_mensuels +
            droit_acquis
            # + to_decimal(conge.conge_exceptionnel)
            )
        
        if demande_jours > total_dispo:
            raise DjangoValidationError({ "conge_demande_non_valide": f"Solde de congé insuffisant. Il ne reste que {total_dispo} jours de congés." })

        #  prélèvement de conges
        reste = conge.prelement_conges(demande_jours, as_of=as_of)

        if reste > 0:
            raise DjangoValidationError({ "conge_demande_non_valide": f"Solde de congé insuffisant. Il ne reste que {reste} jours de congés. Reste non prélèvables." })

        demande.statut = 'valide'
        demande.date_validation = timezone.now()
        demande.save()

        conge.save()

        return demande
    
    def refuser(self):
        self.statut = 'refuse'
        self.date_validation = timezone.now()
        self.save()


    def save(self, *args, **kwargs):
        
         # Gestion de la période à partir de la date_debut
        if self.debut_conge and self.conge_demande and self.conge_demande > 0:
            fin_conge = self.debut_conge + timedelta(days = self.conge_demande - 1)
            self.periode = f"{self.debut_conge.strftime('%d/%m/%Y')} - {fin_conge.strftime('%d/%m/%Y')}"
        else:
            self.periode = None
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        errors = {}
        # si une demande est faite, alors debut_conge doit être rempli
        if (self.conge_demande or 0) > 0 and not self.debut_conge: #and self.conge_demande != 0
            errors["debut_conge"] = "Le champ 'debut_conge' est requis si 'conge_demande' est différent de zéro"
        
        # si une demande est faite, alors debut_conge doit être rempli
        if not self.conge_demande and self.debut_conge is not None:
            errors["conge_demande"] = "Le champ 'conge_demande' est requis si 'debut_conge' est rempli"
        
        conflits = DemandeConge.objects.filter(
            personnel = self.personnel,
            statut = 'valide',
            debut_conge = self.debut_conge
        ).exclude(id=self.id)

        if conflits.exists():
            errors["conflits"] = f"Un congé validé se chevauche avec celui-ci pour {self.personnel.matricule}."
        
        # verifier si un congé validé existe juste avant
        dernier_conge = DemandeConge.objects.filter(
            personnel = self.personnel,
            statut = 'valide',
            debut_conge__lt = self.debut_conge
        ).order_by('-debut_conge').first()

        if dernier_conge and dernier_conge.periode:
            try:
                _, fin_conge = dernier_conge.periode.split(" - ")
                fin_conge = datetime.strptime(fin_conge, "%d/%m/%Y").date()
                if self.debut_conge <= fin_conge:
                    errors["demande interdite"] = "Un congé validé se termine avant ou le début de cette nouvelle demande pour ce personnel."
            except ValueError:
                pass
        
        # verifier le solde disponible avant d'enregistrer la demande
        conge = self.conge
        quota_acquis = to_decimal(conge.jours_acquis())
        deja_utilises = to_decimal(sum(
            d.conge_demande for d in DemandeConge.objects.filter(
                personnel=self.personnel,
                statut='valide',
                annee=self.annee
            ).exclude(id=self.id)
        ))
        
        dispo_mensuel = quota_acquis - deja_utilises
        dispo_total = (
            to_decimal(dispo_mensuel) +
            to_decimal(conge.conge_restant_annee_n_1) +
            to_decimal(conge.conge_restant_annee_n_2)
        )
        if self.conge_demande > dispo_total:
            errors["conge_demande_non_valide"] = f"Solde de congé insuffisant. Il ne reste que {dispo_total} jours de congés."

        if errors:
            raise DjangoValidationError(errors)    
    

