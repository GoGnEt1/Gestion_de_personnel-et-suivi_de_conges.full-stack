from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'personnels', views.PersonnelViewSet)

urlpatterns = [
    path('', include(router.urls)),
        # path("export/<str:format>/", views.export_personnels, name="export_personnels"),

    # path('export_excel/', views.export_personnels_excel, name='export_excel'),
    # path('export_pdf/', views.export_personnels_pdf, name='export_pdf'),
    # nouvelle route pour fiche individuelle
    # path('personnel/<int:personnel_id>/fiche_pdf/', views.export_fiche_pdf, name='export_fiche_pdf'),

    # path('my-profile/', views.MyProfileView.as_view(), name='my-profile'),
]