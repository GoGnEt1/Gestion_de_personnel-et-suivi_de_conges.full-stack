from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, PasswordResetCode, UserPreferences
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from personnel.serializers import PersonnelSerializer
# from django.contrib.auth import get_user_model

# class CustomUserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = CustomUser
#         fields = '__all__'


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['matricule'] = user.matricule
        token['role'] = 'admin' if user.is_staff else 'utilisateur'
        token['is_staff'] = True if user.is_superuser else user.is_staff
        token['is_superuser'] = user.is_superuser
        token['id'] = user.id
        if hasattr(user, 'personnel') and user.personnel:
            token['personnel'] = PersonnelSerializer(user.personnel).data
            # token['prenoms'] = user.personnel.prenoms
            # token['nom'] = user.personnel.nom
            # token['profile_picture'] = user.personnel.photo.url if user.personnel.photo else None
        else:
            # token['prenoms'] = None
            # token['nom'] = None
            token['personnel'] = None
        return token
    
class PasswordResetRequestSerializer(serializers.Serializer):
    matricule = serializers.CharField()

class CodeVerificationSerializer(serializers.Serializer):
    matricule = serializers.CharField()
    code = serializers.CharField()

class ResetPasswordSerializer(serializers.Serializer):
    matricule = serializers.CharField()
    new_password = serializers.CharField()
    confirm_password = serializers.CharField()

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        return data

# User = CustomUser = get_user_model()
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value
    def validate(self, data):
        user = self.context['request'].user
        print("user", user)
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError("L'ancien mot de passe est incorrect")
        
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        return data
    
    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
    
class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = '__all__'

class PersonnelPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['photo']
        
