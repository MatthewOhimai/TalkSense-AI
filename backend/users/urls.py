from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from users import views

urlpatterns = [
    path('auth/signup', views.SignupAPIView.as_view(), name='auth-signup'),
    path('auth/verify-email', views.VerifyEmailAPIView.as_view(), name='auth-verify-email'),
    path('auth/login', views.LoginAPIView.as_view(), name='auth-login'),
    path('auth/logout', views.LogoutAPIView.as_view(), name='auth-logout'),
    path('auth/change-password', views.ChangePasswordAPIView.as_view(), name='auth-change-password'),
    path('auth/password-reset/request', views.PasswordResetRequestAPIView.as_view(), name='auth-password-reset-request'),
    path('auth/password-reset/confirm', views.PasswordResetConfirmAPIView.as_view(), name='auth-password-reset-confirm'),
    path('auth/resend-otp', views.ResendOTPAPIView.as_view(), name='auth-resend-otp'),
    path('auth/google/login', views.GoogleLoginAPIView.as_view(), name='auth-google-login'),
    path('auth/google/callback', views.GoogleCallbackAPIView.as_view(), name='auth-google-callback'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile', views.ProfileAPIView.as_view(), name='profile'),
]
