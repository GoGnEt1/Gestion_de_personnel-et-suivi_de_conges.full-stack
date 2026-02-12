from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'personnels', views.PersonnelViewSet)
router.register(r'demandes', views.DemandeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('test_https/', views.test_https, name='test_https'),
]