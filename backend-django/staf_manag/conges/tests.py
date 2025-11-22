from django.test import TestCase

# Create your tests here.
# def test_personnel_recent_ne_peut_pas_demander(db, django_user_model, client):
#     # créer personnel affecté aujourd'hui
#     p = Personnel.objects.create(nom="X", prenoms="Y", matricule="M001", cin="C001", ...)
#     user = CustomUser.objects.create_user(matricule="M001", password="M001", personnel=p)
#     conge = Conge.objects.create(personnel=p)
#     conge.initialiser()
#     # créer demande 1 jour
#     dem = DemandeConge(personnel=p, conge=conge, conge_demande=1, debut_conge=date.today())
#     with pytest.raises(ValidationError):
#         dem.clean()
