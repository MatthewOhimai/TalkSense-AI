from rest_framework import serializers
from django.contrib.auth import get_user_model
from chat.models import ChatSession, ChatMessage, KnowledgeBaseDocument, SystemSetting

User = get_user_model()


class ChatMessageSerializer(serializers.ModelSerializer):
	"""Serializer for individual messages"""
	
	class Meta:
		model = ChatMessage
		fields = ['id', 'role', 'content', 'created_at', 'rating', 'tokens_used', 'metadata']
		read_only_fields = ['id', 'created_at', 'tokens_used', 'metadata']


class ChatSessionListSerializer(serializers.ModelSerializer):
	"""Serializer for chat session list view"""
	
	message_count = serializers.SerializerMethodField()
	last_message_preview = serializers.SerializerMethodField()
	
	class Meta:
		model = ChatSession
		fields = ['id', 'title', 'created_at', 'updated_at', 'message_count', 'last_message_preview', 'is_pinned', 'is_archived', 'is_public']
	
	def get_message_count(self, obj):
		return obj.messages.count()
	
	def get_last_message_preview(self, obj):
		last_msg = obj.messages.last()
		if not last_msg:
			return None
		preview = last_msg.content[:100]
		return preview + "..." if len(last_msg.content) > 100 else preview


class ChatSessionDetailSerializer(serializers.ModelSerializer):
	"""Serializer for full chat session with all messages"""
	
	messages = ChatMessageSerializer(many=True, read_only=True)
	
	class Meta:
		model = ChatSession
		fields = ['id', 'title', 'created_at', 'updated_at', 'messages', 'is_pinned', 'is_archived', 'is_public']


class ChatSessionCreateSerializer(serializers.ModelSerializer):
	"""Serializer for creating new chat session"""
	
	class Meta:
		model = ChatSession
		fields = ['title']


class SendMessageSerializer(serializers.Serializer):
	"""Serializer for sending message to chat"""
	
	session_id = serializers.UUIDField()
	content = serializers.CharField(min_length=1, max_length=10000)
	use_rag = serializers.BooleanField(default=True)
	temperature = serializers.FloatField(default=0.7, min_value=0.0, max_value=1.0)


class MessageRatingSerializer(serializers.Serializer):
	"""Serializer for rating a message"""
	
	rating = serializers.IntegerField(min_value=1, max_value=5)


class PublicChatSessionSerializer(serializers.ModelSerializer):
	"""Serializer for public read-only access to a chat session"""
	
	messages = ChatMessageSerializer(many=True, read_only=True)
	
	class Meta:
		model = ChatSession
		fields = ['id', 'title', 'created_at', 'messages']

class KnowledgeBaseDocumentSerializer(serializers.ModelSerializer):
	"""Serializer for Knowledge Base documents"""
	
	class Meta:
		model = KnowledgeBaseDocument
		fields = ['id', 'name', 'file', 'file_type', 'size', 'is_active', 'indexed_at', 'created_at']
		read_only_fields = ['id', 'size', 'file_type', 'indexed_at', 'created_at']

	def create(self, validated_data):
		file = validated_data['file']
		validated_data['size'] = file.size
		validated_data['file_type'] = file.name.split('.')[-1]
		return super().create(validated_data)

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user management"""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'created_at']
        read_only_fields = ['id', 'email', 'created_at']

class SystemSettingSerializer(serializers.ModelSerializer):
    """Serializer for system settings"""
    class Meta:
        model = SystemSetting
        fields = ['id', 'key', 'value', 'description', 'updated_at']
        read_only_fields = ['id', 'updated_at']
