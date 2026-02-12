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
    annee = models.IntegerField() # annee courant déterminé dynamiquement 
    conge_restant_annee_n_2 = models.DecimalField(max_digits=5, decimal_places=2, default=0) # annee courant - 2
    conge_restant_annee_n_1 = models.DecimalField(max_digits=5, decimal_places=2, default=0) # annee courant - 1 
    conge_restant_annee_courante = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    conge_initial = models.IntegerField(default=0)  # 45 ou 72, selon le grade
    conge_total = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # calculé dynamiquement
    
    conge_exceptionnel = models.IntegerField(default=6)
    conge_compensatoire = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    date_maj = models.DateTimeField(auto_now=True)

    conge_mensuel_restant = models.JSONField(default=dict, blank=True, null=True)
    class Meta:
        unique_together = ('personnel', 'annee') # Un seul état de conges par personnel et par année
        ordering = ['-annee'] # ordonner par annee decroissante

    def __str__(self):
        return f"{self.personnel.nom} ({self.annee}) : {self.conge_total} jour(s)"

    
    def initialiser(self):
        if not self.annee:
            self.annee = timezone.now().year

        if not self.conge_initial:
            self.conge_initial = self.get_default_conge_initial()

        self.conge_exceptionnel = 6
        # self.conge_restant_annee_n_2 = to_decimal(self.get_conge_restant(self.annee - 2))
        self.conge_restant_annee_courante = to_decimal(self.conge_initial)

        total = to_decimal(self.conge_initial)
        if total <= 0:
            self.conge_mensuel_restant = {f"{m:02d}": 0.0 for m in range(1, 13)}
            return

        part = _quant(total / Decimal(12))

        # date d'affectation et date actuelle
        date_aff = parse_date(getattr(self.personnel, "date_affectation", None))
        today = timezone.now().date()

        months = [f"{m:02d}" for m in range(1, 13)]
        result = {m: Decimal("0.00") for m in months}

        if date_aff:
            if date_aff.year == self.annee:
                months_to_fill = [f"{m:02d}" for m in range(date_aff.month, today.month + 1)]
            elif date_aff and date_aff.year < self.annee:
                months_to_fill = [f"{m:02d}" for m in range(1, today.month + 1)]
            else:
                months_to_fill = []

            # remplir par parts
            for m in months_to_fill:
                result[m] = part

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
        
        if save: 
            self.save()
    
    def recalculer_acquisition_mensuelle(self, as_of=None, save=True):
        if as_of is None:
            as_of = timezone.now().date()

        if self.annee != as_of.year:
            return

        date_aff = parse_date(getattr(self.personnel, "date_affectation", None))
        if not date_aff:
            return

        part = _quant(Decimal(self.conge_initial) / Decimal(12))
        mois_courant = as_of.month
        mois_str = f"{mois_courant:02d}"

        if to_decimal(self.conge_mensuel_restant.get(mois_str, 0)) == part:
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

    def rollover_to_new_year(self, new_year: int):
        if self.annee >= new_year:
            return

        # déplacer les soldes
        self.conge_restant_annee_n_2 = self.conge_restant_annee_n_1
        self.conge_restant_annee_n_1 = self.conge_restant_annee_courante

        # reset année courante
        self.annee = new_year
        self.conge_exceptionnel = 6
        self.conge_compensatoire = Decimal("0.00")
        self.conge_restant_annee_courante = Decimal("0.00")
        self.conge_mensuel_restant = {}

        # recalculer les acquisitions mensuelles
        self.initialiser()
        self.save()

    def prelement_conges(self, montant: Decimal, as_of: date = None):
        """
        Débite `amount` jours du solde disponible en suivant l'ordre:
        1. Les conges restants de l'annee n-2
        2. Les conges restants de l'annee n-1
        3. Les conges restants mensuels de l'annee courante (des mois anterieurs au mois de la demande)
        # 4. Les conges exceptionnels de l'annee courante
        Retourne la valeur restante (Decimal)
        Modifie et sauvegarde self mais sans self.save() 
        """
        if as_of is None:
            as_of = date.today()
        montant = to_decimal(montant) # assurer que le montant est un Decimal
        if Decimal('0.00') >= montant:
            return Decimal('0.00')
        
        # 1. Les conges restants de l'annee n-2
        # 2. Les conges restants de l'annee n-1
        for n_ in ["conge_restant_annee_n_2", "conge_restant_annee_n_1"]:
            if montant <= 0:
                break
            solde = to_decimal(getattr(self, n_))
            debit = min(montant, solde)
            setattr(self, n_, _quant(solde - debit))
            montant = montant - debit

        # 3. Les conges restants mensuels de l'annee courante (des mois anterieurs au mois de la demande)
        if montant > 0:
            mois_limit = int(as_of.month)
            for m in range(1, mois_limit + 1):
                if montant <= 0:
                    break
                key = f'{m:02d}'
                available = to_decimal(self.conge_mensuel_restant.get(key, 0))
                if available <= Decimal('0.00'):
                    continue

                debit = min(montant, available)
                new_val = _quant(available - debit)
                self.conge_mensuel_restant[key] = float(new_val)
                
                # décrémenter le conge restant de l'annee courante
                self.conge_restant_annee_courante = _quant(to_decimal(self.conge_restant_annee_courante) - debit)
                montant = montant - debit

        # Après prélèvements, recalculer conge total sans save
        self.recalculer_total_conges(save=False)
        
# Models Demande Congé à créer
class DemandeConge(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('refuse', 'Refusé'),
    ]
    
    TYPE_DEMANDE = [
        ('standard', 'Demande Standard'),
        ('exceptionnel', 'Demande Exceptionnelle'),
        ('compensatoire', 'Demande Compensatoire'),
    ]

    personnel = models.ForeignKey(Personnel, on_delete=models.CASCADE, related_name='demandes_conges')
    conge = models.ForeignKey(Conge, on_delete=models.CASCADE, related_name='demandes')
    annee = models.IntegerField()
    conge_demande = models.PositiveIntegerField(default=0, blank=True, null=True) # PositiveIntegerField empêche les entiers négatifs
    debut_conge = models.DateField(null=True, blank=True)
    periode = models.CharField(max_length=100, blank=True, null=True)  # exemple : "12/05/2025 - 22/05/2025"
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    motif = models.TextField(blank=True, null=True)
    date_soumission = models.DateTimeField(auto_now_add=True, editable=False)
    date_validation = models.DateTimeField(null=True, blank=True, editable=False)
    annule = models.BooleanField(null=True, blank=True)
    date_annulation = models.DateTimeField(null=True, blank=True, editable=False)

    type_demande = models.CharField(max_length=20, choices=TYPE_DEMANDE, default='standard')
    
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
        with transaction.atomic():
            demande = DemandeConge.objects.select_for_update().get(pk=self.pk)
            conge = Conge.objects.select_for_update().get(pk=demande.conge.pk)

            #  calculer droit acquis à la date de soumission
            as_of = parse_date(self.debut_conge) if self.debut_conge else timezone.now()
            # droit_acquis = to_decimal(conge.jours_acquis(as_of=as_of))

            if demande.type_demande == 'standard':
                #  calculer restes mensuels jusqu' avant prélèvement
                mois_debut = as_of.month
                print(mois_debut)
                restes_mensuels = Decimal('0.00')
                for m in range(1, mois_debut + 1):
                    key=f"{m:02d}"
                    restes_mensuels += to_decimal(conge.conge_mensuel_restant.get(key, 0))

                print(restes_mensuels)
                total_dispo = (
                    to_decimal(conge.conge_restant_annee_n_2) +
                    to_decimal(conge.conge_restant_annee_n_1) +
                    restes_mensuels
                )
                print(total_dispo)
                if demande_jours > total_dispo:
                    raise DjangoValidationError({ "conge_demande_non_valide": f"Solde de congé insuffisant. Il ne reste que {total_dispo} jours de congés." })

                #  prélèvement de conges
                conge.prelement_conges(demande_jours, as_of=as_of)
            elif demande.type_demande == 'exceptionnel':
                if demande_jours > to_decimal(conge.conge_exceptionnel):
                    raise DjangoValidationError({ "conge_demande_non_valide": f"Solde de congé exceptionnel insuffisant. Disponible: {conge.conge_exceptionnel} jours." })
                
                conge.conge_exceptionnel = int(conge.conge_exceptionnel - demande_jours)
            
            elif demande.type_demande == 'compensatoire':
                reste = to_decimal(conge.conge_compensatoire)
                if demande_jours > reste:
                    raise DjangoValidationError({ "conge_demande_non_valide": f"Solde de congé compensatoire insuffisant. Disponible: {conge.conge_compensatoire} jours." })
                
                conge.conge_compensatoire = _quant(reste - demande_jours)
    
            demande.statut = 'valide'
            demande.date_validation = timezone.now()
            demande.save()

            conge.save()

            return demande
    
    def refuser(self):
        self.statut = 'refuse'
        self.date_annulation = timezone.now()
        self.save()

    def save(self, *args, **kwargs):
        #  mettre à jour l'année 
        new_year = self.debut_conge.year
        if not self.annee or new_year != self.annee:
            self.annee = new_year
            
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
        if errors:
            raise DjangoValidationError(errors)    
    

