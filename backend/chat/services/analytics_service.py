from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from chat.models import ChatSession, ChatMessage, KnowledgeBaseDocument
from django.contrib.auth import get_user_model
import os
import glob
from chat.serializers import KnowledgeBaseDocumentSerializer

User = get_user_model()

class AnalyticsService:
    """
    Service for computing chatbot usage and performance metrics.
    """

    def get_summary_stats(self, days=30):
        """
        Get high-level engagement metrics.
        """
        period = timezone.now() - timedelta(days=days)
        
        total_conversations = ChatSession.objects.filter(created_at__gte=period).count()
        active_users = User.objects.filter(chat_sessions__created_at__gte=period).distinct().count()
        
        # Engagement Rate: users with >1 message / total active users
        total_users_with_messages = ChatMessage.objects.filter(
            created_at__gte=period, role='user'
        ).values('session__user').distinct().count()
        
        users_with_multi_messages = ChatMessage.objects.filter(
            created_at__gte=period, role='user'
        ).values('session__user').annotate(msg_count=Count('id')).filter(msg_count__gt=1).count()
        
        engagement_rate = (users_with_multi_messages / total_users_with_messages * 100) if total_users_with_messages > 0 else 0
        
        # Average Turn Count
        avg_turns = ChatMessage.objects.filter(created_at__gte=period).values('session').annotate(
            turns=Count('id')
        ).aggregate(avg_turns=Avg('turns'))['avg_turns'] or 0

        return {
            'total_conversations': total_conversations,
            'active_users': active_users,
            'engagement_rate': round(engagement_rate, 1),
            'avg_turns': round(avg_turns, 1)
        }

    def get_nlp_performance(self, days=30):
        """
        Get NLP and model performance metrics.
        """
        period = timezone.now() - timedelta(days=days)
        assistant_messages = ChatMessage.objects.filter(created_at__gte=period, role='assistant')
        
        # Latency (Sliding Window of last 50 messages for responsive "DSA" metrics)
        # optimization: O(1) latency calculation relative to total history size
        recent_messages = assistant_messages.order_by('-created_at')[:10]
        latencies = [msg.metadata.get('latency', 0) for msg in recent_messages if msg.metadata and 'latency' in msg.metadata]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        
        # Fallback Rate
        total_responses = assistant_messages.count()
        fallbacks = assistant_messages.filter(metadata__fallback=True).count()
        fallback_rate = (fallbacks / total_responses * 100) if total_responses > 0 else 0
        
        # Sentiment Breakdown
        sentiments = assistant_messages.values('metadata__sentiment').annotate(count=Count('id'))
        sentiment_map = {s['metadata__sentiment'] or 'neutral': s['count'] for s in sentiments}
        
        return {
            'avg_latency': round(avg_latency, 3),
            'fallback_rate': round(fallback_rate, 1),
            'sentiment_breakdown': sentiment_map,
            'total_responses': total_responses
        }

    def get_intent_distribution(self, days=30):
        """
        Get distribution of detected intents.
        """
        period = timezone.now() - timedelta(days=days)
        intents = ChatMessage.objects.filter(
            created_at__gte=period, role='assistant'
        ).values('metadata__intent').annotate(count=Count('id')).order_by('-count')
        
        return {item['metadata__intent'] or 'unknown': item['count'] for item in intents}

    def get_engagement_trends(self, days=7):
        """
        Get daily conversation count for trending.
        """
        trends = []
        for i in range(days):
            date = timezone.now().date() - timedelta(days=i)
            count = ChatSession.objects.filter(created_at__date=date).count()
            trends.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            })
        return trends[::-1]

    def get_learning_pipeline_stats(self):
        """
        Get metrics related to the automated learning pipeline.
        """
        high_quality_count = ChatMessage.objects.filter(rating__gte=4, role='assistant').count()
        
        # Check exported datasets in media/datasets
        dataset_dir = os.path.join(settings.BASE_DIR, 'media', 'datasets')
        datasets = []
        if os.path.exists(dataset_dir):
            files = glob.glob(os.path.join(dataset_dir, 'feedback_tuning_*.jsonl'))
            for f in sorted(files, reverse=True):
                datasets.append({
                    'name': os.path.basename(f),
                    'size': os.path.getsize(f),
                    'created_at': os.path.getmtime(f)
                })
        
        return {
            'high_quality_feedback_count': high_quality_count,
            'exported_datasets': datasets[:10], # Last 10
            'last_export_status': 'Success' if datasets else 'No exports yet'
        }

    def get_system_health(self):
        """
        Get system health metrics (Rate limits, Celery config, KB status).
        """
        # Rate limits from settings
        drf_config = getattr(settings, 'REST_FRAMEWORK', {})
        throttle_rates = drf_config.get('DEFAULT_THROTTLE_RATES', {})
        
        # KB Status
        kb_docs = KnowledgeBaseDocument.objects.all()
        kb_stats = {
            'total_documents': kb_docs.count(),
            'active_documents': kb_docs.filter(is_active=True).count(),
            'total_size_bytes': sum(doc.size for doc in kb_docs),
            'documents': KnowledgeBaseDocumentSerializer(kb_docs[:20], many=True).data
        }
        
        # Celery placeholder (actual monitoring would require flower or similar, 
        # but we can show configured concurrency)
        celery_stats = {
            'concurrency': getattr(settings, 'CELERY_WORKER_CONCURRENCY', 4),
            'max_tasks_per_child': getattr(settings, 'CELERY_WORKER_MAX_TASKS_PER_CHILD', 1000),
        }
        
        return {
            'throttle_rates': throttle_rates,
            'knowledge_base': kb_stats,
            'celery': celery_stats,
            'uptime_status': 'Healthy' # Placeholder
        }
