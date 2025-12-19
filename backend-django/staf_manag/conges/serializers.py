from rest_framework import serializers
from .models import Conge, DemandeConge, RegleConge
from personnel.models import Personnel
from django.core.exceptions import ValidationError as DjangoValidationError
from personnel.serializers import PersonnelSerializer
from django.utils import timezone

class RegleCongeSerializer(serializers.ModelSerializer):
    modifie_par = serializers.SerializerMethodField()
    class Meta:
        model = RegleConge
        fields = '__all__'

    def create(self, validated_data):
        validated_data['modifie_par'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data['modifie_par'] = self.context['request'].user
        return super().update(instance, validated_data)

    def get_modifie_par(self, obj):
        if obj.modifie_par and obj.modifie_par.personnel:
            personnel = obj.modifie_par.personnel
            return {
                'id': personnel.id,
                'nom': personnel.nom,
                'prenoms': personnel.prenoms,
                'matricule': personnel.matricule,
            }
        return None
class DemandeCongeSerializer(serializers.ModelSerializer):
    personnel = PersonnelSerializer(read_only=True)
    conge = serializers.PrimaryKeyRelatedField(read_only=True)
    # personnel = serializers.PrimaryKeyRelatedField(queryset=Personnel.objects.all())
    class Meta:
        model = DemandeConge
        fields = '__all__'
        read_only_fields = ['annee','statut', 'periode','date_soumission', 'date_validation', 'date_annulation',  'annule']

    def get_demandes(self, obj):
        last_demande = (
            DemandeConge.objects
            .filter(personnel=obj.personnel, annee=obj.annee)
            .order_by('-date_soumission')
            .first()
        )
        if last_demande:
            return DemandeCongeSerializer(last_demande).data
        return None
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user

        validated_data['personnel'] = user.personnel
        validated_data['annee'] = timezone.now().year
        conge = Conge.objects.filter(personnel=validated_data['personnel'], annee=validated_data['annee']).first()
        if not conge:
            raise serializers.ValidationError("Le conge n'existe pas pour cette personne")
        
        validated_data['conge'] = conge
        return super().create(validated_data)
    
    def validate(self, data):
        request = self.context.get('request')
        user = request.user

        data['personnel'] = user.personnel
        data['annee'] = timezone.now().year

        conge = Conge.objects.filter(personnel=data['personnel'], annee=data['annee']).first()
        if not conge:
            raise serializers.ValidationError("Le conge n'existe pas pour cette personne")
        
        data['conge'] = conge
        # on instancie la demande sans la sauvegarder
        instance = DemandeConge(**data)

        try:
            instance.full_clean()
        except DjangoValidationError as e:
            # on renvoie les messages d'erreurs du modèle en erreurs DRF
            raise serializers.ValidationError(e.message_dict)
        return data
    
class CongeSerializer(serializers.ModelSerializer):
    personnel = PersonnelSerializer(read_only=True)
    demandes = DemandeCongeSerializer(many=True, read_only=True)
    class Meta:
        model = Conge
        fields = '__all__'
        read_only_fields = [
            'annee', 'conge_restant_annee_n_1', 'conge_restant_annee_n_2', 'conge_restant_annee_courante',
            'conge_total', 'date_maj',
        ]
    
    def validate(self, data):
        instance = Conge(**data)
        if getattr(self, 'instance', None):
            # merge champs non fournis avec instance
            for attr, val in self.instance.__dict__.items():
                if attr.startswith('_') or attr in ['_state']:
                    continue
                if attr not in data:
                    setattr(instance, attr, val)
        try:
            instance.full_clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return data
    

