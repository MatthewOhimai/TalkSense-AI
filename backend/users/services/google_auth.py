"""
Google OAuth authentication service.
Handles Google ID token verification and user creation/retrieval.
"""

from typing import Dict, Any, Optional
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from users.tasks import send_welcome_email_task
from core.exceptions import GoogleAuthError, InactiveUserError

User = get_user_model()


class GoogleAuthService:
    """Service for handling Google OAuth authentication."""
    
    @staticmethod
    def verify_google_token(token: str) -> Dict[str, Any]:
        """
        Verify Google ID token and extract user information.
        
        Args:
            token: Google ID token from frontend
            
        Returns:
            Dictionary containing verified user information
            
        Raises:
            GoogleAuthError: If token verification fails
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
            
            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise GoogleAuthError('Invalid token issuer')
            
            # Extract user information
            return {
                'email': idinfo.get('email'),
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
                'profile_picture': idinfo.get('picture', ''),
                'email_verified': idinfo.get('email_verified', False),
            }
            
        except ValueError as e:
            raise GoogleAuthError(f'Token verification failed: {str(e)}')
        except Exception as e:
            raise GoogleAuthError(f'Google authentication error: {str(e)}')
    
    @staticmethod
    def get_or_create_user(user_info: Dict[str, Any]):
        """
        Get or create user from Google authentication data.
        
        Args:
            user_info: Dictionary containing user information from Google
            
        Returns:
            User instance
            
        Raises:
            GoogleAuthError: If email is not verified or missing
            InactiveUserError: If user account is inactive
        """
        email = user_info.get('email')
        
        if not email:
            raise GoogleAuthError('Email not provided by Google')
        
        if not user_info.get('email_verified'):
            raise GoogleAuthError('Email not verified by Google')
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email.lower(),
            defaults={
                'auth_provider': 'google',
                'first_name': user_info.get('first_name', ''),
                'last_name': user_info.get('last_name', ''),
                'profile_picture': user_info.get('profile_picture', ''),
                'is_active': True,
                'is_verified': True,  # Google email is already verified
            }
        )
        
        # Update existing user's information if they signed in with Google
        if not created and user.auth_provider != 'google':
            user.auth_provider = 'google'
            user.first_name = user_info.get('first_name', user.first_name)
            user.last_name = user_info.get('last_name', user.last_name)
            user.profile_picture = user_info.get('profile_picture', user.profile_picture)
            user.save(update_fields=['auth_provider', 'first_name', 'last_name', 'profile_picture'])
        
        # Check if user is active
        if not user.is_active:
            raise InactiveUserError()
        
        # Update last login
        from django.utils import timezone
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        # Send welcome email only when user is created for the first time
        if created:
            send_welcome_email_task.delay(user.email, user.get_full_name())
        
        # Return both the user instance and whether this is a new account
        return user, created
    
    @staticmethod
    def authenticate(token: str):
        """
        Complete Google authentication flow.
        
        Args:
            token: Google ID token
            
        Returns:
            Tuple of (User instance, created flag)
        """
        user_info = GoogleAuthService.verify_google_token(token)
        user, created = GoogleAuthService.get_or_create_user(user_info)
        return user, created
