from django.test import TestCase
from chat.models import ChatSession, ChatMessage
from chat.services.feedback_pipeline import FeedbackPipeline
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class FeedbackPipelineTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='password123', first_name='Test')
        self.session = ChatSession.objects.create(user=self.user, title="Test Chat")
        
        # Create a user message and a highly rated assistant message
        self.u_msg = ChatMessage.objects.create(
            session=self.session,
            role='user',
            content="Hello world"
        )
        self.a_msg = ChatMessage.objects.create(
            session=self.session,
            role='assistant',
            content="Hello! How can I help you?",
            rating=5
        )

    def test_get_high_quality_feedback(self):
        feedback = FeedbackPipeline.get_high_quality_feedback(min_rating=4)
        self.assertEqual(feedback.count(), 1)
        self.assertEqual(feedback.first().content, "Hello! How can I help you?")

    def test_format_for_fine_tuning(self):
        feedback = FeedbackPipeline.get_high_quality_feedback(min_rating=4)
        dataset = FeedbackPipeline.format_for_fine_tuning(feedback)
        
        self.assertEqual(len(dataset), 1)
        self.assertEqual(dataset[0]['messages'][0]['content'], "Hello world")
        self.assertEqual(dataset[0]['messages'][1]['content'], "Hello! How can I help you?")

    def test_export_feedback_dataset(self):
        file_path = "test_feedback.jsonl"
        count = FeedbackPipeline.export_feedback_dataset(file_path, min_rating=4)
        
        self.assertEqual(count, 1)
        self.assertTrue(os.path.exists(file_path))
        
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
