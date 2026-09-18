import os
from slowapi import Limiter
from slowapi.util import get_remote_address

# Taxas configuráveis via variáveis de ambiente com defaults seguros
AUTH_RATE_LIMIT = os.getenv("AUTH_RATE_LIMIT", "5/minute")
BULK_RATE_LIMIT = os.getenv("BULK_RATE_LIMIT", "20/minute")
DEFAULT_RATE_LIMIT = os.getenv("DEFAULT_RATE_LIMIT", "120/minute")

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[DEFAULT_RATE_LIMIT],
    headers_enabled=False
)
