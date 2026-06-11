from rest_framework import viewsets

from apps.accounts.mixins import ModuleScopedViewMixin

from .models import IndicadorFilial, IndicadorKpi
from .serializers import IndicadorFilialSerializer, IndicadorKpiSerializer


class IndicadorKpiViewSet(ModuleScopedViewMixin, viewsets.ReadOnlyModelViewSet):
    permission_module = 'Indicadores'
    serializer_class = IndicadorKpiSerializer
    queryset = IndicadorKpi.objects.all()

    def get_queryset(self):
        # KPIs são consolidados — acesso controlado só pelo módulo/filial da sessão.
        return self.scope_queryset(IndicadorKpi.objects.all(), filial_field=None)


class IndicadorFilialViewSet(ModuleScopedViewMixin, viewsets.ReadOnlyModelViewSet):
    permission_module = 'Indicadores'
    serializer_class = IndicadorFilialSerializer
    queryset = IndicadorFilial.objects.all()

    def get_queryset(self):
        return self.scope_queryset(IndicadorFilial.objects.all(), filial_field='filial')
