import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatSession(models.Model):
	"""Container for a conversation thread"""
	
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
	title = models.CharField(max_length=255, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	is_archived = models.BooleanField(default=False)
	is_pinned = models.BooleanField(default=False)
	is_public = models.BooleanField(default=False)  # Allow public read-only access
	
	# Metadata for future features
	metadata = models.JSONField(default=dict, blank=True)
	
	class Meta:
		ordering = ['-is_pinned', '-updated_at']
		indexes = [
			models.Index(fields=['user', 'created_at']),
			models.Index(fields=['user', 'is_archived']),
			models.Index(fields=['user', 'is_pinned']),
		]
	
	def __str__(self):
		return f"{self.title or 'Chat'} - {self.user.email}"
	
	@property
	def message_count(self):
		return self.messages.count()
	
	@property
	def last_message(self):
		return self.messages.last()


class ChatMessage(models.Model):
	"""Individual message in a conversation"""
	
	ROLE_CHOICES = (
		('user', 'User'),
		('assistant', 'Assistant'),
	)
	
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	session = models.ForeignKey(
		ChatSession, 
		on_delete=models.CASCADE, 
		related_name='messages'
	)
	role = models.CharField(max_length=10, choices=ROLE_CHOICES)
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)
	
	# AI metrics
	tokens_used = models.IntegerField(null=True, blank=True)
	embedding = models.JSONField(null=True, blank=True)  # Store vector for retrieval
	
	# User feedback
	rating = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)])
	
	# Metadata
	metadata = models.JSONField(default=dict, blank=True)
	
	class Meta:
		ordering = ['created_at']
		indexes = [
			models.Index(fields=['session', 'created_at']),
			models.Index(fields=['session', 'role']),
		]
	
	def __str__(self):
		preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
		return f"{self.get_role_display()}: {preview}"

class KnowledgeBaseDocument(models.Model):
	"""Registry of documents used for RAG"""
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	name = models.CharField(max_length=255)
	file = models.FileField(upload_to='knowledge_base/')
	file_type = models.CharField(max_length=10) # pdf, docx, md
	size = models.IntegerField() # in bytes
	is_active = models.BooleanField(default=True)
	indexed_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	
	# Metadata for tracking usage
	metadata = models.JSONField(default=dict, blank=True)
	
	class Meta:
		ordering = ['-created_at']
	
	def __str__(self):
		return self.name

class SystemSetting(models.Model):
    """System-wide configurations manageable by admins"""
    key = models.CharField(max_length=50, unique=True)
    value = models.JSONField()
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key
