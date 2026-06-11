from pathlib import Path

from celery import shared_task
from django.contrib.auth import get_user_model

from .async_imports import remove_upload
from .billing_import_service import import_billing_xml
from .import_service import import_report_file
from .models import ReportBatch

User = get_user_model()


@shared_task(bind=True, name='financeiro.import_report')
def import_report_task(self, batch_id: str, report_type: str, temp_path: str, file_name: str, user_id: int | None):
    path = Path(temp_path)
    try:
        file_bytes = path.read_bytes()
        batch = ReportBatch.objects.get(pk=batch_id)
        result = import_report_file(batch, report_type, file_bytes, file_name)

        if user_id:
            try:
                batch.updated_by = User.objects.get(pk=user_id)
                batch.save(update_fields=['updated_by'])
            except User.DoesNotExist:
                pass

        return {
            'type': report_type,
            'fileName': file_name,
            'success': result['success'],
            'rowCount': result['rowCount'],
            'skippedRows': result['skippedRows'],
            'issues': result['issues'],
        }
    finally:
        remove_upload(path)


@shared_task(bind=True, name='financeiro.import_billing_xml')
def import_billing_xml_task(self, temp_path: str):
    path = Path(temp_path)
    try:
        return import_billing_xml(path.read_bytes())
    finally:
        remove_upload(path)
