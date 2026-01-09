from django.db import models
from django.utils import timezone
import uuid


class Chat(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='chats')
	session_id = models.CharField(max_length=255, db_index=True)
	created_at = models.DateTimeField(default=timezone.now)

	def __str__(self):
		return f"Chat {self.id} by {self.user.email}"


class Feedback(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='feedbacks')
	chat = models.ForeignKey('core.Chat', on_delete=models.SET_NULL, null=True, related_name='feedbacks')
	rating = models.PositiveSmallIntegerField(null=True)
	comment = models.TextField(blank=True)
	created_at = models.DateTimeField(default=timezone.now)

	def __str__(self):
		return f"Feedback {self.id} ({self.rating})"


class FAQ(models.Model):
	id = models.BigAutoField(primary_key=True)
	question = models.TextField()
	answer = models.TextField()
	created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='created_faqs')
	is_active = models.BooleanField(default=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.question[:80]
