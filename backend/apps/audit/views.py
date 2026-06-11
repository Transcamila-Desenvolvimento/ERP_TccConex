from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Lista logs de auditoria — somente administradores."""
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not request.user.is_admin:
            self.permission_denied(
                request,
                message='Acesso negado. Apenas administradores possuem acesso a este recurso.',
            )
