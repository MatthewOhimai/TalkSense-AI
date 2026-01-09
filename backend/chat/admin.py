from django.contrib import admin
from chat.models import ChatSession, ChatMessage


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
	"""Admin interface for ChatSession"""
	
	list_display = ['title', 'user', 'message_count', 'created_at', 'updated_at', 'is_archived']
	list_filter = ['is_archived', 'created_at', 'updated_at']
	search_fields = ['title', 'user__email']
	readonly_fields = ['id', 'created_at', 'updated_at', 'message_count']
	
	fieldsets = (
		('Session Info', {
			'fields': ('id', 'user', 'title')
		}),
		('Status', {
			'fields': ('is_archived',)
		}),
		('Timestamps', {
			'fields': ('created_at', 'updated_at')
		}),
		('Statistics', {
			'fields': ('message_count',)
		}),
		('Metadata', {
			'fields': ('metadata',),
			'classes': ('collapse',)
		}),
	)
	
	def message_count(self, obj):
		return obj.messages.count()
	message_count.short_description = 'Messages'


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
	"""Admin interface for ChatMessage"""
	
	list_display = ['role', 'content_preview', 'session', 'created_at', 'rating', 'tokens_used']
	list_filter = ['role', 'created_at', 'rating']
	search_fields = ['content', 'session__title']
	readonly_fields = ['id', 'created_at', 'session']
	
	fieldsets = (
		('Message Content', {
			'fields': ('id', 'session', 'role', 'content')
		}),
		('AI Metrics', {
			'fields': ('tokens_used', 'embedding')
		}),
		('Feedback', {
			'fields': ('rating',)
		}),
		('Timestamp', {
			'fields': ('created_at',)
		}),
		('Metadata', {
			'fields': ('metadata',),
			'classes': ('collapse',)
		}),
	)
	
	def content_preview(self, obj):
		preview = obj.content[:50]
		return preview + "..." if len(obj.content) > 50 else preview
	content_preview.short_description = 'Content'
	
	def has_add_permission(self, request):
		# Messages are created via API, not admin
		return False

