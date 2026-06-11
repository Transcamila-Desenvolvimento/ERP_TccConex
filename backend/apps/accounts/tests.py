from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.views import generate_jwt_token

User = get_user_model()


def auth_headers(user, env='Financeiro', filial=''):
    headers = {
        'HTTP_AUTHORIZATION': f'Bearer {generate_jwt_token(user)}',
        'HTTP_X_PROTHON_ENVIRONMENT': env,
    }
    if filial:
        headers['HTTP_X_PROTHON_FILIAL'] = filial
    return headers


class AuthAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin_test',
            password='admin123',
            role_id='1',
            name='Admin Test',
            environments=['Administração', 'Financeiro', 'Indicadores'],
            filiais={
                'Financeiro': ['Ibiporã (Matriz)'],
                'Indicadores': ['Ibiporã (Matriz)'],
            },
        )
        self.operator = User.objects.create_user(
            username='oper_test',
            password='oper123',
            role_id='2',
            name='Operador Test',
            environments=['Financeiro'],
            filiais={'Financeiro': ['Ibiporã (Matriz)']},
        )

    def test_login_success_returns_token(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'admin_test',
            'password': 'admin123',
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)

    def test_login_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'admin_test',
            'password': 'wrong',
        })
        self.assertEqual(response.status_code, 401)

    def test_profile_requires_authentication(self):
        response = self.client.get('/api/auth/profile/')
        self.assertIn(response.status_code, (401, 403))

    def test_profile_with_valid_token(self):
        response = self.client.get('/api/auth/profile/', **auth_headers(self.admin))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'admin_test')

    def test_non_admin_cannot_manage_users(self):
        response = self.client.get('/api/auth/users/', **auth_headers(self.operator, 'Administração'))
        self.assertEqual(response.status_code, 403)

    def test_admin_can_list_users(self):
        response = self.client.get('/api/auth/users/', **auth_headers(self.admin, 'Administração'))
        self.assertEqual(response.status_code, 200)


class ModulePermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.finance_user = User.objects.create_user(
            username='fin_user',
            password='fin123',
            role_id='2',
            environments=['Financeiro'],
            filiais={'Financeiro': ['Ibiporã (Matriz)']},
        )
        self.indicadores_user = User.objects.create_user(
            username='ind_user',
            password='ind123',
            role_id='2',
            environments=['Indicadores'],
            filiais={'Indicadores': ['Ibiporã (Matriz)']},
        )

    def test_financeiro_denied_with_wrong_environment_header(self):
        response = self.client.get(
            '/api/financeiro/batches/',
            **auth_headers(self.finance_user, 'Indicadores', 'Ibiporã (Matriz)'),
        )
        self.assertEqual(response.status_code, 403)

    def test_indicadores_requires_filial_in_session(self):
        response = self.client.get(
            '/api/indicadores/kpis/',
            **auth_headers(self.indicadores_user, 'Indicadores'),
        )
        self.assertEqual(response.status_code, 403)

    def test_indicadores_allowed_with_filial(self):
        response = self.client.get(
            '/api/indicadores/kpis/',
            **auth_headers(self.indicadores_user, 'Indicadores', 'Ibiporã (Matriz)'),
        )
        self.assertEqual(response.status_code, 200)
