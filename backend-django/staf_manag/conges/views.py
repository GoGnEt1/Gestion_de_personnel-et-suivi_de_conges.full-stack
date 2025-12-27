from django.shortcuts import render
from django.contrib import messages
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from conges.serializers import CongeSerializer, DemandeCongeSerializer, RegleCongeSerializer
from django.utils import timezone
from django.db import transaction
from datetime import datetime
# from personnel.views import IsAdminUser

from django.conf import settings
from django.core.mail import send_mail

from staf_manag.utils.email_utils import send_html_email
from staf_manag.utils.conges import to_decimal, COL_MAP, detect_header_row, safe_value, normalize, get_col


# from .pagination import StandardReesultatsSetPagination
# from django_filters.rest_framework import DjangoFilterBackend

from conges.models import Conge, DemandeConge, RegleConge
from personnel.models import Personnel
from staf_manag.forms import UploadFileForm
from staf_manag.pandas_import import lire_docx, parse_date

import pandas as pd

class IsAdminUser(permissions.BasePermission):
    """
    Permission personnalisée: s'assurer que l'utilisateur est admin
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser
    
class IsAdminOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Admin peut faire tout; utilisateur peut voir ses propre conge
        if request.user.is_staff:
            return True
        try:
            return hasattr(obj.personnel, 'user') and obj.personnel.user == request.user
            # return getattr(request.user, 'personnel', None) == obj.personnel
        except Exception:
            return False
        
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class RegleCongeViewSet(viewsets.ModelViewSet):
    queryset = RegleConge.objects.all().order_by('-date_maj')
    serializer_class = RegleCongeSerializer
    permission_classes = [permissions.IsAuthenticated,permissions.IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser, permissions.IsAuthenticated])
    def get_regle_courante(self, request):
        regles = RegleConge.objects.order_by('-date_maj')[:2]
        if not regles.exists():
            return Response({"error": "Aucune règle définie."}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(RegleCongeSerializer(regles, many=True).data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser, permissions.IsAuthenticated])
    def get_all_regles(self, request):
        regles = RegleConge.objects.order_by('-date_maj')
        if not regles.exists():
            return Response({"error": "Aucune règle définie."}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(RegleCongeSerializer(regles, many=True).data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser, permissions.IsAuthenticated])
    def regle_form(self, request):
        data = request.data

        ancienne = RegleConge.objects.order_by('-date_maj').first()
        regle= RegleConge.objects.create(
            conge_initial_tech=data.get('conge_initial_tech') or ancienne.conge_initial_tech if ancienne else 72,
            conge_initial_autres=data.get('conge_initial_autres') or ancienne.conge_initial_autres if ancienne else 45,
            modifie_par=request.user,
        )
        return Response(RegleCongeSerializer(regle).data, status=status.HTTP_200_OK)
        
class CongeViewSet(viewsets.ModelViewSet):
    queryset = Conge.objects.all()
    serializer_class = CongeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwner]

    def get_queryset(self):
        user = self.request.user
        today = timezone.now().date()
        qs = Conge.objects.select_related('personnel').order_by('-annee')

        # si admin et un filtre personnel_id est passé -> filtrer par ce personnel
        if user.is_staff:
            personnel_id = self.request.query_params.get('personnel_id') or self.request.query_params.get('personnel')
            if personnel_id:
                qs = qs.filter(personnel__id=personnel_id)
            return qs

        # si utilisateur classique -> ne retourne que ses conges
        else:
            if hasattr(user, 'personnel'):
                qs = qs.filter(personnel__user=user.personnel)
            else:
                return Conge.objects.none()
        # recal automatique à la consultation
        for c in qs:
            if c.annee != today.year:
                c.recalculer_acquisition_mensuelle(as_of=today, save=True)

        return qs
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def import_conges(self, request):
        fichier = request.FILES.get('fichier')
        if not fichier:
            return Response({"error": "Veuillez fournir un fichier."}, status=status.HTTP_400_BAD_REQUEST)
        
        # choisi un format de fichier excel "xlsx", "xls"
        extensions = fichier.name.split('.')[-1].lower()
        if extensions in ['xlsx', 'xls']:
            # df = pd.read_excel(fichier)
            df_row = pd.read_excel(fichier, header=None)
            header_now = detect_header_row(df_row)

            df = pd.read_excel(fichier, header=header_now)
            df.columns = [normalize(col) for col in df.columns] 
        else:
            return Response({"error": "Veuillez fournir un fichier Excel."}, status=status.HTTP_400_BAD_REQUEST)

        print("Colonnes normalisées détectées :", df.columns.tolist())

        logs = []
        annee = timezone.now().year
        for _, row in df.iterrows():
            matricule = get_col(row, COL_MAP["matricule"])
            if not matricule or pd.isna(matricule):
                continue
            matricule = str(matricule).strip()

            reste_n_2 = get_col(row, COL_MAP["reste_n_2"])
            reste_n_1 = get_col(row, COL_MAP["reste_n_1"])
            reste_n = get_col(row, COL_MAP["reste_n"])
            compensation = get_col(row, COL_MAP["compensation"])
            exceptionnel = get_col(row, COL_MAP["exceptionnel"])
            print("MAT:", matricule)
            print("N-2:", reste_n_2, "N-1:", reste_n_1, "N:", reste_n, "Compensation:", compensation, "Exceptionnel:", exceptionnel)

            try:
                personnel = Personnel.objects.get(matricule=matricule)
                conge, created = Conge.objects.get_or_create(personnel=personnel, annee=annee)

                reste_n_2 = safe_value(reste_n_2, conge.conge_restant_annee_n_2)
                reste_n_1 = safe_value(reste_n_1, conge.conge_restant_annee_n_1)
                reste_n = safe_value(reste_n, conge.conge_restant_annee_courante)
                compensation = safe_value(compensation, conge.conge_compensatoire)
                exceptionnel = safe_value(exceptionnel, conge.conge_exceptionnel)

                conge.conge_restant_annee_n_2 = to_decimal(reste_n_2)
                conge.conge_restant_annee_n_1 = to_decimal(reste_n_1)
                conge.conge_restant_annee_courante = to_decimal(reste_n)
                conge.conge_compensatoire = to_decimal(compensation)
                conge.conge_exceptionnel = (exceptionnel)

                # print("Colonnes détectées :", list(df.columns))

                conge.recalculer_total_conges(save=False)

                conge.save()
                logs.append(f"Congé de {matricule} pour l'annee {conge.annee} mis à jour avec success.")
            except Personnel.DoesNotExist:
                logs.append(f"Matricule {matricule} introuvable.")
            except Conge.DoesNotExist:
                logs.append(f"Congé de {matricule} pour l'annee {conge.annee} introuvable.")

        return Response({"logs": logs}, status=status.HTTP_200_OK)
    
        
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser, permissions.IsAuthenticated])
    def modifier_conges(self, request):
        matricule = request.data.get('matricule')

        if not matricule:
            return Response({"error": "Veuillez fournir un matricule."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            personnel = Personnel.objects.get(matricule=matricule)
            conge, _ = Conge.objects.get_or_create(
                personnel=personnel,
                annee=timezone.now().year
            )

            fields = [
                "conge_restant_annee_n_2",
                "conge_restant_annee_n_1",
                "conge_restant_annee_courante",
                "conge_exceptionnel",
                "conge_compensatoire",
            ]

            for field in fields:
                if field in request.data and request.data[field] not in ["", None]:
                    setattr(conge, field, to_decimal(request.data[field]))

            conge.recalculer_total_conges()
            conge.full_clean()
            conge.save()

            # return Response(
            #     {"message": "Congés mis à jour avec succès"},
            #     status=200
            # )
            return Response({"message": f"Congé de {matricule} pour l'annee {conge.annee} mis à jour avec success."}, status=status.HTTP_200_OK)
        except Personnel.DoesNotExist:
            return Response({"error": f"Matricule {matricule} introuvable."}, status=status.HTTP_400_BAD_REQUEST)
        except Conge.DoesNotExist:
            return Response({"error": f"Congé de {matricule} pour l'annee {conge.annee} introuvable."}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def personnel_by_matricule(self, request):
        matricule = request.query_params.get("matricule")
        if not matricule:
            return Response(status=400)

        try:
            p = Personnel.objects.get(matricule=matricule)
            return Response({
                "nom_prenoms": f"{p.nom} {p.prenoms}",
                "cin": p.cin,
                "grade": p.grade
            })
        except Personnel.DoesNotExist:
            return Response({"error": "Introuvable"}, status=404)

message_list = []       
class DemandeCongeViewSet(viewsets.ModelViewSet):
    queryset = DemandeConge.objects.all()
    serializer_class = DemandeCongeSerializer
    permission_classes = [permissions.IsAuthenticated,IsAdminOrOwner]

    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return DemandeConge.objects.select_related('personnel').all().order_by('-date_soumission')
        if getattr(user, 'personnel', None):
            return DemandeConge.objects.select_related('personnel').filter(personnel__user=user).order_by('-date_soumission')
        return DemandeConge.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.is_staff:
            personnel = serializer.validated_data.get('personnel', None)
            if not personnel:
                raise serializer.ValidationError({"personnel": "Le champ 'personnel' est requis pour l'administrateur."})
            serializer.save()
        else:
            # user normal → crée sa propre demande
            serializer.save(personnel=user.personnel)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdminUser])
    def valider(self, request, pk=None):
        with transaction.atomic():
            global message_list
            demande = DemandeConge.objects.select_for_update().get(pk=pk)
            if demande.annule:
                return Response({"detail": "Demande annulée par l'utilisateur."}, status=status.HTTP_400_BAD_REQUEST)
            if demande.statut == 'valide':
                return Response({"detail": "Congé deja validé."}, status=status.HTTP_400_BAD_REQUEST)
            if demande.is_locked():
                return  Response({"detail": "Délai de modification expiré."}, status=status.HTTP_403_FORBIDDEN)
            
            fin_actuelle = datetime.strptime(demande.periode.split(" - ")[1].strip(), "%d/%m/%Y").date()

            # verifier les demandes de congés de=éjà validés
            demande_valides = DemandeConge.objects.filter(personnel=demande.personnel, statut='valide', annee=demande.annee).exclude(pk=demande.pk)

            for d in demande_valides:
                fin_last_valide = datetime.strptime(d.periode.split(" - ")[1].strip(), "%d/%m/%Y").date()

                if fin_last_valide and fin_actuelle < fin_last_valide:
                    return Response({"detail": f"Impossible de valider cette demande de congé car une demande plus récente {d.periode} a déjà été validée."}, status=status.HTTP_400_BAD_REQUEST)
            
               
            try:
                demande.valider()
            except DjangoValidationError as e:
                if hasattr(e, 'message_dict'):
                    for k, v in e.message_dict.items():
                        if isinstance(v, (list, tuple)):
                            for m in v:
                                message_list.append(str(m))
                        else:
                            message_list.append(str(v))
                else:
                    # e.messages est souvent une liste de messages non-fields
                    if hasattr(e, 'messages'):
                        for m in e.messages:
                            message_list.append(str(m))
                    else:
                        message_list.append(str(e))

                return Response({"errors": e.message_dict, "detail": message_list}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        # envoie une notificatons à l'utilisateur par email de validation de sa demande de conge
        to_mail = demande.personnel.email or None
        if to_mail:
            date_debut = demande.periode.split(" - ")[0]
            date_retour = demande.periode.split(" - ")[1]

            send_html_email(
                subject="Demande de conge validée",
                template="conge_valide.html",
                context={
                    "conge": demande,
                    "user": demande,
                    "year": timezone.now().year,
                    "lien_espace": "https://192.168.100.13/login",
                    "date_retour": date_retour,
                    "date_debut": date_debut
                },
                recipient_list=to_mail
            )
        return Response({"message": "Congé validé."}, status=status.HTTP_200_OK)
            
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdminUser])
    def refuser(self, request, pk=None):
        with transaction.atomic():
            global message_list
            demande = DemandeConge.objects.select_for_update().get(pk=pk)
            if demande.annule:
                return Response({"detail": "Demande annulée par l'utilisateur."}, status=status.HTTP_400_BAD_REQUEST)
            if demande.statut == 'refuse':
                return Response({"detail": "Congé deja refusé."}, status=status.HTTP_400_BAD_REQUEST)
            if demande.is_locked():
                return  Response({"detail": "Délai de modification expiré."}, status=status.HTTP_403_FORBIDDEN)
            
            try:
                demande.refuser()
            except DjangoValidationError as e:
                if hasattr(e, 'message_dict'):
                    return Response({"errors": e.message_dict}, status=status.HTTP_400_BAD_REQUEST)
                return Response({"detail": e.messages}, status=status.HTTP_400_BAD_REQUEST)
            
            except Exception as e:
                return Response({"message": "Une erreur est survenue."}, status=status.HTTP_400_BAD_REQUEST)
            
            date_debut = demande.periode.split(" - ")[0]
            date_retour = demande.periode.split(" - ")[1]
        # envoie une notificatons à l'utilisateur par email de refus de sa demande de conge
        to_mail = demande.personnel.email or None
        if to_mail:
            if message_list:
                motif = ' | '.join(message_list)
            else:
                motif = "Raisons techniques."
            send_html_email(
                subject="Demande de congé refusée",
                template="conge_refuse.html",
                context={
                    "conge": demande,
                    "user": demande,
                    "year": timezone.now().year,
                    "lien_espace": "https://192.168.100.13/login",
                    "date_retour": date_retour,
                    "date_debut": date_debut,
                    "motif": motif
                },
                recipient_list=to_mail
            )
        return Response({"message": "Congé refusé."}, status=status.HTTP_200_OK)
        
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def annuler(self, request, pk=None):
        demande = self.get_object()
        # seul l'user peut annuler sa demande si statut = 'attente'
        # if request.user.is_staff:
            # return Response({"detail": "Les admins ne peuvent pas annuler ici"}, status=status.HTTP_403_FORBIDDEN)
        if getattr(request.user, 'personnel', None) != demande.personnel:
            return Response({"detail": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)
        if demande.statut != 'en_attente':
            return Response({"detail": "Vous ne pouvez annuler que les demandes en attente"}, status=status.HTTP_400_BAD_REQUEST)
        if demande.annule:
            return Response({"message": "Congé deja annulé."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            demande.annule = True
            demande.save()
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        date_debut = demande.periode.split(" - ")[0]
        date_retour = demande.periode.split(" - ")[1]

        # envoie une notificatons à l'admin par email
        admin_email = settings.EMAIL_HOST_USER
        if request.user.is_authenticated:
            lien_espace = "https://192.168.100.13/dashboard/admin"
        else:
            lien_espace = "https://192.168.100.13/login"
        send_html_email(
            subject="Demande de congé annulée",
            template="conge_annule.html",
            context={
                "conge": demande,
                "user": request.user,
                "year": timezone.now().year,
                "lien_espace": lien_espace,
                "date_retour": date_retour,
                "date_debut": date_debut
            },
            recipient_list=admin_email
        )
        return Response({"detail": "Demande annulée"}, status=status.HTTP_200_OK)
    
    # Formulaire de demande
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def demande_form(self, request):
        user = request.user
        if not user.personnel:
            return Response({"detail": "Aucun personnel associé à cet utilisateur."}, status=status.HTTP_400_BAD_REQUEST)
        
        conge = Conge.objects.filter(personnel=user.personnel, annee=timezone.now().year).first()
        if not conge:
            return Response({"detail": "Aucun conge associé à cet utilisateur."}, status=status.HTTP_400_BAD_REQUEST)
       
        serializer = self.get_serializer(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            demande = serializer.save()
            # demande = serializer.save(personnel=user.personnel, conge=conge)
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict'):
                return Response({"errors": e.message_dict}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"detail": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # envoie une notificatons à l'admin par email
        date_debut = demande.periode.split(" - ")[0]
        date_retour = demande.periode.split(" - ")[1]

        # envoie une notificatons à l'admin par email
        admin_email = settings.EMAIL_HOST_USER
        if request.user.is_authenticated:
            lien_espace = "https://192.168.100.13/dashboard/admin"
        else:
            lien_espace = "https://192.168.100.13/login"
        send_html_email(
            subject="Nouvelle demande de congés",
            template="demande_conge.html",
            context={
                "conge": demande,
                "user": request.user,
                "year": timezone.now().year,
                "lien_espace": lien_espace,
                "date_retour": date_retour,
                "date_debut": date_debut
            },
            recipient_list=admin_email
        )
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mes_demandes(self, request):
        # liste des demandes de congés au cours de l'année ordonnées de la plus recente
        user = request.user
        if not getattr(user, 'personnel', None):
            return Response([], status=status.HTTP_200_OK)
        annee= timezone.now().year
        qs = DemandeConge.objects.filter(personnel=user.personnel, annee=annee).order_by('-date_soumission')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def demandes(self, request):
        qs = DemandeConge.objects.select_related('personnel').all().order_by('-date_soumission')
        
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
 
    