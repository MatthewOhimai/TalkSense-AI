from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from users.models import User, EmailOTP


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	model = User
	list_display = ('email', 'first_name', 'last_name', 'role', 'auth_provider', 'is_verified', 'is_active', 'is_staff', 'created_at')
	list_filter = ('role', 'auth_provider', 'is_active', 'is_verified', 'is_staff', 'created_at')
	search_fields = ('email', 'first_name', 'last_name')
	ordering = ('-created_at',)
	readonly_fields = ('id', 'created_at', 'last_login')
	
	fieldsets = (
		(None, {'fields': ('email', 'password')}),
		('Personal info', {'fields': ('first_name', 'last_name', 'profile_picture')}),
		('Authentication', {'fields': ('auth_provider', 'is_verified')}),
		('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'role', 'groups', 'user_permissions')}),
		('Important dates', {'fields': ('last_login', 'created_at')}),
		('System', {'fields': ('id',)}),
	)
	
	add_fieldsets = (
		(None, {
			'classes': ('wide',),
			'fields': ('email', 'password1', 'password2'),
		}),
		('Personal info', {
			'classes': ('wide',),
			'fields': ('first_name', 'last_name'),
		}),
		('Permissions', {
			'classes': ('wide',),
			'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_verified'),
		}),
	)


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
	list_display = ('user', 'expires_at', 'created_at')
	list_filter = ('expires_at',)
