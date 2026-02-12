from django.shortcuts import render
from rest_framework import viewsets, permissions, status #, filters
from rest_framework.response import Response
# from rest_framework.views import APIView
from rest_framework.decorators import action, parser_classes
# from django_filters.rest_framework import DjangoFilterBackend

# from conges.views import IsAdminOrOwner
from rest_framework.parsers import MultiPartParser, FormParser
import pandas as pd
from django.http import JsonResponse 
from django.db.models import Q
from staf_manag.pandas_import import parse_date

from django.utils import timezone
# from datetime import timedelta

from .serializers import PersonnelSerializer, DemandeSerializer
from .models import Personnel, Demande
from accounts.models import CustomUser
from staf_manag.utils.email_utils import send_html_email
from django.conf import settings

# les imports pour exporter les personnels
from django.http import HttpResponse
from .export_utils import generate_excel
from django.http import JsonResponse

# les imports pour importer les personnels
import zipfile
import shutil
from pathlib import Path
from django.conf import settings
from . import import_helpers # module hypothétique pour fonctions réutilisables

from rest_framework.permissions import BasePermission

class IsAdminOrPersonnelOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False

        # Admin = OK
        if user.is_staff or user.is_superuser:
            return True

        # Owner = OK
        if hasattr(user, "personnel") and user.personnel:
            return obj.id == user.personnel.id

        return False

# extraction ZIP sécurisée (empêcher path transversal)
def safe_extract_zip(zip_path:Path, dest_dir: Path, overwrite: bool=True) -> tuple:
    """
    Extraire zip_path dans dest_dir en verifiant les chemins.
    Retourne (succes True/False, message list)
    """
    message=[]
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # verification anti path transversal
            for member in zip_ref.namelist():
                member_path = dest_dir.joinpath(member)
                if not str(member_path.resolve()).startswith(str(dest_dir.resolve())):
                    return False, [f"Chemin non autorisé dans l'archive: {member}"]
            
            # extraction
            for member in zip_ref.infolist():
                target_path = dest_dir.joinpath(member.filename)
                # si dossier -> le créer
                if member.is_dir():
                    target_path.mkdir(parents=True, exist_ok=True)
                    continue
                # assurer les parents
                target_path.parent.mkdir(parents=True, exist_ok=True)
                # ecraser ou non selon flag
                if target_path.exists() and not overwrite:
                    message.append(f"Fichier existant: {member.filename}")
                    continue
                with zip_ref.open(member) as source_f, open(target_path, 'wb') as target_f:
                    shutil.copyfileobj(source_f, target_f)
            message.append(f"Extraction effectuée")
        return True, message
    except zipfile.BadZipFile as e:
        return False, [f"Le fichier n'est pas un zip: {e}"]
    except Exception as e:
        return False, [f"Une erreur s'est produite lors de l'extraction ZIP: {e}"]

def test_https(request):
    return JsonResponse({
        "is_secure": request.is_secure(),
        "scheme": request.scheme,
        "forwarded_proto": request.META.get("HTTP_X_FORWARDED_PROTO"),
        "absolute": request.build_absolute_uri("/medias/test.png"),
    })
class IsAdminUser(permissions.BasePermission):
    """
    Permission personnalisée: s'assurer que l'utilisateur est admin
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser
    
ALLOWED_MEDIA_FIELDS = {
    "pv_affectation",
    "cv",
    "decret_officiel",
    "fiche_fonction",
    "fiche_module_fr",
    "fiche_module_en",
}
class PersonnelViewSet(viewsets.ModelViewSet):
    queryset = Personnel.objects.all()
    serializer_class = PersonnelSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPersonnelOwner]

    def perform_update(self, serializer):
        # empêcher l'user de toucher les champs matricule, cin, grade,...
        user = self.request.user
        user.role = 'admin' if user.is_staff else 'utilisateur'


        if not user.is_superuser:
            restricted_fields = ['matricule', 'cin', 'grade', 'date_affectation', 'date_passage_grade', 'ecole_origine', 'specialite', 'pv_affectation', 'cv', 'decret_officiel', 'fiche_fonction', 'fiche_module_fr', 'fiche_module_en']
            for field in restricted_fields:
                if field in serializer.validated_data:
                    serializer.validated_data.pop(field)
        serializer.save()

    # on cree les personnel via formulaire
    def create(self, request, *args, **kwargs):
        data=request.data
        serializer = self.get_serializer(data=data)

        if Personnel.objects.filter(matricule=data['matricule']).exists():
            return Response({"error": "Ce matricule est deja utilisé"}, status=status.HTTP_400_BAD_REQUEST)
        # sinon si matricule est < 8 ou > 8 alphanumeriques, renvoyer une erreur
        if len(data['matricule']) != 8:
            return Response({"error": "Matricule doit contenir 8 alphanumeriques"}, status=status.HTTP_400_BAD_REQUEST)
        if Personnel.objects.filter(cin=data['cin']).exists():
            return Response({"error": "Ce cin est deja utilisé"}, status=status.HTTP_400_BAD_REQUEST)
        if len(data['cin']) != 8:
            return Response({"error": "Cin doit contenir 8 alphanumeriques"}, status=status.HTTP_400_BAD_REQUEST)
        if serializer.is_valid(raise_exception=True):
            
            serializer.save()
            headers = self.get_success_headers(serializer.data)
            return Response({"message": "Personnel créé avec succès!", "data": headers}, status=status.HTTP_201_CREATED)
            
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    # Implementation de la methode import_personnel_from_excel
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser, permissions.IsAuthenticated])
    @parser_classes([MultiPartParser, FormParser])
    def import_personnel_from_excel(self, request):
        fichier = request.FILES.get('fichier')
        if not fichier:
            return JsonResponse({"error": "Veuillez fournir un fichier."}, status=status.HTTP_400_BAD_REQUEST)
        
        # choisi un format de fichier excel "xlsx", "xls"
        extensions = fichier.name.split('.')[-1].lower()
        try:
            df = None
            if extensions in ['xlsx', 'xls']:
                df = pd.read_excel(fichier)
                df.columns = [col.strip().lower() for col in df.columns]
            else:
                return JsonResponse({"error": "Veuillez fournir un fichier Excel."}, status=status.HTTP_400_BAD_REQUEST)

            # ignorer les colonnes non desirées
            expected_columns = [
                'nom et prénom', 'grade', 'spécialité', "etablissement d'origine",
                'cin', 'matricule', 'telephone', 'n° téléphone', 'adresse e-mail', "date d'affectation", 'date de passage de grade'
            ]
            
            extra_colunms = [col for col in df.columns if col not in expected_columns]
          
            nb_inserts = 0
            doub = 0
            nb_total = len(df)
            personnels_ignores = []

            for _, row in df.iterrows():
                try:
                    # nettoyage des champs
                    cin = str(row.get('cin', '')).strip() if pd.notna(row.get('cin')) else ''
                    matricule = str(row.get('matricule', '')).strip() if pd.notna(row.get('matricule')) else ''
                    
                    if not cin or not matricule:
                        personnels_ignores.append("cin ou matricule vide")
                        continue
                
                    # Ignorer les doublons
                    if not Personnel.objects.filter(Q(cin=cin) | Q(matricule=matricule)).exists():
                        nomComplet = str(row['nom et prénom']).strip().split(' ', 1)
                        nom = nomComplet[0]
                        prenoms = nomComplet[1] if len(nomComplet) > 1 else ""
                        grade = str(row.get('grade')).strip()
                        email=str(row.get('adresse e-mail')).strip()

                        Personnel.objects.create(
                            nom=nom,
                            prenoms=prenoms,
                            grade=grade,
                            specialite=row.get('spécialité', ''),
                            ecole_origine=row.get("etablissement d'origine", 'FSG'),
                            cin=cin,
                            matricule=matricule,
                            telephone=row.get('n° téléphone', ''), #or row.get('telephone', ''),
                            email=email,
                            date_passage_grade=parse_date(row.get('date de passage de grade')),
                            date_affectation=parse_date(row.get("date d'affectation")),
                        )
                        nb_inserts += 1

                        # verifier les doublons
                    elif matricule and Personnel.objects.filter(matricule=matricule).exists():
                        personnels_ignores.append(f"Matricule: {row['matricule']}")
                        doub += 1
                        continue
                    elif cin and Personnel.objects.filter(cin=cin).exists():
                        personnels_ignores.append(f"CIN: {row['cin']}")
                        doub += 1
                        continue
                    else:
                        continue
                except Exception as e:
                    personnels_ignores.append(f"Ligne ignorée (erreur: {e})")
            return JsonResponse({
                "message": f"{nb_inserts} personnels importés avec succès sur {nb_total} ignorés ( {doub} doublons)",
                "personnels_ignores": personnels_ignores,
                "colonnes_ignorees": extra_colunms if extra_colunms else None,
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
   
    # Implementation de la methode export_personnel_to_excel
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    @parser_classes([MultiPartParser, FormParser])
    def export_personnel(self, request):
        columns = request.GET.get("columns", "").split(",")
        lang = request.GET.get("lang", "fr")
        base_url = request.build_absolute_uri('/')[:-1]  # pour créer des liens complets


        if not columns or columns == [""]:
            return HttpResponse("Aucune colonnes spécifié", status=400)
        
        personnels = Personnel.objects.all().order_by('id')

        buffer = generate_excel(personnels, columns, lang, base_url=base_url)
        response = HttpResponse(
            # buffer,
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="personnels_fsg.xlsx"'

        return response

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        user = request.user
        

        personnel = getattr(user, 'personnel', None)
        if not personnel:
            return Response({"detail": "Aucun personnel associé à cet utilisateur."}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.method.lower() == 'get':
            data = self.get_serializer(personnel, context={'request': request}).data
            data['is_active'] = user.is_active
            data['role'] = user.role
            data['is_staff'] = user.is_staff
            data['is_superuser'] = user.is_superuser

            data['birthday'] = user.birthday
            data['certificats_academiques'] = user.certificats_academiques
            data['nationalite'] = user.nationalite

            data['adresse'] = user.adresse
            data['ville'] = user.ville
            data['pays'] = user.pays
            data['code_postal'] = user.code_postal
            data['telephone_mobile'] = user.telephone_mobile
            data['situation_familiale'] = user.situation_familiale
            data['nombre_enfants'] = user.nombre_enfants
            data['partenaire'] = user.partenaire
            # serializer = PersonnelSerializer(user.personnel)
            return Response(data, status=status.HTTP_200_OK)
        
        if request.method.lower() == 'patch':
            serializer = self.get_serializer(personnel, data=request.data, partial=True, context={'request': request})
            serializer.is_valid(raise_exception=True)

            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({"detail": "Méthode non autorisée"}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_profile(self, request):
        personnel = getattr(request.user, 'personnel', None)
        if not personnel:
            return Response({"detail": "Aucun personnel associé à cet utilisateur."}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES.get('photo')
        if not file:
            return Response({"detail": "Veuillez fournir une photo"}, status=status.HTTP_400_BAD_REQUEST)
        
        personnel.photo = file
        personnel.save()
        return Response({"message": "Photo de profil mis à jour avec succès!"}, status=status.HTTP_200_OK)

    # action DRF pour importer via ZIP + Excel
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    @parser_classes([MultiPartParser, FormParser])
    def import_zip_excel(self, request):
        """
        Endpoint pour importer:
        - on accepte: 'zip' (le fichier zip), 'fichier' (excel) optionnel.
        - si le zip contient l'excel, on l'utilise; sinon on utilise 'fichier' uploadé.
        - le zip est extrait dans BASE_DIR/doc_excel_personnel/
        """
        zip_file = request.FILES.get('zip')  # clé 'zip'
        excel_file = request.FILES.get('fichier')  # clé 'fichier' (optionnel)
        overwrite_files = request.data.get('overwrite', 'true').lower() == 'true'

        base_docs_dir = Path(settings.BASE_DIR) / "doc_excel_personnel"
        base_docs_dir.mkdir(parents=True, exist_ok=True)

        temp_dir = base_docs_dir / "tmp_import"
        # nettoie temp si existe
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
        temp_dir.mkdir(parents=True, exist_ok=True)

        try:
            # 1) si zip fourni -> l'enregistrer temporairement et extraire
            if zip_file:
                tmp_zip_path = temp_dir / zip_file.name
                with open(tmp_zip_path, "wb") as f:
                    for chunk in zip_file.chunks():
                        f.write(chunk)

                ok, messages = safe_extract_zip(tmp_zip_path, base_docs_dir, overwrite=overwrite_files)
                if not ok:
                    # cleanup temp
                    shutil.rmtree(temp_dir)
                    return Response({"error": "Extraction échouée", "details": messages}, status=status.HTTP_400_BAD_REQUEST)
            # 2) déterminer l'excel à utiliser: si excel_file fourni -> priorité, sinon chercher un .xlsx dans base_docs_dir ou dans temp_dir
            excel_path = None
            if excel_file:
                # sauvegarde l'excel dans temp_dir pour lecture
                tmp_excel = temp_dir / excel_file.name
                with open(tmp_excel, "wb") as f:
                    for chunk in excel_file.chunks():
                        f.write(chunk)
                excel_path = tmp_excel
            else:
                # cherche un fichier excel dans base_docs_dir racine (ou dossier tmp si zip contenait excel)
                candidates = list(base_docs_dir.glob("*.xls*"))
                if candidates:
                    # si plusieurs, prends le plus récent
                    excel_path = sorted(candidates, key=lambda p: p.stat().st_mtime, reverse=True)[0]

            if not excel_path or not excel_path.exists():
                shutil.rmtree(temp_dir)
                return Response({"error": "Aucun fichier Excel trouvé (uploadez 'fichier' ou incluez l'excel dans le zip)."}, status=status.HTTP_400_BAD_REQUEST)

            # 3) lire l'excel en dataframe (pandas)
            # import pandas as pd
            df = pd.read_excel(excel_path)
            # normalise colonnes
            df.columns = [str(c).strip().lower() for c in df.columns]

            # 4) appeler ta fonction d'import existante (adapte selon ta fonction)
            # j'appelle ici une fonction helper que tu dois définir: import_df_and_attach_files(df, base_docs_dir)
            # from . import import_helpers  # module hypothétique pour fonctions réutilisables
            result = import_helpers.import_df_and_attach_files(df, base_docs_dir)

            # cleanup temp
            shutil.rmtree(temp_dir)
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            # nettoyage du temp
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
            return Response({"error": f"Erreur serveur: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def upload_media(self, request, pk=None):
        """
        Admin only: upload file to a specific media field.
        body: form-data { "field": "cv", "file": <file> }
        """
        personnel = self.get_object()
        field = request.data.get("field")
        file = request.FILES.get("file")
        if not field or field not in ALLOWED_MEDIA_FIELDS:
            return Response({"detail": "Champ 'field' invalide."}, status=status.HTTP_400_BAD_REQUEST)
        if not file:
            return Response({"detail": "Fichier manquant."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        is_admin = user.is_staff or user.is_superuser
        is_owner = (
            hasattr(user, "personnel")
            and user.personnel
            and user.personnel.id == personnel.id
        )

        if field == "cv":
            if not (is_admin or is_owner):
                return Response(
                    {"detail": "Vous ne pouvez modifier que votre propre CV."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            if not is_admin:
                return Response(
                    {"detail": "Seuls les administrateurs peuvent modifier ce fichier."},
                    status=status.HTTP_403_FORBIDDEN
                )

        setattr(personnel, field, file)
        personnel.save(update_fields=[field])
        return Response({"message": f"{field} mis à jour."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def delete_media(self, request, pk=None):
        """
        Admin only: supprimer le media d'un champ.
        body JSON: {"field": "cv"}
        """
        personnel = self.get_object()
        field = request.data.get("field")
        if not field or field not in ALLOWED_MEDIA_FIELDS:
            return Response({"detail": "Champ 'field' invalide."}, status=status.HTTP_400_BAD_REQUEST)

        current = getattr(personnel, field)
        if not current:
            return Response({"detail": "Aucun fichier à supprimer."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        is_admin = user.is_staff or user.is_superuser
        is_owner = (
            hasattr(user, "personnel")
            and user.personnel
            and user.personnel.id == personnel.id
        )

        # tout utilisateur peut uploader son CV, mais seulement admin peut aussi uploader le cv et autre chose
        if field == "cv":
            if not (is_admin or is_owner):
                return Response(
                    {"detail": "Vous ne pouvez supprimer que votre propre CV."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            if not is_admin:
                return Response(
                    {"detail": "Seuls les administrateurs peuvent supprimer ce fichier."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Supprimer le fichier physique si besoin
        try:
            current.delete(save=False)
        except Exception:
            pass

        setattr(personnel, field, None)
        personnel.save(update_fields=[field])
        return Response({"message": f"{field} supprimé."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def view_media(self, request, pk=None):
        """
        Authenticated: retourne le fichier en mode inline pour ouvrir dans un nouvel onglet.
        GET /api/personnels/{pk}/view_media/?field=cv
        """
        personnel = self.get_object()
        field = request.query_params.get("field")
        if not field or field not in ALLOWED_MEDIA_FIELDS:
            return Response({"detail": "Champ 'field' invalide."}, status=status.HTTP_400_BAD_REQUEST)

        filefield = getattr(personnel, field)
        if not filefield:
            return Response({"detail": "Fichier introuvable."}, status=status.HTTP_404_NOT_FOUND)

        filepath = filefield.path
        if not filepath:
            return Response({"detail": "Fichier introuvable sur le serveur."}, status=status.HTTP_404_NOT_FOUND)

        # Content type
        mime_type, _ = mimetypes.guess_type(str(filepath))
        try:
            # FileResponse stream: content-disposition inline => ouvre dans l'onglet
            response = FileResponse(open(filepath, 'rb'), content_type=mime_type or 'application/octet-stream')
            filename = filefield.name.split("/")[-1]
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response
        except FileNotFoundError:
            raise Http404

# demandes/views.py
class DemandeViewSet(viewsets.ModelViewSet):
    queryset = Demande.objects.all()
    serializer_class = DemandeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPersonnelOwner]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Demande.objects.all().order_by("-date_soumission")
        return Demande.objects.filter(personnel=user.personnel).order_by("-date_soumission")

class DemandeViewSet(viewsets.ModelViewSet):
    queryset = Demande.objects.all()
    serializer_class = DemandeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPersonnelOwner]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Demande.objects.all().order_by("-date_soumission")
        return Demande.objects.filter(personnel=user.personnel).order_by("-date_soumission")

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser]
    )
    def last_demande_sortie(self, request):
        personnel_id = request.query_params.get("personnel_id")

        if not personnel_id:
            return Response(
                {"detail": "personnel_id est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        demande = (
            Demande.objects
            .filter(
                personnel_id=personnel_id,
                type_demande="sortie"
            )
            .order_by("-date_soumission")
            .first()
        )

        if not demande:
            return Response(
                {"detail": "Aucune demande de sortie trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(demande)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser]
    )
    def last_demande_attestation(self, request):
        personnel_id = request.query_params.get("personnel_id")

        if not personnel_id:
            return Response(
                {"detail": "personnel_id est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        demande = (
            Demande.objects
            .filter(
                personnel_id=personnel_id,
                type_demande="attestation"
            )
            .order_by("-date_soumission")
            .first()
        )

        if not demande:
            return Response(
                {"detail": "Aucune demande d'attestation trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(demande)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser])
    def approuver(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != "en_attente":
            return Response({"detail": "Vous ne pouvez approuver que les demandes en attente."}, status=status.HTTP_400_BAD_REQUEST)
        demande.statut = "approuve"
        demande.date_validation = timezone.now()
        demande.save()

        to_mail = demande.personnel.email or None
        if to_mail:
            type_demande = demande.type_demande
            lien = settings.DJANGO_API_URL + "login"

            send_html_email(
                subject=f"Demande de {type_demande} approuvée",
                template="demande_approuver.html",
                context={
                    "demande": demande,
                    "user": request.user,
                    "year": timezone.now().year,
                    "lien_espace": lien,
                    "type_demande": type_demande
                },
                recipient_list=to_mail
            )
        return Response({"message": "Demande approuvée."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser])
    def refuser(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != "en_attente":
            return Response({"detail": "Vous ne pouvez refuser que les demandes en attente."}, status=status.HTTP_400_BAD_REQUEST)
        demande.statut = "refuse"
        demande.save()

        to_mail = demande.personnel.email or None
        if to_mail:
            type_demande = demande.type_demande
            lien = settings.DJANGO_API_URL + "login"

            send_html_email(
                subject=f"Demande de {type_demande} refusée",
                template="demande_refuser.html",
                context={
                    "demande": demande,
                    "user": request.user,
                    "year": timezone.now().year,
                    "lien_espace": lien
                },
                recipient_list=to_mail
            )
        return Response({"message": "Demande refusée."})
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def demande_form(self, request):
        user = request.user
        if not user.personnel:
            return Response({"detail": "Aucun personnel associé à cet utilisateur."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        demande = serializer.save()
        # envoie une notificatons à l'admin par email
        
        lien = settings.DJANGO_API_URL

        # recuperons le premier user admin qui a le même email que celui configurer dans settings settings.EMAIL_HOST_USER
        # envoie une notificatons à l'admin par email
        admin_email = str(settings.EMAIL_HOST_USER).strip()
        if admin_email:
            personnel = Personnel.objects.filter(email=admin_email).first()
            admin_user = CustomUser.objects.filter(personnel=personnel).first() if personnel else request.user
   
        if admin_user.is_authenticated:
            lien_espace = lien + "dashboard/admin"
        else:
            lien_espace = lien + "login"
        
        if demande.type_demande == "sortie":
            date_sortie = demande.date_sortie.strftime("%d/%m/%Y")
            heure_sortie = demande.heure_sortie.strftime("%H:%M")
            heure_retour = demande.heure_retour.strftime("%H:%M")

            send_html_email(
                subject="Nouvelle demande de sortie",
                template="demande_sortie.html",
                context={
                    "demande": demande,
                    "user": admin_user,
                    "year": timezone.now().year,
                    "lien_espace": lien_espace,
                    "date_sortie": date_sortie,
                    "heure_sortie": heure_sortie,
                    "heure_retour": heure_retour
                },
                recipient_list=admin_email
            )
        elif demande.type_demande == "attestation":
            nbr_copies = demande.nombre_copies
            langue_certificat = demande.get_langue_display()

            send_html_email(
                subject="Nouvelle demande d'attestation",
                template="demande_attestation.html",
                context={
                    "demande": demande,
                    "user": admin_user,
                    "year": timezone.now().year,
                    "lien_espace": lien_espace,
                    "nbr_copies": nbr_copies,
                    "langue_certificat": langue_certificat
                },
                recipient_list=admin_email
            )
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)
       