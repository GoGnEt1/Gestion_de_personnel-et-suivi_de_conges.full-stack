from django.core.management.base import BaseCommand
from django.utils import timezone
import time
from conges.models import Conge, DemandeConge

class Command(BaseCommand):
    help = "Rollover annuel des congés (01 janvier UTC)"

    def handle(self, *args, **options):
        # year = 2028
        year = timezone.now().year
        count = 0

        for conge in Conge.objects.all():
            if conge.annee < year:
                conge.rollover_to_new_year(year)
                count += 1

        if count > 0:
            self.stdout.write(self.style.SUCCESS(
                f"{count} conge(s) mis à jour pour l'annee {year}"
            ))
            time.sleep(5)
