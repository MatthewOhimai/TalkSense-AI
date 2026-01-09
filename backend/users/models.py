import uuid
from django.db import models
from django.contrib.auth.models import (
	AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.utils import timezone


class UserManager(BaseUserManager):
	def create_user(self, email, password=None, **extra_fields):
		if not email:
			raise ValueError('Users must have an email address')
		email = self.normalize_email(email)
		user = self.model(email=email, **extra_fields)
		if password:
			user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, email, password=None, **extra_fields):
		extra_fields.setdefault('role', 'admin')
		extra_fields.setdefault('is_staff', True)
		extra_fields.setdefault('is_superuser', True)
		return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
	ROLE_CHOICES = (
		('user', 'User'),
		('admin', 'Admin'),
	)

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	email = models.EmailField(unique=True, max_length=255)
	first_name = models.CharField(max_length=150, blank=True)
	last_name = models.CharField(max_length=150, blank=True)
	role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
	auth_provider = models.CharField(max_length=30, default='email')
	is_verified = models.BooleanField(default=False)
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)
	profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
	created_at = models.DateTimeField(default=timezone.now)
	last_login = models.DateTimeField(blank=True, null=True)

	USERNAME_FIELD = 'email'
	REQUIRED_FIELDS = []

	objects = UserManager()

	def __str__(self):
		return self.email

	@property
	def profile_picture_url(self):
		"""Return a usable profile picture URL for local or remote images."""
		if not self.profile_picture:
			return None

		picture_str = str(self.profile_picture)
		if picture_str.startswith('http://') or picture_str.startswith('https://'):
			return picture_str

		try:
			return self.profile_picture.url
		except ValueError:
			return None


class EmailOTP(models.Model):
	id = models.BigAutoField(primary_key=True)
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
	otp_hash = models.CharField(max_length=255)
	expires_at = models.DateTimeField()
	created_at = models.DateTimeField(auto_now_add=True)
	is_used = models.BooleanField(default=False, db_index=True)
	attempts = models.PositiveSmallIntegerField(default=0)
	max_attempts = models.PositiveSmallIntegerField(default=5)
	locked_until = models.DateTimeField(null=True, blank=True)

	class Meta:
		indexes = [models.Index(fields=['user', 'is_used', 'expires_at'])]

	def __str__(self):
		return f"OTP for {self.user.email} expires {self.expires_at.isoformat()}"

	@property
	def is_expired(self):
		from django.utils import timezone
		return self.expires_at < timezone.now()



class PasswordReset(models.Model):
	id = models.BigAutoField(primary_key=True)
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_resets')
	token_hash = models.CharField(max_length=255)
	expires_at = models.DateTimeField()
	is_used = models.BooleanField(default=False, db_index=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		indexes = [models.Index(fields=['user', 'is_used', 'expires_at'])]

	def __str__(self):
		return f"PasswordReset for {self.user.email} expires {self.expires_at.isoformat()}"

	@property
	def is_expired(self):
		from django.utils import timezone
		return self.expires_at < timezone.now()
