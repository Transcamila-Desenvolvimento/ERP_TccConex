import datetime
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Role
from apps.audit.services import record_audit

from .serializers import (
    CreateUserSerializer,
    LoginSerializer,
    RoleSerializer,
    UpdateUserSerializer,
    UserSerializer,
)

User = get_user_model()


def generate_jwt_token(user):
    payload = {
        'user_id': user.id,
        'username': user.username,
        'name': user.name,
        'role_id': user.role_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(
            minutes=settings.JWT_SETTINGS.get('ACCESS_TOKEN_LIFETIME_MINUTES', 60)
        )
    }
    token = jwt.encode(
        payload, 
        settings.SECRET_KEY, 
        algorithm=settings.JWT_SETTINGS.get('ALGORITHM', 'HS256')
    )
    return token


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            return Response(
                {"detail": "Nome de usuário ou senha incorretos."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {"detail": "Nome de usuário ou senha incorretos."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_currently_active:
            return Response(
                {"detail": "Este usuário foi desativado pela administração."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Update last login time
        user.last_login = datetime.datetime.now()
        user.save()

        record_audit(user, 'login', 'Login realizado com sucesso.')

        # Generate JWT Access token
        token = generate_jwt_token(user)

        user_data = UserSerializer(user).data

        return Response({
            "token": token,
            "user": user_data
        }, status=status.HTTP_200_OK)


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    """Lista papéis disponíveis para atribuição a usuários (somente admin)."""
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not request.user.is_admin:
            self.permission_denied(
                request,
                message="Acesso negado. Apenas administradores possuem acesso a este recurso.",
            )


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    CRUD Endpoint for managing users, restricted to admin users.
    """
    queryset = User.objects.all().order_by('-id')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateUserSerializer
        return UserSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        # Check permissions - only role_id == '1' (Admin) can manage users
        if not request.user.is_admin:
            self.permission_denied(
                request, 
                message="Acesso negado. Apenas administradores possuem acesso a este recurso."
            )

    def perform_create(self, serializer):
        user = serializer.save()
        record_audit(
            self.request.user,
            'usuario.criado',
            f'Usuário {user.username} criado.',
        )

    def perform_update(self, serializer):
        user = serializer.save()
        record_audit(
            self.request.user,
            'usuario.atualizado',
            f'Usuário {user.username} atualizado.',
        )

    def perform_destroy(self, instance):
        username = instance.username
        super().perform_destroy(instance)
        record_audit(
            self.request.user,
            'usuario.excluido',
            f'Usuário {username} excluído.',
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id == request.user.id:
            return Response(
                {"detail": "Não é permitido excluir seu próprio usuário conectado."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        user_to_toggle = self.get_object()
        if user_to_toggle.id == request.user.id:
            return Response(
                {"detail": "Não é permitido alterar o status do seu próprio usuário."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_to_toggle.status = 'inativo' if user_to_toggle.status == 'ativo' else 'ativo'
        user_to_toggle.save()
        record_audit(
            request.user,
            'usuario.status',
            f'Usuário {user_to_toggle.username} alterado para {user_to_toggle.status}.',
        )
        return Response({
            "id": user_to_toggle.id,
            "username": user_to_toggle.username,
            "status": user_to_toggle.status
        }, status=status.HTTP_200_OK)
