"""
Centralized JWT service for token generation and validation.
Single source of truth for JWT operations across the application.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from core.exceptions import InvalidTokenError
from users.serializers import UserSerializer


class JWTService:
    """Service for handling JWT token operations."""
    
    @staticmethod
    def generate_tokens(user) -> Dict[str, str]:
        """
        Generate access and refresh tokens for a user.
        
        Args:
            user: User instance
            
        Returns:
            Dictionary containing access and refresh tokens
        """
        refresh = RefreshToken.for_user(user)
        
        # Add custom claims
        refresh['email'] = user.email
        refresh['auth_provider'] = user.auth_provider
        
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    
    @staticmethod
    def get_user_data(user) -> Dict[str, Any]:
        """
        Get standardized user data for token payload.
        
        Args:
            user: User instance
            
        Returns:
            Dictionary containing user data
        """
        return {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': user.profile_picture,
            'auth_provider': user.auth_provider,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        }
    
    @staticmethod
    def create_auth_response(
        user,
        request: Optional[object] = None,
        *,
        is_new: bool = False,
    ) -> Dict[str, Any]:
        """
        Create a standardized authentication response.
        
        Args:
            user: User instance
            
        Returns:
            Dictionary containing tokens and user data
        """
        tokens = JWTService.generate_tokens(user)

        # Prefer the API-facing UserSerializer so the frontend always receives
        # consistent fields (including profilePicture/profileImage URLs).
        try:
            context = {"request": request} if request is not None else {}
            user_data = UserSerializer(user, context=context).data
        except Exception:
            # Fallback to a minimal representation if serialization fails
            user_data = JWTService.get_user_data(user)
        
        return {
            'tokens': tokens,
            'user': user_data,
            'is_new': is_new,
        }
