from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LoginAPIView, RoleViewSet, UserManagementViewSet, UserProfileAPIView

router = DefaultRouter()
router.register('roles', RoleViewSet, basename='role')
router.register('users', UserManagementViewSet, basename='user-management')

urlpatterns = [
    path('login/', LoginAPIView.as_view(), name='auth-login'),
    path('profile/', UserProfileAPIView.as_view(), name='auth-profile'),
    path('', include(router.urls)),
]
