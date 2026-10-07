# backend/app/utils/http.py
import asyncio
import httpx
from app.config import get_settings

class HTTPClient:
    _instance: "HTTPClient | None" = None
    _client: httpx.AsyncClient | None = None
    _lock: asyncio.Lock | None = None

    def __new__(cls) -> "HTTPClient":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            if self._lock is None:
                self._lock = asyncio.Lock()
            async with self._lock:
                if self._client is None:
                    settings = get_settings()
                    self._client = httpx.AsyncClient(
                        timeout=httpx.Timeout(settings.HTTP_TIMEOUT, connect=settings.HTTP_TIMEOUT_CONNECT),
                        follow_redirects=True,
                        limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
                    )
        return self._client

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None


http_client = HTTPClient()


async def get_http_client() -> httpx.AsyncClient:
    return await http_client.get_client()