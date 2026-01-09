from celery import shared_task
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.utils.html import strip_tags
from datetime import timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import logging

logger = logging.getLogger('users.tasks')

from users.models import EmailOTP


# ==================== Helper Functions ====================

def send_via_sendgrid(subject, html_content, recipient, text_content=None):
    try:
        message = Mail(
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=recipient,
            subject=subject,
            html_content=html_content
        )

        # Optional plain text fallback
        if text_content:
            message.add_content(text_content, "text/plain")

        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"SendGrid email sent to {recipient}, status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"SendGrid email failed to {recipient}: {e}")
        raise

# ==================== Celery Tasks ====================

# @shared_task(bind=True, max_retries=3)
# def send_magic_link_email_task(self, email: str, magic_link: str):
#     """
#     Asynchronous task to send magic link authentication email.
    
#     Args:
#         email: Recipient email address
#         magic_link: Complete magic link URL
        
#     Returns:
#         Dictionary with status and message
#     """
#     try:
#         logger.info(f"Sending magic link email to {email}")
        
#         subject = 'Sign in to TalkSense'
        
#         # Render HTML email template
#         html_content = render_to_string(
#             'emails/magic_link.html',
#             {
#                 'magic_link': magic_link,
#                 'email': email,
#                 'app_name': 'TalkSense',
#                 'expiration_minutes': 15,
#             }
#         )
        
#         # Create plain text version
#         text_content = strip_tags(html_content)
        
#         # Send email
#         response = send_via_sendgrid(subject, html_content, email, text_content)
#         success = response.status_code == 202
#         if success:
#             return {
#                 'status': 'success',
#                 'message': f'Magic link email sent to {email}',
#                 'email': email
#             }
#         else:
#             raise Exception('Failed to send email')
            
#     except Exception as exc:
#         logger.error(f"Error sending magic link email to {email}: {str(exc)}")
        
#         # Retry with exponential backoff
#         try:
#             self.retry(exc=exc, countdown=2 ** self.request.retries)
#         except self.MaxRetriesExceededError:
#             logger.error(f"Max retries exceeded for magic link email to {email}")
#             return {
#                 'status': 'failed',
#                 'message': f'Failed to send magic link email to {email}',
#                 'email': email,
#                 'error': str(exc)
#             }


@shared_task(bind=True, max_retries=3)
def send_welcome_email_task(self, email: str, name: str = None):
    """
    Asynchronous task to send welcome email to new users.
    
    Args:
        email: Recipient email address
        name: User's full name (optional)
        
    Returns:
        Dictionary with status and message
    """
    try:
        logger.info(f"Sending welcome email to {email}")
        
        subject = 'Welcome to TalkSense!'
        
        # Render HTML email template
        html_content = render_to_string(
            'emails/welcome.html',
            {
                'email': email,
                'name': name or email,
                'app_name': 'TalkSense',
                'app_url': settings.FRONTEND_URL,
            }
        )
        
        # Create plain text version
        text_content = strip_tags(html_content)
        
        # Send email
        response = send_via_sendgrid(subject, html_content, email, text_content)
        success = response.status_code == 202
        if success:
            return {
                'status': 'success',
                'message': f'Welcome email sent to {email}',
                'email': email
            }
        else:
            raise Exception('Failed to send email')
            
    except Exception as exc:
        logger.error(f"Error sending welcome email to {email}: {str(exc)}")
        
        # Retry with exponential backoff
        try:
            self.retry(exc=exc, countdown=2 ** self.request.retries)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for welcome email to {email}")
            return {
                'status': 'failed',
                'message': f'Failed to send welcome email to {email}',
                'email': email,
                'error': str(exc)
            }


@shared_task(bind=True, max_retries=3)
def send_otp_email_task(self, email: str, otp: str):
    """
    Asynchronous task to send OTP code to user's email.
    """
    try:
        logger.info(f"Sending OTP email to {email}")
        subject = 'Your TalkSense verification code'
        html_content = render_to_string(
            'emails/otp_email.html',
            {
                'email': email,
                'name': email,
                'app_name': 'TalkSense',
                'otp': otp,
                'expiration_minutes': getattr(settings, 'OTP_EXPIRY_MINUTES', 10),
            }
        )
        text_content = strip_tags(html_content)
        response = send_via_sendgrid(subject, html_content, email, text_content)
        success = getattr(response, 'status_code', None) in (200, 202)
        if success:
            return {
                'status': 'success',
                'message': f'OTP email sent to {email}',
                'email': email
            }
        else:
            raise Exception('Failed to send email')
    except Exception as exc:
        logger.error(f"Error sending OTP email to {email}: {str(exc)}")
        try:
            self.retry(exc=exc, countdown=2 ** self.request.retries)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for OTP email to {email}")
            return {
                'status': 'failed',
                'message': f'Failed to send OTP email to {email}',
                'email': email,
                'error': str(exc)
            }


@shared_task(bind=True, max_retries=3)
def send_password_reset_email_task(self, email: str, reset_link: str):
    try:
        logger.info(f"Sending password reset email to {email}")
        subject = 'TalkSense password reset'
        html_content = render_to_string(
            'emails/password_reset.html',
            {
                'email': email,
                'app_name': 'TalkSense',
                'reset_link': reset_link,
                'expiration_minutes': getattr(settings, 'PASSWORD_RESET_EXPIRY_MINUTES', 30),
            }
        )
        text_content = strip_tags(html_content)
        response = send_via_sendgrid(subject, html_content, email, text_content)
        success = getattr(response, 'status_code', None) in (200, 202)
        if success:
            return {'status': 'success', 'email': email}
        else:
            raise Exception('Failed to send email')
    except Exception as exc:
        logger.error(f"Error sending password reset email to {email}: {str(exc)}")
        try:
            self.retry(exc=exc, countdown=2 ** self.request.retries)
        except self.MaxRetriesExceededError:
            return {'status': 'failed', 'email': email, 'error': str(exc)}


@shared_task(bind=True, max_retries=3)
def send_password_changed_email_task(self, email: str):
    try:
        logger.info(f"Sending password changed notification to {email}")
        subject = 'Your TalkSense password was changed'
        html_content = render_to_string(
            'emails/password_changed.html',
            {
                'email': email,
                'app_name': 'TalkSense',
            }
        )
        text_content = strip_tags(html_content)
        response = send_via_sendgrid(subject, html_content, email, text_content)
        success = getattr(response, 'status_code', None) in (200, 202)
        if success:
            return {'status': 'success', 'email': email}
        else:
            raise Exception('Failed to send email')
    except Exception as exc:
        logger.error(f"Error sending password changed email to {email}: {str(exc)}")
        try:
            self.retry(exc=exc, countdown=2 ** self.request.retries)
        except self.MaxRetriesExceededError:
            return {'status': 'failed', 'email': email, 'error': str(exc)}


@shared_task
def cleanup_expired_otps():
    """
    Periodic task to delete expired EmailOTP records.
    """
    try:
        expired_otps = EmailOTP.objects.filter(expires_at__lt=timezone.now())
        count = expired_otps.count()
        expired_otps.delete()
        logger.info(f"Cleaned up {count} expired OTPs")
        return {'status': 'success', 'deleted': count}
    except Exception as e:
        logger.error(f"Error cleaning up expired OTPs: {str(e)}")
        return {'status': 'failed', 'error': str(e)}