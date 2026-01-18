# conges/management/commands/update_monthly_acquisition.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from conges.models import Conge

class Command(BaseCommand):
    help = "Mise à jour mensuelle des congés acquis"

    def handle(self, *args, **options):
        today = timezone.now().date()
        count = 0

        for conge in Conge.objects.filter(annee=today.year):
            conge.recalculer_acquisition_mensuelle(as_of=today, save=True)
            count += 1

        self.stdout.write(self.style.SUCCESS(
            f"{count} congé(s) mensuels mis à jour"
        ))
