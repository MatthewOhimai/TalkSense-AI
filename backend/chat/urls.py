from django.urls import path, include
from rest_framework.routers import DefaultRouter
from chat.views import (
    ChatSessionViewSet, 
    ChatMessageViewSet, 
    AdminAnalyticsViewSet, 
    KnowledgeBaseViewSet,
    UserManagementViewSet,
    SettingsViewSet
)

router = DefaultRouter()
router.register(r'sessions', ChatSessionViewSet, basename='chat-session')
router.register(r'messages', ChatMessageViewSet, basename='chat-message')
router.register(r'admin', AdminAnalyticsViewSet, basename='admin-analytics')
router.register(r'knowledge', KnowledgeBaseViewSet, basename='knowledge-base')
router.register(r'users', UserManagementViewSet, basename='user-management')
router.register(r'settings', SettingsViewSet, basename='system-settings')

urlpatterns = [
	path('', include(router.urls)),
]
