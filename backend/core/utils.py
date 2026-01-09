from django.core.cache import cache
from functools import wraps
from django.conf import settings
from core.exceptions import RateLimitExceeded
import time


def rate_limit(key_prefix: str, limit: int, period: int):
    """
    Simple rate limit decorator using Django cache.
    key_prefix: unique prefix per endpoint (e.g., 'signup:')
    limit: number of allowed attempts
    period: seconds window
    """
    def decorator(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            # Support both function-based views (request is args[0])
            # and class-based view methods (self, request, ... => request is args[1]).
            request = kwargs.get('request')
            if request is None:
                if len(args) >= 1 and hasattr(args[0], 'META'):
                    request = args[0]
                elif len(args) >= 2 and hasattr(args[1], 'META'):
                    request = args[1]
            # Fallback to a safe empty object if we couldn't find request
            if request is None:
                class _Anon:
                    META = {}
                    data = {}
                request = _Anon()

            # key by email when available, else by IP
            email = None
            try:
                email = getattr(request, 'data', {}) and request.data.get('email')
            except Exception:
                email = None
            if email:
                key = f"rl:{key_prefix}:{email}".lower()
            else:
                ip = getattr(request, 'META', {}).get('REMOTE_ADDR', 'anon')
                key = f"rl:{key_prefix}:{ip}"
            now = int(time.time())
            data = cache.get(key) or {'count': 0, 'reset': now + period}
            if data['reset'] < now:
                data = {'count': 0, 'reset': now + period}
            if data['count'] >= limit:
                raise RateLimitExceeded()
            data['count'] += 1
            cache.set(key, data, timeout=period)
            return fn(*args, **kwargs)
        return wrapped
    return decorator
