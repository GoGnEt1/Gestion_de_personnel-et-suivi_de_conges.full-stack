from rest_framework import serializers
from .models import Conge, DemandeConge, RegleConge
from personnel.models import Personnel
from django.core.exceptions import ValidationError as DjangoValidationError
from personnel.serializers import PersonnelSerializer
from django.utils import timezone
from staf_manag.utils.conges import to_decimal

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
    class Meta:
        model = DemandeConge
        fields = '__all__'
        read_only_fields = ['annee','statut', 'id','personnel', 'conge', 'date_validation', 'date_annulation',  'annule']

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

        #  valider le type de demande
        type_demande = data.get('type_demande', 'standard')
        conge_demande = data.get('conge_demande', 0)
        conge_total_dispo = (
            to_decimal(conge.conge_restant_annee_n_1)
            + to_decimal(conge.conge_restant_annee_n_2)
            + sum(
                to_decimal(v) for v in conge.conge_mensuel_restant.values()
                if isinstance(v, (int, float)) or 0
            )
        )

        if type_demande == 'standard':
            if to_decimal(conge_demande) > to_decimal(conge_total_dispo):
                raise serializers.ValidationError({ "conge_demande_non_valide": f"Solde de congé insuffisant. Disponible: {conge_total_dispo} jours." })

        elif type_demande == 'exceptionnel':
            if to_decimal(conge_demande) > to_decimal(conge.conge_exceptionnel):
                raise serializers.ValidationError({ "conge_demande_non_valide": f"Solde de congé exceptionnel insuffisant. Disponible: {conge.conge_exceptionnel} jours." })
         
        elif type_demande == 'compensatoire':
            reste = to_decimal(conge.conge_compensatoire)
            if to_decimal(conge_demande) > reste:
                raise serializers.ValidationError({ "conge_demande_non_valide": f"Solde de congé compensatoire insuffisant. Disponible: {conge.conge_compensatoire} jours." })
            
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
            'annee', 
            'date_maj',
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
    