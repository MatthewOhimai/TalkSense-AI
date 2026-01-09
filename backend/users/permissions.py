from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'role', None) == 'admin')


class IsUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'role', None) == 'user')
