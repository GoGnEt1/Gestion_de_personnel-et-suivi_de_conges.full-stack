from django.db import models

class Personnel(models.Model):
    # GRADE_CHOICES = [
    #     ('ouvrier', 'Ouvrier'),
    #     ('administrateur', 'Administrateur'),
    #     ('technicien', 'Technicien'),
    # ]

    nom = models.CharField(max_length=150)
    prenoms = models.CharField(max_length=150)
    grade = models.CharField(max_length=255)
    rang = models.CharField(max_length=255, blank=True, null=True)
    specialite = models.CharField(max_length=150)
    ecole_origine = models.CharField(max_length=150)
    cin = models.CharField(max_length=20, unique=True)
    matricule = models.CharField(max_length=20, unique=True)
    telephone = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    pv_affectation = models.FileField(upload_to='pv/', blank=True, null=True)
    cv = models.FileField(upload_to='cv/', blank=True, null=True)
    decret_officiel = models.FileField(upload_to='decrets/', blank=True, null=True)
    fiche_fonction = models.FileField(upload_to='fiche_fonction/', blank=True, null=True)
    date_affectation = models.DateField()
    date_passage_grade = models.DateField()
    fiche_module_fr = models.FileField(upload_to='fiche_module/fr/', blank=True, null=True)
    fiche_module_en = models.FileField(upload_to='fiche_module/en/', blank=True, null=True)

    # profil
    photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    
    def __str__(self):
        return f"{self.nom} {self.prenoms} - {self.grade}"
    
class Demande(models.Model):
    TYPE_DEMANDE = [
        # ("conge", "Demande de congés"),
        ("sortie", "Demande de sortie"),
        ("attestation", "Demande d'attestation de travail"),
    ]

    STATUT = [
        ("en_attente", "En attente"),
        ("approuve", "Approuvée"),
        ("refuse", "Refusée"),
    ]

    LANGUES = [
        ("fr", "Français"),
        ("en", "Anglais"),
        ("ar", "Arabe"),
    ]

    personnel = models.ForeignKey(Personnel, on_delete=models.CASCADE, related_name='demandes')
    type_demande = models.CharField(max_length=50, choices=TYPE_DEMANDE)
    date_soumission = models.DateTimeField(auto_now_add=True, editable=False)
    date_validation = models.DateTimeField(null=True, blank=True, editable=False)
    motif = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT, default='en_attente')

    date_sortie = models.DateField(null=True, blank=True)
    heure_sortie = models.TimeField(null=True, blank=True)
    heure_retour = models.TimeField(null=True, blank=True)

    nombre_copies = models.PositiveIntegerField(null=True, blank=True, default=1)
    langue = models.CharField(max_length=20, choices=LANGUES, default='ar')

    class Meta:
        ordering = ["-date_soumission"]
    def __str__(self):
        return f"{self.personnel} - {self.type_demande} ({self.statut})"