"""Custom exceptions for the authentication system."""

from rest_framework.exceptions import APIException
from rest_framework import status


class AuthenticationError(APIException):
    """Base exception for authentication errors."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication failed'
    default_code = 'authentication_failed'


class InvalidTokenError(AuthenticationError):
    """Exception raised when token is invalid."""
    default_detail = 'Invalid or expired token'
    default_code = 'invalid_token'


class GoogleAuthError(AuthenticationError):
    """Exception raised during Google authentication."""
    default_detail = 'Google authentication failed'
    default_code = 'google_auth_failed'


class InactiveUserError(AuthenticationError):
    """Exception raised when user account is inactive."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'User account is inactive'
    default_code = 'inactive_user'


class RateLimitExceeded(APIException):
    """Exception raised when rate limit is exceeded."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Too many requests. Please try again later.'
    default_code = 'rate_limit_exceeded'
