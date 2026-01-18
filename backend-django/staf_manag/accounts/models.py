from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from personnel.models import Personnel
from django.utils import timezone
from django.conf import settings

class CustomUserManager(BaseUserManager):
    def create_user(self, matricule, password=None, role='utilisateur', **extra_fields):
        if not matricule:
            raise ValueError("L'utilisateur doit avoir un matricule")
        # email = self.normalize_email(email)
        user = self.model(matricule=matricule, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, matricule, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(matricule, password, **extra_fields)
       
class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('utilisateur', 'Utilisateur'),
    ]
    SITUATION_FAMILIALE_CHOICE = [
        ('celibat', 'Célibataire'),
        ('veuf', 'Veuf (ve)'),
        ('divorce', 'Divorcé (e)'),
        ('marie', 'Marié (e)'),
    ]
    # username = models.CharField(max_length=255, unique=True, blank=True, null=True)
    matricule = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='utilisateur')
    double_auth = models.BooleanField(default=False)
     
     #  localisation du personnel
    adresse = models.CharField(max_length=255, blank=True, null=True)
    ville = models.CharField(max_length=255, blank=True, null=True, default='Gabès')
    pays = models.CharField(max_length=255, default='Tunisie', blank=True, null=True)
    code_postal = models.IntegerField(blank=True, null=True)
    telephone_mobile = models.CharField(max_length=30, blank=True, null=True)

    birthday = models.DateField(blank=True, null=True)
    lieu_naissance = models.CharField(max_length=255, blank=True, null=True)
    niveau_etudes = models.CharField(max_length=255, blank=True, null=True)
    certificats_academiques = models.TextField(blank=True, null=True)
    nationalite = models.CharField(max_length=255, blank=True, null=True, default='Tunisienne')

    situation_familiale = models.CharField(max_length=50, choices=SITUATION_FAMILIALE_CHOICE, blank=True,null=True)
    nombre_enfants = models.IntegerField(blank=True, null=True)
    partenaire = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    personnel = models.OneToOneField(Personnel, on_delete=models.SET_NULL, null=True, blank=True, related_name='user')

    objects = CustomUserManager()
    
    USERNAME_FIELD = 'matricule'
    REQUIRED_FIELDS = []
    
    def __str__(self):
        return f"{self.personnel.__str__()} ({self.role})"
    
    def save(self, *args, **kwargs):
        if (self.is_staff or self.is_superuser) and self.role != 'admin':
            self.role = 'admin'
        if self.is_superuser:
            self.is_staff = True
        super().save(*args, **kwargs)
class PasswordResetCode(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    attempts = models.IntegerField(default=0)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        if self.is_used:
            return False
        return timezone.now() - self.created_at < timezone.timedelta(seconds=settings.PASSWORD_RESET_CODE_EXPIRATION_SECONDS)
    
    def __str__(self):
        return f"Code pour {self.user.matricule}"
    
class UserPreferences(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='preferences')
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=False)

    def __str__(self):
        return f"Préférences de {self.user.matricule}"

# 
class TrustedDevice(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='trusted_devices')
    device_id = models.CharField(max_length=128, unique=True)  # uuid généré côté client
    # name = models.CharField(max_length=150, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_used = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Device de {self.user.matricule} : {self.device_id[:8]}"
    
    def is_valid(self) -> bool:
        if self.expires_at:
            return timezone.now() < self.expires_at
        return True