from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.tests import auth_headers
from apps.audit.models import AuditLog
from apps.financeiro.models import PagarTitulo, ReportBatch

User = get_user_model()


class FinanceiroReportTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='fin_reports',
            password='fin123',
            role_id='2',
            environments=['Financeiro'],
            filiais={'Financeiro': ['Ibiporã (Matriz)', 'Rondonópolis']},
        )
        self.batch = ReportBatch.objects.create(
            label='##T01',
            reference_date=date(2026, 6, 10),
            is_active=True,
            imported_pagar=True,
        )
        for index in range(15):
            PagarTitulo.objects.create(
                batch=self.batch,
                filial='Ibiporã (Matriz)' if index % 2 == 0 else 'Rondonópolis',
                cod_forn=f'F{index:03d}',
                fornecedor=f'Fornecedor {index}',
                titulo=f'T{index:04d}',
                tipo='NF',
                emissao='01/06/2026',
                vencimento='10/06/2026',
                vencimento_real='10/06/2026',
                valor=Decimal('100.00'),
                saldo=Decimal('100.00'),
                historico='',
            )

    def test_pagar_report_returns_paginated_shape(self):
        response = self.client.get(
            '/api/financeiro/reports/pagar/?page=1&page_size=10',
            **auth_headers(self.user, 'Financeiro'),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 15)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIn('codForn', response.data['results'][0])

    def test_finalize_batch_creates_audit_log(self):
        other = ReportBatch.objects.create(
            label='##T02',
            reference_date=date(2026, 6, 9),
            is_active=False,
        )
        before = AuditLog.objects.count()
        response = self.client.post(
            f'/api/financeiro/batches/{other.pk}/finalize/',
            **auth_headers(self.user, 'Financeiro'),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(AuditLog.objects.count(), before + 1)
        self.assertTrue(AuditLog.objects.filter(action='financeiro.lote.ativado').exists())

    def test_cash_adjustment_create_creates_audit_log(self):
        before = AuditLog.objects.count()
        response = self.client.post(
            '/api/financeiro/adjustments/',
            {
                'date': '2026-06-10',
                'type': 'Entrada',
                'value': 1500,
                'observation': 'Teste auditoria',
                'user': 'fin_reports',
            },
            format='json',
            **auth_headers(self.user, 'Financeiro'),
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(AuditLog.objects.count(), before + 1)
        self.assertTrue(AuditLog.objects.filter(action='financeiro.ajuste.criado').exists())
