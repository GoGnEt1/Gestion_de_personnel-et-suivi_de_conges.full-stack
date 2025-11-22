from django.urls import path, include
from rest_framework.routers import DefaultRouter
from conges.views import RegleCongeViewSet, CongeViewSet, DemandeCongeViewSet

router = DefaultRouter()
router.register(r'', CongeViewSet, basename='conges')
router.register(r'demande-conge', DemandeCongeViewSet, basename='demande-conge')
router.register(r'regle-conge', RegleCongeViewSet, basename='regle-conge')
urlpatterns = [
    path('', include(router.urls)),
    # path('regle-conge/get_regle_courante/', RegleCongeViewSet.as_view({'get': 'get_regle_courante'}), name='get_regle_courante'),
    # path('', CongeViewSet.as_view({'get': 'list', 'post': 'create'}), name='conges'),
    # path('<int:pk>/valider/', CongeViewSet.as_view({'post': 'valider'}), name='valider'),
    # path('<int:pk>/refuser/', CongeViewSet.as_view({'post': 'refuser'}), name='refuser'),
]