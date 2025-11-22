from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction

from .models import Personnel
from accounts.models import CustomUser, UserPreferences
from conges.models import Conge, DemandeConge, RegleConge
from django.utils import timezone
import re
from django.contrib.auth import get_user_model
from decimal import Decimal, ROUND_HALF_UP
from staf_manag.utils.conges import to_decimal


User = get_user_model()
def compute_initial_by_grade(grade: str) -> int:
    regle = RegleConge.objects.order_by('-date_maj').first()
    
    g= grade.lower()
    if not regle:
        # on utilise les valeurs par défaut définies dans le modèle
        if g and (re.search(r'technicien(ne)?', g, re.IGNORECASE) or re.search(r'assistant(e)?', g, re.IGNORECASE)):
            return 72
        return 45
    
    if grade and re.search(r'technicien(ne)?', grade, re.IGNORECASE) or re.search(r'assistant(e)?', grade, re.IGNORECASE):
        return regle.conge_initial_tech
    return regle.conge_initial_autres
        
@receiver(post_save, sender=Personnel)
def create_user_for_staff(sender, instance, created, **kwargs):
    if created:
        user = CustomUser.objects.create_user(
            matricule=instance.matricule,
            password=instance.matricule,
            personnel=instance,
            role='utilisateur'
        )
        user.double_auth = True
        user.save()


@receiver(post_save, sender=Personnel)
def create_conge_for_staff(sender, instance, created, **kwargs):
    if created:
        annee = timezone.now().year
        if not Conge.objects.filter(personnel=instance,
        annee=annee).exists():
            conge = Conge.objects.create(
                personnel=instance,
                annee=annee,
                conge_initial=Conge(personnel=instance).get_default_conge_initial()
            )
            # conge.conge_initial=conge.get_default_conge_initial()
            
            conge.initialiser()
            conge.save()

# recuperer le grade actuel du personnel en base (s'il existe) et
# l'attache temporairement à l'instance pour comparaison dans post_save
@receiver(pre_save, sender=Personnel)
def _store_old_grade(sender, instance : Personnel, **kwargs):
    if not instance.pk:
        # instance._old_grade est un attribut temporaire de l'instance
        instance._old_grade = None
        return

    try:
        old = Personnel.objects.get(pk=instance.pk)
        instance._old_grade = old.grade
    except Personnel.DoesNotExist:
        instance._old_grade = None

"""
si la grade a changé après post_save (et que l'objet n'a pas été créé),
on met à jour le conge associé selon les règles metier
"""

@receiver(post_save, sender=Personnel)
def _update_conge_after_grade_change(sender, instance: Personnel, created, **kwargs):
    old_grade = getattr(instance, '_old_grade', None)
    new_grade = getattr(instance, 'grade', None)

    # si le personnel est nouvellement créé, on ne fait rien
    if created:
        return
    
    #  si la grade n'a pas changé, on ne fait rien
    if (old_grade or "") == (new_grade or ""):
        return
    
    old_initial = compute_initial_by_grade(old_grade) if old_grade else None
    new_initial = compute_initial_by_grade(new_grade)

    # si les groupes de grade donnent la même valeur initiale, on ne fait rien
    if old_initial is not None and old_initial == new_initial:
        return
    
    # sinon, mise à jour du conge
    with transaction.atomic():
        annee = timezone.now().year
        conge, created_conge = Conge.objects.get_or_create(personnel=instance, annee=annee)
        conge.conge_initial = new_initial
        
        # calculer les conges validés
        try:
            valide = conge.get_conges_valides() or 0
        except Exception:
            valide = 0
    
        if valide > 0:
            if conge.conge_restant_annee_courante != to_decimal(conge.conge_initial):
                new_restant_n = max(0, new_initial - valide)
        else:
            new_restant_n = new_initial
        
        conge.conge_restant_annee_courante = new_restant_n

        total = new_restant_n + (conge.conge_restant_annee_n_1 or 0) + (conge.conge_restant_annee_n_2 or 0)

        if total < 0:
            total = 0
        conge.conge_total = total
        conge.save()

    # Conge.objects.filter(personnel=instance).update(conge_initial=Conge(personnel=instance).get_default_conge_initial())
"""
# mettre jour conge après une demande de conge validé
@receiver(post_save, sender=DemandeConge)
def update_conge_after_demande(sender, instance, created, **kwargs):
    if instance.statut == 'valide':
        conge = instance.conge
        demande = to_decimal(instance.conge_demande or 0)
        # calcul de prélèvement par ordre n-2 → n-1 → n
        available_n2 = to_decimal(conge.conge_restant_annee_n_2)
        if demande <= available_n2:
            conge.conge_restant_annee_n_2 = (available_n2 - demande).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            demande = Decimal('0.00')
        else:
            demande -= available_n2
            conge.conge_restant_annee_n_2 = Decimal('0.00')

        available_n1 = to_decimal(conge.conge_restant_annee_n_1)
        if demande > Decimal('0.00'):
            if demande <= available_n1:
                conge.conge_restant_annee_n_1 = (available_n1 - demande).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                demande = Decimal('0.00')
            else:
                demande -= available_n1
                conge.conge_restant_annee_n_1 = Decimal('0.00')

        # mensuels (plus anciens)
        if demande > Decimal('0.00'):
            today = timezone.now().date()
            mois_courant = today.month
            for m in range(1, mois_courant):
                key =f'{m:02d}'
                available = to_decimal(conge.conge_mensuel_restant.get(key, 0))
                if available <= Decimal('0.00'):
                    continue

                debit = min(demande, available)
                # conge.conge_mensuel_restant[key] -= max(0, available - debit)
                conge.conge_mensuel_restant[key] = float((available - debit).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                reste -= debit
                conge.conge_restant_annee_courante = (to_decimal(conge.conge_restant_annee_courante) - debit).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

                if demande <= Decimal('0.00'):
                    break
            
        conge.recalculer_total_conges()

"""
# code pour appliquer la novelle regle de conge
@receiver(post_save, sender=RegleConge)
def update_conge_after_regle(sender, instance, created, **kwargs):
    conges = Conge.objects.select_related('personnel').all()
    updates = []
    for conge in conges:
        nouveau = conge.get_default_conge_initial()
        ancien = conge.conge_initial
        if ancien != nouveau:
            conge.conge_initial = nouveau

            preleve= nouveau + conge.conge_restant_annee_courante - ancien
            if preleve > 0:
                conge.conge_restant_annee_courante = preleve
            else:
                conge.conge_restant_annee_courante = 0
            
            conge.recalculer_total_conges()
            updates.append(conge)
            conge.save()
    if updates:
        Conge.objects.bulk_update(updates, ['conge_initial', 'conge_restant_annee_courante', 'conge_total', 'conge_restant_annee_n_1', 'conge_restant_annee_n_2'])
    # bulk_update pour mettre à jour plusieurs instances de conge en une seule requête

@receiver(post_save, sender=CustomUser)
def create_user_preferences(sender, instance, created, **kwargs):
    if created:
        UserPreferences.objects.get_or_create(user=instance)


