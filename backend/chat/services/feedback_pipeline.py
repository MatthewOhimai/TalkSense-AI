import json
import logging
from django.db.models import Q
from chat.models import ChatMessage

logger = logging.getLogger(__name__)

class FeedbackPipeline:
    """
    Service to process user feedback and ratings into actionable data for model improvement.
    """

    @staticmethod
    def get_high_quality_feedback(min_rating=4):
        """
        Retrieves messages with a high rating.
        """
        return ChatMessage.objects.filter(
            rating__gte=min_rating,
            role='assistant'
        ).select_related('session')

    @staticmethod
    def format_for_fine_tuning(messages):
        """
        Formats assistant messages and their preceding user messages into a 
        fine-tuning JSONL format (chat-based).
        """
        dataset = []
        for msg in messages:
            # Find the user message immediately preceding this assistant response
            user_msg = ChatMessage.objects.filter(
                session=msg.session,
                created_at__lt=msg.created_at,
                role='user'
            ).order_by('-created_at').first()

            if user_msg:
                dataset.append({
                    "messages": [
                        {"role": "user", "content": user_msg.content},
                        {"role": "assistant", "content": msg.content}
                    ]
                })
        
        return dataset

    @classmethod
    def export_feedback_dataset(cls, file_path, min_rating=4):
        """
        Exports high-quality feedback to a JSONL file for training.
        """
        feedback = cls.get_high_quality_feedback(min_rating)
        dataset = cls.format_for_fine_tuning(feedback)
        
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                for entry in dataset:
                    f.write(json.dumps(entry) + '\n')
            logger.info(f"Successfully exported {len(dataset)} entries to {file_path}")
            return len(dataset)
        except Exception as e:
            logger.error(f"Failed to export feedback dataset: {str(e)}")
            return 0
