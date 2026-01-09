import os
import logging
from django.conf import settings
from chat.models import SystemSetting, KnowledgeBaseDocument
from chat.services.rag_service import RAGService

logger = logging.getLogger(__name__)

class AdminLogic:
    """
    Central logic for administrative operations.
    """

    @staticmethod
    def get_setting(key, default=None):
        try:
            return SystemSetting.objects.get(key=key).value
        except SystemSetting.DoesNotExist:
            return default

    @staticmethod
    def set_setting(key, value, description=""):
        setting, created = SystemSetting.objects.update_or_create(
            key=key,
            defaults={'value': value, 'description': description}
        )
        return setting

    @classmethod
    def process_kb_document(cls, document_id):
        """
        Extracts text from a document and seeds the vector store.
        (Placeholder for real extraction logic like PyPDF2 or docx2txt)
        """
        try:
            doc = KnowledgeBaseDocument.objects.get(id=document_id)
            file_path = doc.file.path
            
            # Real implementation would use specialized libraries
            # For now, we simulate extraction for .md and .txt
            content = ""
            if doc.file_type in ['md', 'txt']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            else:
                content = f"Simulated extraction for {doc.file_type} file: {doc.name}"

            # Seed into RAG
            rag_service = RAGService()
            rag_service.seed_vector_store([{
                'id': str(doc.id),
                'text': content,
                'metadata': {'name': doc.name, 'type': doc.file_type}
            }])
            
            from django.utils import timezone
            doc.indexed_at = timezone.now()
            doc.save()
            
            logger.info(f"Successfully indexed document: {doc.name}")
            return True
        except Exception as e:
            logger.error(f"Failed to process KB document: {str(e)}")
            return False
