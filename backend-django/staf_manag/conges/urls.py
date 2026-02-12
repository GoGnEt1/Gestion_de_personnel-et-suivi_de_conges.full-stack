from django.urls import path, include
from rest_framework.routers import DefaultRouter
from conges.views import RegleCongeViewSet, CongeViewSet, DemandeCongeViewSet

router = DefaultRouter()
router.register(r'', CongeViewSet, basename='conges')
router.register(r'demande-conge', DemandeCongeViewSet, basename='demande-conge')
router.register(r'regle-conge', RegleCongeViewSet, basename='regle-conge')
urlpatterns = [
    path('', include(router.urls)),
]