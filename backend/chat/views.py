from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.throttling import AnonRateThrottle
from django.http import StreamingHttpResponse
from django.db.models import Q
from datetime import datetime

from chat.models import ChatSession, ChatMessage, KnowledgeBaseDocument, SystemSetting
from chat.serializers import (
	ChatSessionListSerializer,
	ChatSessionDetailSerializer,
	ChatSessionCreateSerializer,
	SendMessageSerializer,
	ChatMessageSerializer,
	MessageRatingSerializer,
	PublicChatSessionSerializer,
	KnowledgeBaseDocumentSerializer,
	SystemSettingSerializer,
	UserSerializer
)
from chat.services.rag_service import RAGService
from chat.services.analytics_service import AnalyticsService
from chat.services.admin_logic import AdminLogic
from chat.tasks import export_high_quality_feedback_task
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatSessionViewSet(viewsets.ModelViewSet):
# ... (lines 20-138)
	"""
	Chat session endpoints:
	- POST   /api/chat/sessions/          → Create new chat
	- GET    /api/chat/sessions/          → List user's chats
	- GET    /api/chat/sessions/{id}/     → Get full chat with messages
	- PATCH  /api/chat/sessions/{id}/     → Update chat (title, archive)
	- DELETE /api/chat/sessions/{id}/     → Delete chat
	"""
	
	permission_classes = [IsAuthenticated]
	
	def get_queryset(self):
		"""Only show user's own sessions"""
		queryset = ChatSession.objects.filter(user=self.request.user)
		if self.action == 'list':
			queryset = queryset.filter(is_archived=False)
		return queryset.order_by('-is_pinned', '-updated_at')
	
	def get_serializer_class(self):
		if self.action == 'create':
			return ChatSessionCreateSerializer
		elif self.action == 'retrieve':
			return ChatSessionDetailSerializer
		else:
			return ChatSessionListSerializer
	
	def create(self, request, *args, **kwargs):
		"""Create new chat session"""
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		
		# Auto-generate title if not provided
		title = serializer.validated_data.get('title', '')
		if not title:
			title = f"Chat - {datetime.now().strftime('%b %d, %Y')}"
		
		session = ChatSession.objects.create(
			user=request.user,
			title=title
		)
		
		return Response(
			ChatSessionListSerializer(session).data,
			status=status.HTTP_201_CREATED
		)
	
	def update(self, request, *args, **kwargs):
		"""Update chat title"""
		session = self.get_object()
		
		if 'title' in request.data:
			session.title = request.data['title']
			session.save()
		
		return Response(
			ChatSessionDetailSerializer(session).data,
			status=status.HTTP_200_OK
		)
	
	@action(detail=False, methods=['get'])
	def archived(self, request):
		"""Get archived sessions"""
		sessions = ChatSession.objects.filter(
			user=request.user,
			is_archived=True
		).order_by('-updated_at')
		
		serializer = ChatSessionListSerializer(sessions, many=True)
		return Response(serializer.data)
	
	@action(detail=True, methods=['post'])
	def archive(self, request, pk=None):
		"""Archive a session (soft delete)"""
		session = self.get_object()
		session.is_archived = True
		session.save()
		
		return Response(
			{'status': 'Session archived'},
			status=status.HTTP_200_OK
		)
	
	@action(detail=True, methods=['post'])
	def unarchive(self, request, pk=None):
		"""Restore archived session"""
		session = self.get_object()
		session.is_archived = False
		session.save()
		
		return Response(
			{'status': 'Session restored'},
			status=status.HTTP_200_OK
		)
	
	@action(detail=True, methods=['post'])
	def pin(self, request, pk=None):
		"""Pin a session to top"""
		session = self.get_object()
		session.is_pinned = True
		session.save()
		
		return Response(
			{'status': 'Session pinned'},
			status=status.HTTP_200_OK
		)
	
	@action(detail=True, methods=['post'])
	def unpin(self, request, pk=None):
		"""Unpin a session"""
		session = self.get_object()
		session.is_pinned = False
		session.save()
		
		return Response(
			{'status': 'Session unpinned'},
			status=status.HTTP_200_OK
		)
	
	@action(detail=True, methods=['post'])
	def toggle_public(self, request, pk=None):
		"""Toggle public sharing for a session"""
		session = self.get_object()
		session.is_public = not session.is_public
		session.save()
		
		return Response({
			'status': 'public' if session.is_public else 'private',
			'is_public': session.is_public
		}, status=status.HTTP_200_OK)
	
	@action(detail=True, methods=['get'], permission_classes=[AllowAny], throttle_classes=[AnonRateThrottle])
	def public(self, request, pk=None):
		"""
		Get a public chat session (read-only, no auth required).
		Only returns session if is_public=True.
		"""
		try:
			session = ChatSession.objects.get(pk=pk, is_public=True)
		except ChatSession.DoesNotExist:
			return Response(
				{'error': 'Chat not found or not public'},
				status=status.HTTP_404_NOT_FOUND
			)
		
		serializer = PublicChatSessionSerializer(session)
		return Response(serializer.data)


class ChatMessageViewSet(viewsets.ModelViewSet):
	"""
	Message endpoints:
	- POST /api/chat/messages/           → Send message (triggers RAG pipeline)
	- POST /api/chat/messages/stream/    → Stream message (SSE)
	- POST /api/chat/messages/{id}/rate/ → Rate AI response (1-5)
	"""
	
	permission_classes = [IsAuthenticated]
	serializer_class = ChatMessageSerializer
	
	def create(self, request, *args, **kwargs):
		"""
		Send message to chat - Triggers full RAG pipeline
		"""
		# (Existing code for create...)
		# ...
		# Accept either 'session_id' (preferred) or legacy 'session' field
		data = dict(request.data)
		if 'session_id' not in data and 'session' in data:
			data['session_id'] = data.get('session')

		serializer = SendMessageSerializer(data=data)
		if not serializer.is_valid():
			return Response({'error': 'Invalid payload', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

		session_id = serializer.validated_data['session_id']
		user_message = serializer.validated_data['content']
		use_rag = serializer.validated_data['use_rag']
		temperature = serializer.validated_data['temperature']
		
		try:
			session = ChatSession.objects.get(id=session_id, user=request.user)
		except ChatSession.DoesNotExist:
			return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
		
		rag_service = RAGService()
		user_msg, assistant_msg = rag_service.process_user_message(
			session=session,
			user_message=user_message,
			use_rag=use_rag,
			temperature=temperature
		)
		
		return Response({
			'user_message': ChatMessageSerializer(user_msg).data,
			'assistant_message': ChatMessageSerializer(assistant_msg).data
		}, status=status.HTTP_201_CREATED)

	@action(detail=False, methods=['post'])
	def stream(self, request):
		"""
		Stream message via SSE
		"""
		data = dict(request.data)
		serializer = SendMessageSerializer(data=data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		session_id = serializer.validated_data['session_id']
		user_message = serializer.validated_data['content']
		use_rag = serializer.validated_data['use_rag']
		temperature = serializer.validated_data['temperature']

		try:
			session = ChatSession.objects.get(id=session_id, user=request.user)
		except ChatSession.DoesNotExist:
			return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

		def event_stream():
			rag_service = RAGService()
			for chunk in rag_service.stream_user_message(
				session=session,
				user_message=user_message,
				use_rag=use_rag,
				temperature=temperature
			):
				yield f"data: {chunk}\n\n"

		return StreamingHttpResponse(event_stream(), content_type="text/event-stream")
	
	@action(detail=True, methods=['post'])
	def rate(self, request, pk=None):
		"""
		Rate an AI response (1-5 stars)
		"""
		try:
			message = ChatMessage.objects.get(pk=pk)
			if message.session.user != request.user:
				return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
			
			serializer = MessageRatingSerializer(data=request.data)
			serializer.is_valid(raise_exception=True)
			
			rating = serializer.validated_data['rating']
			message.rating = rating
			message.save()
			
			return Response({'status': 'Message rated', 'rating': rating}, status=status.HTTP_200_OK)
		except ChatMessage.DoesNotExist:
			return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminAnalyticsViewSet(viewsets.ViewSet):
	"""
	Admin-only endpoints for analytics and system monitoring.
	"""
	permission_classes = [IsAdminUser]
	
	def list(self, request):
		"""Get all analytics summary"""
		service = AnalyticsService()
		days = int(request.query_params.get('days', 30))
		
		return Response({
			'summary': service.get_summary_stats(days),
			'nlp': service.get_nlp_performance(days),
			'intents': service.get_intent_distribution(days),
			'trends': service.get_engagement_trends(days if days < 30 else 7),
			'learning': service.get_learning_pipeline_stats(),
			'health': service.get_system_health()
		})

	@action(detail=False, methods=['get'])
	def trends(self, request):
		service = AnalyticsService()
		days = int(request.query_params.get('days', 7))
		return Response(service.get_engagement_trends(days))

	@action(detail=False, methods=['get'])
	def logs(self, request):
		"""Searchable chat logs for admins"""
		query = request.query_params.get('q', '')
		sessions = ChatSession.objects.all().order_by('-updated_at')
		
		if query:
			sessions = sessions.filter(
				Q(title__icontains=query) | 
				Q(user__email__icontains=query) |
				Q(messages__content__icontains=query)
			).distinct()
			
		# Simple serialization for logs
		data = []
		for s in sessions[:50]: # Limit for now
			data.append({
				'id': s.id,
				'user': s.user.email,
				'title': s.title,
				'updated_at': s.updated_at,
				'message_count': s.messages.count()
			})
			
		return Response(data)

	@action(detail=False, methods=['post'])
	def trigger_export(self, request):
		"""Manually trigger feedback dataset export"""
		task = export_high_quality_feedback_task.delay()
		return Response({'status': 'Export triggered', 'task_id': task.id})


class KnowledgeBaseViewSet(viewsets.ModelViewSet):
	"""
	Admin-only Knowledge Base management:
	- GET    /api/chat/knowledge/      → List documents
	- POST   /api/chat/knowledge/      → Upload document
	- DELETE /api/chat/knowledge/{id}/ → Remove document
	"""
	permission_classes = [IsAdminUser]
	queryset = KnowledgeBaseDocument.objects.all()
	serializer_class = KnowledgeBaseDocumentSerializer

	def perform_create(self, serializer):
		doc = serializer.save()
		# Trigger sync logic
		AdminLogic.process_kb_document(doc.id)

	def perform_destroy(self, instance):
		# Logic to remove from FAISS index
		rag_service = RAGService()
		rag_service.clear_vector_store() # Simple for now, ideally remove by ID
		instance.delete()


class UserManagementViewSet(viewsets.ModelViewSet):
	"""
	Admin-only User management.
	"""
	permission_classes = [IsAdminUser]
	queryset = User.objects.all()
	serializer_class = UserSerializer

	def get_queryset(self):
		queryset = User.objects.all()
		search = self.request.query_params.get('search')
		if search:
			queryset = queryset.filter(
				Q(email__icontains=search) | 
				Q(first_name__icontains=search) | 
				Q(last_name__icontains=search)
			)
		return queryset.order_by('-created_at')

	@action(detail=True, methods=['post'])
	def toggle_status(self, request, pk=None):
		user = self.get_object()
		# Prevent deactivating admin users via the admin endpoint
		if user.is_staff and user.is_active:
			return Response({'error': 'Cannot deactivate admin users'}, status=status.HTTP_403_FORBIDDEN)
		user.is_active = not user.is_active
		user.save()
		return Response({'status': 'active' if user.is_active else 'inactive'})


class SettingsViewSet(viewsets.ViewSet):
	"""
	System-wide settings management.
	"""
	permission_classes = [IsAdminUser]

	def list(self, request):
		settings = SystemSetting.objects.all()
		serializer = SystemSettingSerializer(settings, many=True)
		return Response(serializer.data)

	@action(detail=False, methods=['post'])
	def update_setting(self, request):
		key = request.data.get('key')
		value = request.data.get('value')
		if not key:
			return Response({'error': 'Key required'}, status=400)
		
		setting = AdminLogic.set_setting(key, value)
		return Response(SystemSettingSerializer(setting).data)


