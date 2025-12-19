from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import (
    CustomTokenObtainPairSerializer,
    CodeVerificationSerializer,
    PasswordResetRequestSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer,
    UserPreferencesSerializer
)

import random
import string
# from datetime import timedelta
from django.utils import timezone
# from django.core.mail import send_mail
from staf_manag.utils.email_utils import send_html_email
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from .models import CustomUser, PasswordResetCode, UserPreferences, TrustedDevice
from decouple import config
from rest_framework.decorators import action

from personnel.models import Personnel
from personnel.serializers import PersonnelSerializer

# views.py (imports utiles)
from django.conf import settings
from datetime import timedelta

# views.py
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import uuid
from rest_framework_simplejwt.tokens import RefreshToken

def generate_code(length=5):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def mask_email(email):
    parts = email.split('@')
    username = parts[0]
    domain = parts[1]
    masked_username = username[:2] + '*' * (len(username) - 2)
    return f"{masked_username}@{domain}"


class LoginWithOtpView(APIView):
    """
    1) Vérifie matricule+password.
    2) Si device trusted -> renvoie tokens (obtain_pair)
    3) Sinon -> génère OTP (PasswordResetCode or LoginOTP) et renvoie otp_required flag.
    """
    def post(self, request):
        matricule = request.data.get('matricule')
        password = request.data.get('password')
        device_id = request.data.get('device_id')  # optionnel
        # remember_device = bool(request.data.get("remember_device", False))

        user = authenticate(request, matricule=matricule, password=password)
        if not user:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        # Check trusted device
        # trusted = False
        if device_id:
            trusted = TrustedDevice.objects.filter(user=user, device_id=device_id).first()
            # trusted = TrustedDevice.objects.filter(user=user, device_id=device_id, expires_at__gt=timezone.now()).exists()

            # If trusted and we are allowed to skip OTP -> issue tokens immediately
            if trusted and trusted.is_valid():
                # Mettre à jour last_used
                trusted.last_used = timezone.now()
                trusted.save(update_fields=['last_used'])
                # use TokenObtainPairSerializer to create tokens
                token = CustomTokenObtainPairSerializer.get_token(user)
                access = str(token.access_token)
                refresh = str(token)
                # refresh = RefreshToken.for_user(user)
                # token = CustomTokenObtainPairSerializer.get_token(user)
                # access = str(refresh.access_token)
                # refresh = str(refresh)
                return Response({
                    'access': access,
                    'refresh': refresh,
                    'must_change_password': user.double_auth,
                    'user':PersonnelSerializer(user.personnel).data if hasattr(user, 'personnel') and user.personnel else None
                    # 'user':token
                }, status=status.HTTP_200_OK)

        # Otherwise generate OTP (reuse PasswordResetCode)
        code = "{:06d}".format(random.randint(0, 999999))
        pr_code = PasswordResetCode.objects.create(user=user, code=code)
       # envoyer email (ton impl existante)
        masked = mask_email(user.personnel.email)
        send_html_email(
            subject="Code de connexion",
            template="reset_password_code.html",
            context={
                "user": user,
                "code": code,
                "year": timezone.now().year
            },
            recipient_list=user.personnel.email
        )

        expire_dt = pr_code.created_at + timezone.timedelta(minutes=float(settings.PASSWORD_RESET_CODE_EXPIRATION_MINUTES))
        expire_at_ms = int(expire_dt.timestamp() * 1000)

        return Response({
            "otp_required": True,
            "masked_email": masked,
            "matricule": user.matricule,
            "nom": user.personnel.nom,
            "prenoms": user.personnel.prenoms,
            "expire_at": expire_at_ms,
            "expire_at_iso": expire_dt.isoformat(),
            "message": "Code envoyé par email.",
            "device_id_expected": "generate"  # si on veut que frontend renvoie device_id pour remember
        }, status=status.HTTP_200_OK)

# fin
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RequestResetCodeView(APIView):
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        matricule = serializer.validated_data['matricule']

        try:
            user = CustomUser.objects.get(matricule=matricule)
            personnel = getattr(user, 'personnel', None)
            if not personnel:
                return Response({"error": "Aucun personnel associé."}, status=status.HTTP_404_NOT_FOUND)
            data = PersonnelSerializer(personnel, context={'request': request}).data
            data['nom'] = personnel.nom
            data['prenoms'] = personnel.prenoms
            data['email'] = personnel.email
        except CustomUser.DoesNotExist:
            return Response({"error": "Matricule introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # verification du nbre de tentatives consécutives (24h window)
        recent_codes = PasswordResetCode.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timezone.timedelta(hours=24)
        )
        if recent_codes.count() >= 10:
            return Response({"error": "Trop de tentatives. Réessayer après 24h."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # genere et crée le code
        code = generate_code()
        pr_code = PasswordResetCode.objects.create(user=user, code=code)
        user.double_auth = True
        user.save(update_fields=['double_auth'])

        # calculer expire_at (timestamp en ms depuis epoch) basé sur settings
        expire_minutes = getattr(settings, "PASSWORD_RESET_CODE_EXPIRATION_MINUTES", 2.5)
        expire_delta = timedelta(minutes=float(expire_minutes))
        expire_at_dt = pr_code.created_at + expire_delta

        # convertir en epoch milliseconds (JS-friendly)
        expire_at_ms = int(expire_at_dt.timestamp() * 1000)

        # envoyer email (ton impl existante)
        send_html_email(
            subject="Code de récupération",
            template="reset_password_code.html",
            context={
                "user": user,
                "code": code,
                "year": timezone.now().year
            },
            recipient_list=user.personnel.email
        )

        # préparer la réponse: on renvoie data utilisateur + expire_at + message + masked email
        masked_email = None
        if personnel.email:
            parts = personnel.email.split("@")
            local = parts[0]
            if len(local) <= 2:
                masked_local = local[0] + "*" * (len(local)-1)
            else:
                masked_local = local[0:3] + "*" * (len(local)-2) + local[-2:]
            masked_email = f"{masked_local}@{parts[1]}"

        resp = {
            "message": "Code envoyé par email. Veuillez le vérifier.",
            "nom": personnel.nom,
            "prenoms": personnel.prenoms,
            "masked_email": masked_email,
            "matricule": user.matricule,
            "expire_at": expire_at_ms,
            # tu peux aussi renvoyer expire_at_iso si tu préfères
            "expire_at_iso": expire_at_dt.isoformat(),
        }
        return Response(resp, status=status.HTTP_200_OK)

class VerifyCodeView(APIView):
    def post(self, request):
        serializer = CodeVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        matricule = serializer.validated_data['matricule']
        code = serializer.validated_data['code']

        try:
            user = CustomUser.objects.get(matricule=matricule)
            latest_code = PasswordResetCode.objects.filter(user=user, is_used=False).latest('created_at')
        except (CustomUser.DoesNotExist, PasswordResetCode.DoesNotExist):
            return Response({"error": "Code non trouvé."}, status=status.HTTP_404_NOT_FOUND)
        
        if latest_code.attempts >= 3:
            return Response({"error": "Trop de tentatives."}, status=403)
        
        if not latest_code.is_valid():
            return Response({"error": "Code expiré. Recommencez"}, status=403)
        
        if latest_code.code != code:
            latest_code.attempts += 1
            latest_code.save()
            return Response({"error": "Code incorrect."}, status=400)
        
        # OK : marquer comme utilisé
        latest_code.is_used = True
        latest_code.save()

        # create tokens
        token = CustomTokenObtainPairSerializer.get_token(user)
        access = str(token.access_token)
        refresh_token = str(token)

        # si l'utilisateur veut "remember device", frontend peut envoyer un device_id supplémentaire
        # on peut aussi créer un TrustedDevice ici si device_id fourni
        device_id = request.data.get("device_id")
        trust_device = request.data.get('trust_device') in [True, 'true', 'True', '1', 1]
       
        if trust_device:
            # si pas de device_id envoyé, generate one server side (mais on préfère que client l'envoie)
            if not device_id:
                device_id = str(uuid.uuid4())
            expires_at = timezone.now() + timezone.timedelta(days=30)  # 30 jours
            TrustedDevice.objects.update_or_create(
                user=user,
                device_id=device_id,
                defaults={'expires_at': expires_at}
            )
        
        return Response({
            "message": "Code vérifié",
            "access": access,
            "refresh": refresh_token,
            "must_change_password": getattr(user, "double_auth", False) or getattr(user, "must_change_password", False),
            "device_id": device_id if trust_device else None,
            "user": PersonnelSerializer(user.personnel).data if hasattr(user, "personnel") else None
        }, status=status.HTTP_200_OK)    
    
class ResetPasswordView(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = CustomUser.objects.get(matricule=serializer.validated_data['matricule'])
        except CustomUser.DoesNotExist:
            return Response({"error": "Utilisateur non trouvé."}, status=status.HTTP_404_NOT_FOUND)
        
        user.set_password(serializer.validated_data['new_password'])
        user.double_auth = False
        user.save()

        token = CustomTokenObtainPairSerializer.get_token(user)
        access = str(token.access_token)
        refresh_token = str(token)
        
        return Response({
            "message": "Mot de passe réinitialisé avec succès!",
            "access": access,
            "refresh": refresh_token,
        }, status=status.HTTP_200_OK)



class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        print("DEBUG user: ", request.user, request.user.matricule if hasattr(request.user, 'matricule') else None)
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Mot de passe modifié avec succès!"}, status=status.HTTP_200_OK)
    
class PreferencesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        preferences, _ = UserPreferences.objects.get_or_create(user=user)
        serializer = UserPreferencesSerializer(preferences)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request):
        user = request.user
        preferences, _ = UserPreferences.objects.get_or_create(user=user)
        serializer = UserPreferencesSerializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
