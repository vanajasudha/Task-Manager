"""
Application-wide rate limiter instance.

Kept in its own module so both main.py (app.state + exception handler)
and individual route files (decorator) can import the same object
without circular imports.

The key function uses the client IP.  Behind a load balancer or reverse
proxy, replace get_remote_address with a function that reads the
X-Forwarded-For header:

    from slowapi.util import get_remote_address

    def _real_ip(request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        return forwarded.split(",")[0].strip() if forwarded else get_remote_address(request)

    limiter = Limiter(key_func=_real_ip, ...)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
