import os
from celery import shared_task
from django.conf import settings
from chat.services.feedback_pipeline import FeedbackPipeline
from datetime import datetime

@shared_task
def export_high_quality_feedback_task(min_rating=4):
    """
    Periodic task to export high-quality user feedback for model retraining.
    """
    export_dir = os.path.join(settings.BASE_DIR, 'media', 'datasets')
    os.makedirs(export_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_path = os.path.join(export_dir, f'feedback_tuning_{timestamp}.jsonl')
    
    count = FeedbackPipeline.export_feedback_dataset(file_path, min_rating)
    return f"Exported {count} feedback entries to {file_path}"

@shared_task
def process_single_feedback_for_rag(message_id):
    """
    Task to process a specific message for RAG enrichment (placeholder for now).
    """
    from chat.models import ChatMessage
    try:
        msg = ChatMessage.objects.get(id=message_id)
        if msg.rating and msg.rating >= 4:
            # Logic to index this high-quality response into FAISS or vector DB
            # This ensures the model can retrieve its own best answers later.
            pass
        return f"Processed message {message_id} for RAG"
    except ChatMessage.DoesNotExist:
        return f"Message {message_id} not found"
