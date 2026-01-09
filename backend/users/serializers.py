from rest_framework import serializers
from django.contrib.auth import get_user_model, password_validation
from django.utils import timezone
from django.conf import settings
from users.models import EmailOTP

User = get_user_model()


def _build_profile_picture_url(obj, request=None):
	"""Return profile picture URL handling remote (Google) and local uploads."""
	url = getattr(obj, 'profile_picture_url', None)
	if not url:
		return None
	if url.startswith('http://') or url.startswith('https://'):
		return url
	if request:
		return request.build_absolute_uri(url)
	return url


class UserSerializer(serializers.ModelSerializer):
	profile_picture = serializers.SerializerMethodField()

	class Meta:
		model = User
		fields = (
			'id', 'email', 'first_name', 'last_name', 'role', 'auth_provider',
			'is_verified', 'is_active', 'created_at', 'last_login', 'profile_picture'
		)
		read_only_fields = ('email', 'role', 'auth_provider', 'created_at', 'last_login')

	def get_profile_picture(self, obj):
		request = self.context.get('request') if hasattr(self, 'context') else None
		return _build_profile_picture_url(obj, request)


class SignupSerializer(serializers.Serializer):
	email = serializers.EmailField()
	password = serializers.CharField(write_only=True)
	first_name = serializers.CharField(required=False, allow_blank=True)
	last_name = serializers.CharField(required=False, allow_blank=True)

	def validate_password(self, value):
		password_validation.validate_password(value)
		return value

	def validate_email(self, value):
		return value.lower()


class VerifyEmailSerializer(serializers.Serializer):
	email = serializers.EmailField()
	otp = serializers.CharField()


class LoginSerializer(serializers.Serializer):
	email = serializers.EmailField()
	password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
	profile_picture = serializers.SerializerMethodField(read_only=True)

	class Meta:
		model = User
		fields = ('id', 'email', 'first_name', 'last_name', 'profile_picture', 'role', 'auth_provider', 'is_verified')
		read_only_fields = ('email', 'role', 'auth_provider', 'is_verified', 'profile_picture')

	def get_profile_picture(self, obj):
		request = self.context.get('request') if hasattr(self, 'context') else None
		return _build_profile_picture_url(obj, request)

	def to_internal_value(self, data):
		"""Handle profile_picture file uploads."""
		internal = super().to_internal_value(data)
		if 'profile_picture' in data and data['profile_picture']:
			profile_picture = data['profile_picture']
			if hasattr(profile_picture, 'size') and profile_picture.size > 2 * 1024 * 1024:
				raise serializers.ValidationError({'profile_picture': 'Image file too large ( > 2MB )'})
			internal['profile_picture'] = profile_picture
		return internal


class ChangePasswordSerializer(serializers.Serializer):
	old_password = serializers.CharField(write_only=True)
	new_password = serializers.CharField(write_only=True)
	confirm_new_password = serializers.CharField(write_only=True)

	def validate(self, attrs):
		if attrs['new_password'] != attrs['confirm_new_password']:
			raise serializers.ValidationError({'confirm_new_password': 'New passwords do not match.'})
		password_validation.validate_password(attrs['new_password'])
		return attrs

	def validate_new_password(self, value):
		password_validation.validate_password(value)
		return value


class PasswordResetRequestSerializer(serializers.Serializer):
	email = serializers.EmailField()

	def validate_email(self, value):
		return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
	token = serializers.CharField()
	new_password = serializers.CharField(write_only=True)
	confirm_new_password = serializers.CharField(write_only=True)

	def validate(self, attrs):
		if attrs['new_password'] != attrs['confirm_new_password']:
			raise serializers.ValidationError({'confirm_new_password': 'New passwords do not match.'})
		password_validation.validate_password(attrs['new_password'])
		return attrs
