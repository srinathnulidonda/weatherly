# backend/app/utils/trusted_ip.py
import ipaddress
def is_private_ip(ip: str) -> bool:
    if not ip or ip.lower() == "unknown":
        return True
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return True
    return addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved or addr.is_unspecified


def get_client_ip(request, trusted_proxy_count: int = 0) -> str:
    if trusted_proxy_count == 0:
        return request.client.host if request.client else "unknown"

    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ips = [ip.strip() for ip in forwarded.split(",") if ip.strip()]
        candidate = None
        if len(ips) > trusted_proxy_count:
            candidate = ips[-(trusted_proxy_count + 1)]
        elif ips:
            candidate = ips[0]
        if candidate:
            try:
                ipaddress.ip_address(candidate)
                return candidate
            except ValueError:
                pass

    for header in ("CF-Connecting-IP", "X-Real-IP"):
        value = request.headers.get(header)
        if value:
            value = value.strip()
            try:
                ipaddress.ip_address(value)
                return value
            except ValueError:
                continue

    return request.client.host if request.client else "unknown"


def get_trusted_proxy_count(settings) -> int:
    return getattr(settings, "TRUSTED_PROXY_COUNT", 0)