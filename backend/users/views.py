from datetime import timedelta, datetime
import secrets

from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, serializers
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from users.serializers import (
	SignupSerializer, VerifyEmailSerializer, LoginSerializer,
	UserSerializer, ProfileSerializer, ChangePasswordSerializer
)
from users.services.jwt_service import JWTService
from users.tasks import send_otp_email_task
from users.models import EmailOTP
from core.utils import rate_limit
from users.services.google_auth import GoogleAuthService
from django.contrib.auth.hashers import make_password, check_password
from django.db import transaction
from users.models import PasswordReset
from users.serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from users.tasks import send_password_reset_email_task, send_password_changed_email_task, send_welcome_email_task
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import make_password as django_make_password, check_password as django_check_password
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.core.files.storage import default_storage

User = get_user_model()


def _make_otp_hash(otp: str) -> str:
	# Use Django's make_password to apply a salted hash (PBKDF2 by default)
	return make_password(otp)


def _check_otp(plaintext: str, hashed: str) -> bool:
	return check_password(plaintext, hashed)


class SignupAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	@extend_schema(
		tags=['Authentication'],
		description='Sign up a new user with email and password. Generates and sends OTP to email.',
		request=SignupSerializer,
		responses={
			201: OpenApiResponse(description='Signup successful, OTP sent to email'),
			400: OpenApiResponse(description='Invalid data or user already exists'),
			429: OpenApiResponse(description='Rate limited'),
		},
	)
	@rate_limit('signup', limit=5, period=60 * 60)
	def post(self, request):
		serializer = SignupSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		email = User.objects.normalize_email(serializer.validated_data['email'])
		password = serializer.validated_data['password']
		first_name = serializer.validated_data.get('first_name', '').strip()
		last_name = serializer.validated_data.get('last_name', '').strip()

		if User.objects.filter(email=email).exists():
			return Response({'detail': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

		# create user and OTP atomically so partially created accounts don't remain
		with transaction.atomic():
			user = User.objects.create_user(email=email, password=password)
			# Save provided names if present
			if first_name:
				user.first_name = first_name
			if last_name:
				user.last_name = last_name
			user.is_verified = False
			user.auth_provider = 'email'
			user.save()

		# invalidate previous OTPs (single-use rule / auto-invalidate on resend)
		# invalidate previous non-expired OTPs (single-use rule / auto-invalidate on resend)
		EmailOTP.objects.filter(
			user=user,
			is_used=False
		).exclude(
			expires_at__lt=timezone.now()
		).update(is_used=True)

		# generate OTP
		otp = f"{secrets.randbelow(10**6):06}"
		otp_hash = _make_otp_hash(otp)
		expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
		expires = timezone.now() + timedelta(minutes=expiry_minutes)
		EmailOTP.objects.create(
			user=user,
			otp_hash=otp_hash,
			expires_at=expires,
			max_attempts=getattr(settings, 'OTP_MAX_ATTEMPTS', 5),
		)

		try:
			send_otp_email_task.delay(user.email, otp)
		except Exception:
			pass

		return Response({'detail': 'Verification required. OTP sent to email.'}, status=status.HTTP_201_CREATED)


class VerifyEmailAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	@extend_schema(
		tags=['Authentication'],
		description='Verify email address with OTP. User can then log in.',
		request=VerifyEmailSerializer,
		responses={
			200: OpenApiResponse(description='Email verified successfully'),
			400: OpenApiResponse(description='Invalid or expired OTP'),
			429: OpenApiResponse(description='Rate limited or OTP locked'),
		},
	)
	@rate_limit('verify', limit=10, period=60 * 10)
	def post(self, request):
		serializer = VerifyEmailSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		email = User.objects.normalize_email(serializer.validated_data['email'])
		otp = serializer.validated_data['otp']

		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			return Response({'detail': 'Invalid email or otp.'}, status=status.HTTP_400_BAD_REQUEST)

		# find latest UNUSED OTP for user
		record = EmailOTP.objects.filter(user=user, is_used=False).order_by('-created_at').first()
		if not record:
			return Response({'detail': 'OTP not found or already used.'}, status=status.HTTP_400_BAD_REQUEST)

		# check expiry
		if record.is_expired:
			# mark used/invalidate
			record.is_used = True
			record.save(update_fields=['is_used'])
			return Response({'detail': 'OTP expired.'}, status=status.HTTP_400_BAD_REQUEST)

		# check if OTP is temporarily locked due to repeated failures
		if record.locked_until and record.locked_until > timezone.now():
			return Response({'detail': 'OTP temporarily locked due to repeated failures.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

		# check max attempts
		if record.attempts >= record.max_attempts:
			record.is_used = True
			# set temporary lock
			lock_minutes = getattr(settings, 'OTP_LOCK_MINUTES', 15)
			record.locked_until = timezone.now() + timedelta(minutes=lock_minutes)
			record.save(update_fields=['is_used', 'locked_until'])
			return Response({'detail': 'OTP locked due to too many failed attempts.'}, status=status.HTTP_400_BAD_REQUEST)

		# verify
		if not _check_otp(otp, record.otp_hash):
			record.attempts = record.attempts + 1
			# lock if attempts reached
			if record.attempts >= record.max_attempts:
				lock_minutes = getattr(settings, 'OTP_LOCK_MINUTES', 15)
				record.locked_until = timezone.now() + timedelta(minutes=lock_minutes)
				record.is_used = True
			record.save(update_fields=['attempts', 'is_used', 'locked_until'])
			return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

		# success: mark OTP used and delete to avoid DB clutter
		record.is_used = True
		record.save(update_fields=['is_used'])
		record.delete()

		user.is_verified = True
		user.save(update_fields=['is_verified'])

		# send welcome email asynchronously
		try:
			send_welcome_email_task.delay(user.email, f"{user.first_name} {user.last_name}".strip())
		except Exception:
			pass

		return Response({'detail': 'Email verified. Please login.'}, status=status.HTTP_200_OK)


class LoginAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	@extend_schema(
		tags=['Authentication'],
		description='Log in user with email and password. Returns JWT access and refresh tokens.',
		request=LoginSerializer,
		responses={
			200: OpenApiResponse(description='Login successful'),
			400: OpenApiResponse(description='Invalid credentials'),
			401: OpenApiResponse(description='Invalid credentials'),
			403: OpenApiResponse(description='Email not verified or account disabled'),
		},
	)
	@rate_limit('login', limit=10, period=60 * 10)
	def post(self, request):
		serializer = LoginSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		email = User.objects.normalize_email(serializer.validated_data['email'])
		password = serializer.validated_data['password']

		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

		if not user.is_verified:
			return Response({'detail': 'Email not verified.'}, status=status.HTTP_403_FORBIDDEN)

		if not user.is_active:
			return Response({'detail': 'Account disabled.'}, status=status.HTTP_403_FORBIDDEN)

		if not user.check_password(password):
			return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

		user.last_login = timezone.now()
		user.save(update_fields=['last_login'])

		payload = JWTService.create_auth_response(user, request=request)
		return Response(payload, status=status.HTTP_200_OK)


class ResendOTPAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	@extend_schema(
		tags=['Authentication'],
		description='Resend OTP to user email. Rate limited to 3 per hour.',
		request=PasswordResetRequestSerializer,
		responses={
			200: OpenApiResponse(description='If account exists, OTP has been sent'),
			429: OpenApiResponse(description='Rate limited'),
		},
	)
	@rate_limit('resend_otp', limit=3, period=60 * 60)
	def post(self, request):
		serializer = PasswordResetRequestSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		email = User.objects.normalize_email(serializer.validated_data['email'])
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			# don't reveal existence
			return Response({'detail': 'If an account exists, an OTP has been sent.'}, status=status.HTTP_200_OK)

		# invalidate previous non-expired OTPs
		EmailOTP.objects.filter(user=user, is_used=False).exclude(expires_at__lt=timezone.now()).update(is_used=True)

		# generate and send OTP
		otp = f"{secrets.randbelow(10**6):06}"
		otp_hash = _make_otp_hash(otp)
		expires = timezone.now() + timedelta(minutes=getattr(settings, 'OTP_EXPIRY_MINUTES', 10))
		EmailOTP.objects.create(user=user, otp_hash=otp_hash, expires_at=expires, max_attempts=getattr(settings, 'OTP_MAX_ATTEMPTS', 5))
		try:
			send_otp_email_task.delay(user.email, otp)
		except Exception:
			pass
		return Response({'detail': 'If an account exists, an OTP has been sent.'}, status=status.HTTP_200_OK)


class PasswordResetRequestAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	@extend_schema(
		tags=['Authentication'],
		description='Request password reset. Sends reset link to email if account exists.',
		request=PasswordResetRequestSerializer,
		responses={
			200: OpenApiResponse(description='If account exists, reset link sent'),
			429: OpenApiResponse(description='Rate limited'),
		},
	)
	@rate_limit('password_reset_request', limit=5, period=60 * 60)
	def post(self, request):
		serializer = PasswordResetRequestSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		email = serializer.validated_data['email']
		# Do not reveal whether user exists
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			return Response({'detail': 'If an account exists, a reset link has been sent.'}, status=status.HTTP_200_OK)

		# create reset token
		token = get_random_string(48)
		token_hash = django_make_password(token)
		expires = timezone.now() + timedelta(minutes=getattr(settings, 'PASSWORD_RESET_EXPIRY_MINUTES', 30))
		with transaction.atomic():
			# invalidate previous unused
			PasswordReset.objects.filter(user=user, is_used=False).update(is_used=True)
			pr = PasswordReset.objects.create(user=user, token_hash=token_hash, expires_at=expires)

		# build reset link (frontend handles token) - include token in link
		reset_link = f"{settings.FRONTEND_URL.rstrip('/')}/password-reset?token={token}"
		try:
			send_password_reset_email_task.delay(user.email, reset_link)
		except Exception:
			pass
		return Response({'detail': 'If an account exists, a reset link has been sent.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	@extend_schema(
		tags=['Authentication'],
		description='Confirm password reset with token. Updates user password.',
		request=PasswordResetConfirmSerializer,
		responses={
			200: OpenApiResponse(description='Password updated successfully'),
			400: OpenApiResponse(description='Invalid or expired token'),
			403: OpenApiResponse(description='Account disabled'),
		},
	)
	def post(self, request):
		serializer = PasswordResetConfirmSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		token = serializer.validated_data['token']
		new_password = serializer.validated_data['new_password']

		# find matching PasswordReset by checking hashes (search recent unused)
		pr = PasswordReset.objects.filter(is_used=False, expires_at__gt=timezone.now()).order_by('-created_at')
		matched = None
		for candidate in pr:
			if django_check_password(token, candidate.token_hash):
				matched = candidate
				break
		if not matched:
			return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

		user = matched.user
		if not user.is_active:
			return Response({'detail': 'Account disabled.'}, status=status.HTTP_403_FORBIDDEN)

		# rotate password
		with transaction.atomic():
			user.set_password(new_password)
			user.save(update_fields=['password'])
			matched.is_used = True
			matched.save(update_fields=['is_used'])
			matched.delete()

		# send confirmation email
		try:
			send_password_changed_email_task.delay(user.email)
		except Exception:
			pass

		# optional: blacklist outstanding refresh tokens
		try:
			for t in OutstandingToken.objects.filter(user=user):
				BlacklistedToken.objects.get_or_create(token=t)
		except Exception:
			pass

		return Response({'detail': 'Password updated.'}, status=status.HTTP_200_OK)


class LogoutAPIView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	@extend_schema(
		tags=['Authentication'],
		description='Log out user by blacklisting the refresh token.',
		responses={
			200: OpenApiResponse(description='Logged out successfully'),
		},
	)
	def post(self, request):
		# Blacklist refresh token if provided
		refresh = request.data.get('refresh')
		from rest_framework_simplejwt.tokens import RefreshToken
		try:
			if refresh:
				token = RefreshToken(refresh)
				token.blacklist()
		except Exception:
			pass
		return Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)


class GoogleLoginAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	@extend_schema(
		tags=['Authentication'],
		description='Authenticate with Google ID token. Returns JWT tokens and user data.',
		request=serializers.Serializer,
		responses={
			200: OpenApiResponse(description='Google authentication successful'),
			400: OpenApiResponse(description='Invalid or missing token'),
		},
	)
	def post(self, request):
		token = request.data.get('token')
		if not token:
			return Response({'detail': 'token is required'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			user, created = GoogleAuthService.authenticate(token)
		except Exception as exc:
			return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

		user.last_login = timezone.now()
		user.save(update_fields=['last_login'])
		payload = JWTService.create_auth_response(user, request=request, is_new=created)
		return Response(payload, status=status.HTTP_200_OK)


class GoogleCallbackAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	@extend_schema(
		tags=['Authentication'],
		description='Google OAuth callback handler. Accepts token as query parameter.',
		parameters=[
			OpenApiParameter(
				name='token',
				location='query',
				description='Google ID token',
				required=True,
				type=OpenApiTypes.STR,
			),
		],
		responses={
			200: OpenApiResponse(description='Callback processed successfully'),
			400: OpenApiResponse(description='Invalid token'),
		},
	)
	def get(self, request):
		token = request.query_params.get('token')
		if not token:
			return Response({'detail': 'token query parameter required'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			user, created = GoogleAuthService.authenticate(token)
		except Exception as exc:
			return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

		user.last_login = timezone.now()
		user.save(update_fields=['last_login'])
		payload = JWTService.create_auth_response(user, request=request, is_new=created)
		return Response(payload, status=status.HTTP_200_OK)

class ProfileAPIView(APIView):
	permission_classes = [permissions.IsAuthenticated]
	parser_classes = (MultiPartParser, FormParser)

	@extend_schema(
		tags=['User Profile'],
		description='Retrieve authenticated user profile.',
		responses={
			200: ProfileSerializer,
			401: OpenApiResponse(description='Unauthorized'),
		},
	)
	def get(self, request):
		serializer = ProfileSerializer(request.user, context={'request': request})
		return Response(serializer.data)

	@extend_schema(
		tags=['User Profile'],
		description='Update authenticated user profile. Supports first_name, last_name, and profile_picture upload.',
		request=ProfileSerializer,
		responses={
			200: ProfileSerializer,
			400: OpenApiResponse(description='Invalid data'),
			401: OpenApiResponse(description='Unauthorized'),
		},
	)
	def put(self, request):
		serializer = ProfileSerializer(
			request.user,
			data=request.data,
			partial=True,
			context={'request': request}
		)
		serializer.is_valid(raise_exception=True)
		
		# Handle profile_picture file upload
		if 'profile_picture' in request.FILES:
			request.user.profile_picture = request.FILES['profile_picture']
		
		# Update other fields
		for field in ['first_name', 'last_name']:
			if field in request.data:
				setattr(request.user, field, request.data[field])
		
		request.user.save()
		
		# Return updated profile
		serializer = ProfileSerializer(request.user, context={'request': request})
		return Response(serializer.data)


class ChangePasswordAPIView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	@extend_schema(
		tags=['User Profile'],
		description='Change user password (email-auth users only). Old password must be verified.',
		request=ChangePasswordSerializer,
		responses={
			200: OpenApiResponse(description='Password changed successfully'),
			400: OpenApiResponse(description='Invalid data'),
			401: OpenApiResponse(description='Unauthorized'),
			403: OpenApiResponse(description='Password change not allowed for OAuth users'),
		},
	)
	def post(self, request):
		# Only email-auth users may change password
		if request.user.auth_provider != 'email':
			return Response({'detail': 'Password change not allowed for OAuth users.'}, status=status.HTTP_403_FORBIDDEN)

		serializer = ChangePasswordSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		old = serializer.validated_data['old_password']
		new = serializer.validated_data['new_password']
		if not request.user.check_password(old):
			return Response({'detail': 'Old password incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
		request.user.set_password(new)
		request.user.save(update_fields=['password'])

		# send security notification
		try:
			send_password_changed_email_task.delay(request.user.email)
		except Exception:
			pass

		# optional: revoke refresh tokens after password change
		try:
			for t in OutstandingToken.objects.filter(user=request.user):
				BlacklistedToken.objects.get_or_create(token=t)
		except Exception:
			pass

		return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)
