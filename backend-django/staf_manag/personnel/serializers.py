from rest_framework import serializers
from .models import Personnel


class PersonnelSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='user.role', default='utilisateur')
    is_staff = serializers.BooleanField(source='user.is_staff', default=False)
    is_active = serializers.BooleanField(source='user.is_active', default=True)
    is_superuser = serializers.BooleanField(source='user.is_superuser', default=False)
    
    #  localisation du personnel
    adresse = serializers.CharField(source='user.adresse', required=False)
    ville = serializers.CharField(source='user.ville', required=False)
    pays = serializers.CharField(source='user.pays', default='Tunisie')
    code_postal = serializers.IntegerField(source='user.code_postal', required=False)
    telephone_mobile = serializers.CharField(source='user.telephone_mobile', required=False)
    lieu_naissance = serializers.CharField(source='user.lieu_naissance', required=False)
    niveau_etudes = serializers.CharField(source='user.niveau_etudes', required=False)
    birthday = serializers.DateField(source='user.birthday', required=False)
    certificats_academiques = serializers.CharField(source='user.certificats_academiques', required=False)
    nationalite = serializers.CharField(source='user.nationalite', required=False)
    
    situation_familiale = serializers.CharField(source='user.situation_familiale', required=False)
    nombre_enfants = serializers.IntegerField(source='user.nombre_enfants', required=False)
    partenaire = serializers.CharField(source='user.partenaire', required=False)

    class Meta:
        model = Personnel
        fields = '__all__'
        
    def create(self, validated_data):
        user_data = validated_data.pop('user', {})
        personnel = Personnel.objects.create(**validated_data)

        # mise à jours des champs liés à user
        user = personnel.user
        user.role = 'admin' if user.is_staff else 'utilisateur'
        user.is_staff = user_data.get('is_staff', user.is_staff)
        user.is_superuser = user_data.get('is_superuser', user.is_superuser)
        user.is_active = user_data.get('is_active', user.is_active)

        user.adresse = user_data.get('adresse', user.adresse)
        user.ville = user_data.get('ville', user.ville)
        user.pays = user_data.get('pays', user.pays)
        user.nationalite = user_data.get('nationalite', user.nationalite)
        user.code_postal = user_data.get('code_postal', user.code_postal)
        user.telephone_mobile = user_data.get('telephone_mobile', user.telephone_mobile)
        user.situation_familiale = user_data.get('situation_familiale', user.situation_familiale)
        user.nombre_enfants = user_data.get('nombre_enfants', user.nombre_enfants)
        user.partenaire = user_data.get('partenaire', user.partenaire)
        user.birthday = user_data.get('birthday', user.birthday)
        user.certificats_academiques = user_data.get('certificats_academiques', user.certificats_academiques)
        user.lieu_naissance = user_data.get('lieu_naissance', user.lieu_naissance)
        user.niveau_etudes = user_data.get('niveau_etudes', user.niveau_etudes)

        user.save()

        return personnel
    
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # mise à jours des champs liés à user
        user = instance.user
        # if 'role' in user_data:
        user.role = 'admin' if user.is_staff else 'utilisateur'
        if 'is_staff' in user_data:
            user.is_staff = user_data.get('is_staff', user.is_staff)
        if 'is_superuser' in user_data:
            user.is_superuser = user_data.get('is_superuser', user.is_superuser)
        if 'is_active' in user_data:
            user.is_active = user_data.get('is_active', user.is_active)

        user.adresse = user_data.get('adresse', user.adresse)
        user.ville = user_data.get('ville', user.ville)
        user.pays = user_data.get('pays', user.pays)
        user.nationalite = user_data.get('nationalite', user.nationalite)
        user.code_postal = user_data.get('code_postal', user.code_postal)
        user.telephone_mobile = user_data.get('telephone_mobile', user.telephone_mobile)
        user.situation_familiale = user_data.get('situation_familiale', user.situation_familiale)
        user.nombre_enfants = user_data.get('nombre_enfants', user.nombre_enfants)
        user.partenaire = user_data.get('partenaire', user.partenaire)
        user.birthday = user_data.get('birthday', user.birthday)
        user.certificats_academiques = user_data.get('certificats_academiques', user.certificats_academiques)        
        user.lieu_naissance = user_data.get('lieu_naissance', user.lieu_naissance)
        user.niveau_etudes = user_data.get('niveau_etudes', user.niveau_etudes)
        
        user.save()

        return instance

class PersonnelPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Personnel
        fields = ['photo']
        