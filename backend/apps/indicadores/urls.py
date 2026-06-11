from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import IndicadorFilialViewSet, IndicadorKpiViewSet

router = DefaultRouter()
router.register('kpis', IndicadorKpiViewSet, basename='indicador-kpi')
router.register('filiais', IndicadorFilialViewSet, basename='indicador-filial')

urlpatterns = [
    path('', include(router.urls)),
]
