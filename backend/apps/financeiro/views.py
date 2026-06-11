from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.mixins import ModuleScopedViewMixin
from apps.audit.services import record_audit

from .async_imports import celery_enabled, save_upload
from .billing_import_service import import_billing_xml
from .import_service import import_report_file
from .models import (
    AgingTitulo,
    BalanceHistoryEntry,
    BankAccount,
    BillingRecord,
    CashAdjustment,
    PagarTitulo,
    ReceberTitulo,
    ReportBatch,
)
from .pagination import ReportPagination
from .report_filters import (
    active_batch,
    filter_aging_queryset,
    filter_pagar_queryset,
    filter_receber_queryset,
    report_facets,
)
from .serializers import (
    AgingTituloSerializer,
    BalanceHistoryEntrySerializer,
    BankAccountSerializer,
    BillingRecordSerializer,
    CashAdjustmentSerializer,
    PagarTituloSerializer,
    ReceberTituloSerializer,
    ReportBatchSerializer,
)
from .tasks import import_billing_xml_task, import_report_task


def _report_import_response(report_type: str, file_name: str, result: dict):
    return Response({
        'type': report_type,
        'fileName': file_name,
        'success': result['success'],
        'rowCount': result['rowCount'],
        'skippedRows': result['skippedRows'],
        'issues': result['issues'],
    }, status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST)


class ReportBatchViewSet(ModuleScopedViewMixin, viewsets.ReadOnlyModelViewSet):
    permission_module = 'Financeiro'
    serializer_class = ReportBatchSerializer
    queryset = ReportBatch.objects.select_related('updated_by').all()

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_report(self, request, pk=None):
        batch = self.get_object()
        report_type = request.data.get('type')
        upload = request.FILES.get('file')

        if report_type not in ('pagar', 'receber', 'aging'):
            return Response({'detail': 'Tipo de relatório inválido.', 'success': False, 'issues': []}, status=status.HTTP_400_BAD_REQUEST)
        if not upload:
            return Response({'detail': 'Arquivo não enviado.', 'success': False, 'issues': []}, status=status.HTTP_400_BAD_REQUEST)

        file_bytes = upload.read()
        file_name = upload.name

        if celery_enabled():
            temp_path = save_upload(file_bytes, file_name)
            task = import_report_task.delay(
                str(batch.pk),
                report_type,
                str(temp_path),
                file_name,
                request.user.pk if request.user.is_authenticated else None,
            )
            return Response({'async': True, 'taskId': task.id}, status=status.HTTP_202_ACCEPTED)

        try:
            result = import_report_file(batch, report_type, file_bytes, file_name)
        except Exception as exc:
            return Response({
                'type': report_type,
                'fileName': file_name,
                'success': False,
                'rowCount': 0,
                'skippedRows': 0,
                'issues': [{'severity': 'error', 'message': f'Erro ao processar arquivo: {exc}'}],
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        batch.updated_by = request.user
        batch.save(update_fields=['updated_by'])
        if result['success']:
            record_audit(
                request.user,
                'importacao.relatorio',
                f'Importação {report_type} ({file_name}) — {result["rowCount"]} linha(s).',
            )
        return _report_import_response(report_type, file_name, result)

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        batch = self.get_object()
        ReportBatch.objects.update(is_active=False)
        batch.is_active = True
        batch.updated_by = request.user
        batch.save(update_fields=['is_active', 'updated_by'])
        record_audit(
            request.user,
            'financeiro.lote.ativado',
            f'Lote {batch.label} definido como lote atual.',
        )
        return Response(ReportBatchSerializer(batch).data)


class ActiveReportDataView(ModuleScopedViewMixin, APIView):
    permission_module = 'Financeiro'
    pagination_class = ReportPagination

    def get(self, request, report_type):
        batch = active_batch()
        if not batch:
            paginator = self.pagination_class()
            return paginator.get_paginated_response([])

        params = request.query_params

        if report_type == 'pagar':
            qs = filter_pagar_queryset(PagarTitulo.objects.filter(batch=batch), params, request.user, request)
            serializer_class = PagarTituloSerializer
        elif report_type == 'receber':
            qs = filter_receber_queryset(ReceberTitulo.objects.filter(batch=batch), params, request.user, request)
            serializer_class = ReceberTituloSerializer
        elif report_type == 'aging':
            qs = filter_aging_queryset(AgingTitulo.objects.filter(batch=batch), params, request.user, request)
            serializer_class = AgingTituloSerializer
        else:
            return Response({'detail': 'Tipo inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = serializer_class(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ReportFacetsView(ModuleScopedViewMixin, APIView):
    permission_module = 'Financeiro'

    def get(self, request, report_type):
        if report_type not in ('pagar', 'receber', 'aging'):
            return Response({'detail': 'Tipo inválido.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(report_facets(active_batch(), report_type, request.user, request))


class CeleryTaskStatusView(ModuleScopedViewMixin, APIView):
    permission_module = 'Financeiro'

    def get(self, request, task_id):
        if not celery_enabled():
            return Response({'detail': 'Celery não habilitado.'}, status=status.HTTP_400_BAD_REQUEST)

        from celery.result import AsyncResult

        async_result = AsyncResult(task_id)
        payload = {
            'taskId': task_id,
            'status': async_result.status,
        }
        if async_result.successful():
            payload['result'] = async_result.result
        elif async_result.failed():
            payload['error'] = str(async_result.result)
        return Response(payload)


class BillingRecordViewSet(ModuleScopedViewMixin, viewsets.ModelViewSet):
    permission_module = 'Financeiro'
    serializer_class = BillingRecordSerializer
    queryset = BillingRecord.objects.all()
    http_method_names = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options']

    def get_queryset(self):
        return self.scope_queryset(BillingRecord.objects.all(), 'branch')

    def create(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Criação manual não permitida. Use importação de relatório.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def perform_update(self, serializer):
        record = serializer.save()
        record_audit(
            self.request.user,
            'financeiro.faturamento.atualizado',
            f'Faturamento #{record.pk} ({record.branch}, {record.reference_date}) — R$ {record.value}.',
        )

    def perform_destroy(self, instance):
        record_audit(
            self.request.user,
            'financeiro.faturamento.excluido',
            f'Faturamento #{instance.pk} ({instance.branch}, {instance.reference_date}) excluído.',
        )
        super().perform_destroy(instance)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_xml(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'Arquivo não enviado.', 'success': False}, status=status.HTTP_400_BAD_REQUEST)

        file_bytes = upload.read()

        if celery_enabled():
            temp_path = save_upload(file_bytes, upload.name)
            task = import_billing_xml_task.delay(str(temp_path))
            return Response({'async': True, 'taskId': task.id}, status=status.HTTP_202_ACCEPTED)

        result = import_billing_xml(file_bytes)
        if result['success']:
            record_audit(
                request.user,
                'financeiro.faturamento.importado',
                f'Importação XML ({upload.name}) — R$ {result["totalValue"]:.2f} em {result["totalNotes"]} nota(s).',
            )
        status_code = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
        return Response(result, status=status_code)


class CashAdjustmentViewSet(ModuleScopedViewMixin, viewsets.ModelViewSet):
    permission_module = 'Financeiro'
    serializer_class = CashAdjustmentSerializer
    queryset = CashAdjustment.objects.all()

    def perform_create(self, serializer):
        adj = serializer.save(created_by=self.request.user.username)
        record_audit(
            self.request.user,
            'financeiro.ajuste.criado',
            f'Ajuste ({adj.adjustment_type}) R$ {adj.value} — {(adj.observation or "")[:80]}',
        )

    def perform_update(self, serializer):
        adj = serializer.save(created_by=self.request.user.username)
        record_audit(
            self.request.user,
            'financeiro.ajuste.atualizado',
            f'Ajuste #{adj.pk} atualizado.',
        )

    def perform_destroy(self, instance):
        record_audit(
            self.request.user,
            'financeiro.ajuste.excluido',
            f'Ajuste #{instance.pk} excluído.',
        )
        super().perform_destroy(instance)


class BankAccountViewSet(ModuleScopedViewMixin, viewsets.ModelViewSet):
    permission_module = 'Financeiro'
    serializer_class = BankAccountSerializer
    queryset = BankAccount.objects.all()

    def perform_create(self, serializer):
        account = serializer.save()
        record_audit(
            self.request.user,
            'financeiro.conta.criada',
            f'Conta {account.bank} ({account.number}) cadastrada.',
        )

    def perform_update(self, serializer):
        account = serializer.save()
        record_audit(
            self.request.user,
            'financeiro.conta.atualizada',
            f'Conta #{account.pk} ({account.bank}) atualizada.',
        )

    def perform_destroy(self, instance):
        record_audit(
            self.request.user,
            'financeiro.conta.excluida',
            f'Conta #{instance.pk} ({instance.bank}) excluída.',
        )
        super().perform_destroy(instance)


class BalanceHistoryEntryViewSet(ModuleScopedViewMixin, viewsets.ModelViewSet):
    permission_module = 'Financeiro'
    serializer_class = BalanceHistoryEntrySerializer
    queryset = BalanceHistoryEntry.objects.select_related('account').all()


class BankDataSyncView(ModuleScopedViewMixin, APIView):
    permission_module = 'Financeiro'

    def post(self, request):
        accounts_data = request.data.get('accounts', [])
        history_data = request.data.get('history', [])

        with transaction.atomic():
            kept_account_ids: list[int] = []

            for raw in accounts_data:
                pk = raw.get('id')
                fields = {
                    'bank': raw.get('bank', ''),
                    'agency': raw.get('agency', ''),
                    'number': raw.get('number', ''),
                    'account_type': raw.get('type') or raw.get('account_type', 'Corrente'),
                    'balance': raw.get('balance', 0),
                    'last_updated': raw.get('lastUpdated') or raw.get('last_updated', ''),
                }
                if pk and BankAccount.objects.filter(pk=pk).exists():
                    BankAccount.objects.filter(pk=pk).update(**fields)
                    acc = BankAccount.objects.get(pk=pk)
                else:
                    acc = BankAccount.objects.create(**fields)
                kept_account_ids.append(acc.id)

            BankAccount.objects.exclude(id__in=kept_account_ids).delete()

            kept_history_ids: list[int] = []
            for raw in history_data:
                pk = raw.get('id')
                account_id = raw.get('accountId') or raw.get('account_id')
                if not account_id or not BankAccount.objects.filter(pk=account_id).exists():
                    continue
                fields = {
                    'account_id': account_id,
                    'reference_date': raw.get('date') or raw.get('reference_date'),
                    'bank': raw.get('bank', ''),
                    'number': raw.get('number', ''),
                    'entry_type': raw.get('type') or raw.get('entry_type', 'Corrente'),
                    'value': raw.get('value', 0),
                }
                if pk and BalanceHistoryEntry.objects.filter(pk=pk).exists():
                    BalanceHistoryEntry.objects.filter(pk=pk).update(**fields)
                    kept_history_ids.append(int(pk))
                else:
                    entry = BalanceHistoryEntry.objects.create(**fields)
                    kept_history_ids.append(entry.id)

            BalanceHistoryEntry.objects.exclude(id__in=kept_history_ids).delete()

        record_audit(
            request.user,
            'financeiro.saldos.sync',
            f'Sincronização de saldos — {len(kept_account_ids)} conta(s), {len(kept_history_ids)} lançamento(s).',
        )

        return Response({
            'accounts': BankAccountSerializer(BankAccount.objects.all(), many=True).data,
            'history': BalanceHistoryEntrySerializer(
                BalanceHistoryEntry.objects.select_related('account').all(), many=True
            ).data,
        })
