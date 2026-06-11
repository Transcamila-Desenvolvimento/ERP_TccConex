from django.contrib.auth import get_user_model
from rest_framework import serializers

from .constants import sanitize_environments, sanitize_filiais, sanitize_permissions
from .models import Role

User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['permissions'] = sanitize_permissions(data.get('permissions'))
        return data

ALL_BRANCHES = ['Ibiporã (Matriz)', 'Rondonópolis', 'Paranaguá']
ADMIN_ENVS = ['Administração', 'Financeiro', 'Indicadores']
ADMIN_FILIAIS = {env: list(ALL_BRANCHES) for env in ['Financeiro', 'Indicadores']}


class UserSerializer(serializers.ModelSerializer):
    roleId = serializers.CharField(source='role_id')
    lastLogin = serializers.DateTimeField(source='last_login', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'roleId', 'status', 'environments', 'filiais', 'lastLogin']
        read_only_fields = ['id', 'lastLogin']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['environments'] = sanitize_environments(data.get('environments'))
        data['filiais'] = sanitize_filiais(data.get('filiais'))
        return data


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class CreateUserSerializer(serializers.ModelSerializer):
    roleId = serializers.CharField(source='role_id', required=False, default='2')
    password = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'roleId', 'status', 'environments', 'filiais', 'password']
        read_only_fields = ['id']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Nome de usuário já existe.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None) or '123456'

        user = User.objects.create(**validated_data)
        user.set_password(password)

        if user.role_id == '1':
            user.environments = list(ADMIN_ENVS)
            user.filiais = {k: list(v) for k, v in ADMIN_FILIAIS.items()}
        else:
            user.environments = sanitize_environments(user.environments)
            user.filiais = sanitize_filiais(user.filiais)

        user.save()
        return user


class UpdateUserSerializer(serializers.ModelSerializer):
    roleId = serializers.CharField(source='role_id', required=False)
    password = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'roleId', 'status', 'environments', 'filiais', 'password']
        read_only_fields = ['id', 'username']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        if instance.role_id == '1':
            instance.environments = list(ADMIN_ENVS)
            instance.filiais = {k: list(v) for k, v in ADMIN_FILIAIS.items()}
        else:
            instance.environments = sanitize_environments(instance.environments)
            instance.filiais = sanitize_filiais(instance.filiais)

        instance.save()
        return instance
