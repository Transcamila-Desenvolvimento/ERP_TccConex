from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/financeiro/', include('apps.financeiro.urls')),
    path('api/indicadores/', include('apps.indicadores.urls')),
    path('api/fs/', include('apps.filesystem.urls')),
    path('api/audit/', include('apps.audit.urls')),
]
