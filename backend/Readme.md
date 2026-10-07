<div align="center">

<br>

<img src="../web/src/assets/logo-weatherly.png" width="264" height="88" alt="Weatherly">

<br>

**Real-time weather intelligence from 5+ providers**<br>
Aggregated data · Smart insights · Live updates · Completely open

<img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
<img src="https://img.shields.io/badge/Python_3.12+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
<img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
<img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
<img src="https://img.shields.io/badge/Celery-37814A?style=flat-square&logo=celery&logoColor=white" alt="Celery">
<img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
<br>

<a href="#-quick-start"><img src="https://img.shields.io/badge/Quick_Start-▶-2ea44f?style=for-the-badge" alt="Quick Start"></a>
<a href="#-api-reference"><img src="https://img.shields.io/badge/API_Docs-📡-0969da?style=for-the-badge" alt="API Docs"></a>
<a href="#-examples"><img src="https://img.shields.io/badge/Examples-📖-8957e5?style=for-the-badge" alt="Examples"></a>
<a href="#-deployment"><img src="https://img.shields.io/badge/Deploy-🚀-e5534b?style=for-the-badge" alt="Deploy"></a>

---

</div>

## Why Weatherly?

Most weather APIs lock you into a single provider, require API keys for basic access, and return inconsistent data formats. Weatherly solves all three.

<table>
<tr>
<td width="50%">

**🔄 Multi-provider failover**<br>
<sub>If OpenWeatherMap goes down, WeatherAPI picks up. If that fails, Tomorrow.io takes over. Fully automatic.</sub>

**🎯 One consistent format**<br>
<sub>Same response structure regardless of which provider served the data. No adapter code needed.</sub>

**⚡ Smart caching**<br>
<sub>Redis-backed with automatic invalidation. ~85% cache hit rate, sub-50ms cached responses.</sub>

</td>
<td width="50%">

**📍 Intelligent location detection**<br>
<sub>GPS → Browser Geolocation → IP fallback with cross-validation across 3 providers.</sub>

**🛡️ Production-ready security**<br>
<sub>Rate limiting, security headers, CORS, API key auth, and full request observability out of the box.</sub>

**📊 Rich analytics**<br>
<sub>Weather trends, activity indices, AI-style insights, multi-location comparisons, and alert statistics.</sub>

</td>
</tr>
</table>

<br>

## ⚡ Quick Start

> **Prerequisites:** Python 3.12+ · PostgreSQL 15+ · Redis 7+

```bash
git clone https://github.com/your-org/weatherly.git
cd weatherly/backend

python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env    # Add at least one weather provider API key

uvicorn app.main:app --reload --port 8000
```

That's it. Open **http://localhost:8000/docs** and start making requests.

<details>
<summary><kbd>▶</kbd> <b>Background workers</b> <sub>(optional — enables cache warming, alert ingestion)</sub></summary>

<br>

```bash
celery -A app.tasks.celery_app worker -Q weather,alerts,default -l info
celery -A app.tasks.celery_app beat -l info
```

Or run dedicated queues separately:

```bash
celery -A app.tasks.celery_app worker -Q weather -l info   # Cache warming & provider health
celery -A app.tasks.celery_app worker -Q alerts -l info    # Alert ingestion & expiration
celery -A app.tasks.celery_app beat -l info                # Periodic scheduler
```

</details>

<details>
<summary><kbd>⚙</kbd> <b>Environment variables</b></summary>

<br>

```bash
# ── App ──────────────────────────────────────────────
APP_NAME=Weatherly
APP_VERSION=1.0.0
ENVIRONMENT=development

# ── Database ─────────────────────────────────────────
DATABASE_URL=postgresql://weatherly:password@localhost:5432/weatherly
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=5
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
DB_ECHO=false

# ── Redis ────────────────────────────────────────────
REDIS_URL=redis://localhost:6379/0
REDIS_MAX_CONNECTIONS=20

# ── Providers (at least one key required) ────────────
OPENWEATHERMAP_API_KEY=your_key
WEATHERAPI_API_KEY=your_key
TOMORROW_IO_API_KEY=your_key
NOAA_API_KEY=
COPERNICUS_API_KEY=

# ── CORS / Security ──────────────────────────────────
CORS_ORIGINS=http://localhost:3000
ALLOWED_HOSTS=
API_KEY=
TRUSTED_PROXY_COUNT=0

# ── Rate Limiting ────────────────────────────────────
RATE_LIMIT_PER_MINUTE=60

# ── Cache TTLs (seconds) ────────────────────────────
CACHE_TTL_CURRENT=600
CACHE_TTL_FORECAST=1800
CACHE_TTL_LOCATION=86400
CACHE_TTL_ALERTS=300

# ── Celery ───────────────────────────────────────────
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# ── Logging ──────────────────────────────────────────
LOG_LEVEL=INFO
LOG_JSON_FORMAT=false
```

</details>

<br>

## 📡 API Reference

> Base: `/api/v1` — All endpoints are public, rate-limited to 60 req/min per IP.

<br>

### 🌤 Weather

| Endpoint | What it does |
|:---------|:-------------|
| **`GET`** `/weather/current?lat=X&lon=Y` | Current conditions — temp, humidity, wind, UV, clouds, visibility, astronomy |
| **`GET`** `/weather/forecast?lat=X&lon=Y&days=7` | 1–16 day forecast, add `&hourly=true` for hourly breakdown |
| **`GET`** `/weather/history?lat=X&lon=Y&start_date=...&end_date=...` | Historical data for any date range (max 30 days) |
| **`GET`** `/weather/alerts?lat=X&lon=Y&radius_km=50` | Active alerts within radius, filterable by severity |
| **`GET`** `/weather/air-quality?lat=X&lon=Y` | AQI, pollutant levels (PM2.5, PM10, O₃, NO₂, SO₂, CO) |
| **`GET`** `/weather/maps?lat=X&lon=Y&layer=temp&zoom=5` | Map tile URLs — temp, precipitation, clouds, wind, pressure |
| **`GET`** `/weather/astronomy?lat=X&lon=Y&dt=2024-06-21` | Sunrise, sunset, moonrise, moonset, moon phase |

### 📍 Locations

| Endpoint | What it does |
|:---------|:-------------|
| **`POST`** `/locations/detect` | Smart detection: GPS → Browser → IP fallback with confidence scores |
| **`GET`** `/locations/detect/ip` | IP-only geolocation with accuracy disclaimer |
| **`GET`** `/locations/search?q=London` | Search by city, region, or country name |
| **`GET`** `/locations/reverse-geocode?lat=X&lon=Y` | Coordinates → full address |
| **`GET`** `/locations/nearby?lat=X&lon=Y&radius_km=50` | Find locations within radius |
| **`GET`** `/locations/{id}` | Get a stored location by ID |

### 📊 Analytics

| Endpoint | What it does |
|:---------|:-------------|
| **`GET`** `/analytics/trends?lat=X&lon=Y&hours=24` | Temperature, pressure, humidity trends (1–168h) |
| **`POST`** `/analytics/compare` | Side-by-side comparison of 2–5 locations |
| **`GET`** `/analytics/indices?lat=X&lon=Y` | Activity scores — comfort, running, cycling, gardening, driving, allergy |
| **`GET`** `/analytics/insights?lat=X&lon=Y` | Condition-based recommendations — heat, UV, wind, humidity, visibility |
| **`GET`** `/analytics/alert-stats?lat=X&lon=Y&radius_km=100` | Alert counts by severity and event type |

### 🌊 Marine & Environmental

| Endpoint | What it does |
|:---------|:-------------|
| **`GET`** `/marine/ocean?lat=X&lon=Y&days=3` | Ocean data (1–7 days) — requires marine provider |
| **`GET`** `/marine/tides?lat=X&lon=Y` | Tide times and heights |
| **`GET`** `/marine/agriculture?lat=X&lon=Y` | NDVI, soil moisture, frost risk — requires `COPERNICUS_API_KEY` |
| **`GET`** `/marine/environmental?lat=X&lon=Y` | Soil temp, snow depth, AQI — requires `COPERNICUS_API_KEY` |

### 🔧 System

| Endpoint | What it does |
|:---------|:-------------|
| **`GET`** `/` | Liveness check — returns `ok` |
| **`GET`** `/health` | Database + Redis connectivity status |
| **`GET`** `/health/detailed` | Per-provider health, cache stats, request metrics |
| **`GET`** `/metrics` | Request counts, latency percentiles, error rates |

<br>

## 📖 Examples

### Current weather

```bash
curl "http://localhost:8000/api/v1/weather/current?lat=51.5074&lon=-0.1278"
```

<details>
<summary><kbd>📋</kbd> <b>Response</b></summary>

```json
{
  "success": true,
  "message": "Current weather retrieved",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "location": {
      "latitude": 51.5074,
      "longitude": -0.1278,
      "city": "London",
      "country": "United Kingdom",
      "country_code": "GB",
      "source": "manual",
      "precision": "medium"
    },
    "provider": "openweathermap",
    "observed_at": "2024-01-15T14:30:00Z",
    "temperature_c": 12.5,
    "feels_like_c": 10.2,
    "dew_point_c": 8.1,
    "humidity": 76,
    "humidity_comfort": "comfortable",
    "pressure_hpa": 1015,
    "wind": {
      "speed_ms": 5.2,
      "direction_deg": 220,
      "direction_label": "SW",
      "gust_ms": 8.1,
      "beaufort": 3
    },
    "condition": {
      "main": "Clouds",
      "description": "partly cloudy",
      "icon": "04d"
    },
    "clouds_pct": 40,
    "cloud_description": "scattered",
    "uv_index": 3,
    "uv_category": "moderate",
    "visibility_m": 10000,
    "visibility_category": "excellent",
    "astronomy": {
      "sunrise": "08:06",
      "sunset": "16:02",
      "moon_phase": 0.75
    }
  }
}
```

</details>

---

### Location detection

Three ways to detect location, in priority order:

```bash
# ① GPS — highest accuracy
curl -X POST "http://localhost:8000/api/v1/locations/detect" \
  -H "Content-Type: application/json" \
  -d '{"gps_latitude": 40.7128, "gps_longitude": -74.0060, "gps_accuracy_m": 5}'

# ② Browser geolocation
curl -X POST "http://localhost:8000/api/v1/locations/detect" \
  -H "Content-Type: application/json" \
  -d '{"browser_latitude": 40.7128, "browser_longitude": -74.0060}'

# ③ Manual city fallback
curl -X POST "http://localhost:8000/api/v1/locations/detect" \
  -H "Content-Type: application/json" \
  -d '{"fallback_city": "New York", "fallback_country_code": "US"}'

# ④ IP fallback — send empty body
curl -X POST "http://localhost:8000/api/v1/locations/detect" \
  -H "Content-Type: application/json" -d '{}'
```

<details>
<summary><kbd>🖥</kbd> <b>Frontend integration</b></summary>

```javascript
async function detectLocation() {
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000
      })
    );

    return fetch('/api/v1/locations/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        browser_latitude: pos.coords.latitude,
        browser_longitude: pos.coords.longitude,
        browser_accuracy_m: pos.coords.accuracy,
        timezone_hint: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });
  } catch {
    // Falls back to IP detection automatically
    return fetch('/api/v1/locations/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  }
}
```

</details>

---

### Compare locations

```bash
curl -X POST "http://localhost:8000/api/v1/analytics/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "locations": [
      {"latitude": 40.7128, "longitude": -74.0060},
      {"latitude": 34.0522, "longitude": -118.2437},
      {"latitude": 51.5074, "longitude": -0.1278}
    ],
    "units": "metric"
  }'
```

---

### More

```bash
# Forecast with hourly breakdown
curl ".../weather/forecast?lat=40.71&lon=-74.00&days=7&hourly=true"

# Alerts filtered by severity
curl ".../weather/alerts?lat=40.71&lon=-74.00&severity=severe,extreme&radius_km=100"

# Air quality
curl ".../weather/air-quality?lat=40.71&lon=-74.00"

# Activity indices
curl ".../analytics/indices?lat=48.85&lon=2.35"

# Condition insights
curl ".../analytics/insights?lat=48.85&lon=2.35"

# Weather trends (last 48h)
curl ".../analytics/trends?lat=40.71&lon=-74.00&hours=48"

# Marine / ocean
curl ".../marine/ocean?lat=25.76&lon=-80.19&days=3"

# Astronomy
curl ".../weather/astronomy?lat=40.71&lon=-74.00&dt=2024-06-21"

# Nearby locations
curl ".../locations/nearby?lat=51.50&lon=-0.12&radius_km=50&limit=10"

# IP geolocation only
curl ".../locations/detect/ip?ip=8.8.8.8"
```

<br>

## 📊 Response Format

<table>
<tr>
<td width="50%">

**✅ Success**

```json
{
  "success": true,
  "data": { ... },
  "message": "Current weather retrieved",
  "timestamp": "2024-01-15T14:30:00Z"
}
```

</td>
<td width="50%">

**❌ Error**

```json
{
  "error": true,
  "error_code": "VALIDATION_ERROR",
  "message": "Latitude must be between -90 and 90",
  "details": { "errors": [ ... ] }
}
```

</td>
</tr>
</table>

<details>
<summary><kbd>⚠</kbd> <b>Error codes</b></summary>

| Code | Status | When |
|:-----|:------:|:-----|
| `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `BAD_REQUEST` | 400 | Malformed request or unresolvable city |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests — check `Retry-After` header |
| `PROVIDER_ERROR` | 502 | Weather provider returned an error |
| `PROVIDER_TIMEOUT` | 504 | Provider didn't respond in time |
| `SERVICE_UNAVAILABLE` | 503 | All providers failed or feature requires unconfigured key |
| `GEOCODING_ERROR` | 400 | Location detection failed (e.g. private IP) |
| `CONFLICT` | 409 | Duplicate resource |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

</details>

<details>
<summary><kbd>📋</kbd> <b>Response headers</b></summary>

| Header | Description |
|:-------|:------------|
| `X-Request-ID` | Unique ID for every request — use for support/debugging |
| `X-Response-Time-Ms` | Server processing time in milliseconds |
| `X-RateLimit-Limit` | Your rate limit ceiling |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `Retry-After` | Seconds to wait after a 429 |

</details>

<br>

## 🚀 Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports: ["8000:8000"]
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }

  celery-weather:
    build: .
    command: celery -A app.tasks.celery_app worker -Q weather -l info
    env_file: .env
    depends_on: [redis, postgres]

  celery-alerts:
    build: .
    command: celery -A app.tasks.celery_app worker -Q alerts -l info
    env_file: .env
    depends_on: [redis, postgres]

  celery-beat:
    build: .
    command: celery -A app.tasks.celery_app beat -l info
    env_file: .env
    depends_on: [redis]

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: weatherly
      POSTGRES_USER: weatherly
      POSTGRES_PASSWORD: weatherly
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: pg_isready -U weatherly
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]
    healthcheck:
      test: redis-cli ping
      interval: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

```bash
docker-compose up -d
```

### Weather Provider Keys

> You need **at least one** key. The aggregator automatically uses whatever is configured. Open-Meteo and NOAA are always available with no key required.

| Provider | Free Tier | Key Required |
|:---------|:----------|:------------:|
| [Open-Meteo](https://open-meteo.com/) | Unlimited | ✗ |
| [NOAA](https://www.weather.gov/documentation/services-web-api) | Unlimited | ✗ |
| [OpenWeatherMap](https://openweathermap.org/api) | 1,000 calls/day | ✓ |
| [WeatherAPI](https://www.weatherapi.com/) | 1M calls/month | ✓ |
| [Tomorrow.io](https://www.tomorrow.io/weather-api/) | 500 calls/day | ✓ |
| [Copernicus](https://atmosphere.copernicus.eu/) | Free registration | ✓ (marine/env only) |

<br>

## 🏗️ Architecture

```
  Clients ─── REST ───────────────┐
                                  │
                           ┌──────┴──────┐
                           │   FastAPI   │
                           │             │
                           │  Middleware │─── ObservabilityMiddleware (outermost)
                           │             │─── SecurityHeadersMiddleware
                           │             │─── RateLimitMiddleware (Redis)
                           │             │─── TrustedHostMiddleware
                           │             │─── CORSMiddleware
                           │             │
                           │  Services   │
                           │  ├ Weather  │─── Current, forecast, history,
                           │  │          │    AQI, maps, indices, insights,
                           │  │          │    trends, compare, astronomy
                           │  ├ Location │─── GPS/browser/IP detect,
                           │  │          │    search, geocode, nearby
                           │  ├ Alert    │─── Query, ingest, dedup, stats
                           │  └ Cache    │─── Redis TTL + key invalidation
                           │             │
                           │  Provider   │
                           │  Aggregator │──→ Open-Meteo  (no key)
                           │             │──→ NOAA        (no key)
                           │  (failover  │──→ OpenWeatherMap
                           │   + health  │──→ WeatherAPI
                           │   tracking) │──→ Tomorrow.io
                           │             │──→ Copernicus
                           └──────┬──────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
               ┌─────┴──────┐           ┌──────┴──────┐
               │ PostgreSQL │           │    Redis    │
               │            │           │             │
               │ locations  │           │  Weather    │
               │ (geocode   │           │  cache      │
               │  cache +   │           │  Rate limit │
               │  search)   │           │  counters   │
               │            │           │  Provider   │
               │ alerts     │           │  health     │
               │ (active +  │           │             │
               │  history)  │           │             │
               └────────────┘           └─────────────┘
```

### Background Tasks

| Task | Queue | Frequency | Purpose |
|:-----|:------|:----------|:--------|
| Deactivate expired alerts | `alerts` | Every 5 min | Mark past-expiry alerts inactive |
| Ingest provider alerts | `alerts` | Every 15 min | Fetch new alerts for top 30 locations |
| Warm caches | `weather` | Every 10 min | Pre-fetch weather for top 50 locations |
| Provider health check | `weather` | Every 5 min | Track which providers are responding |

<br>

## ⚡ Performance

| Metric | Target |
|:--|:--|
| **Cached response** | < 50ms |
| **Uncached response** | < 500ms |
| **Cache hit rate** | ~85% |
| **Data freshness** | 10 min (current) · 30 min (forecast) |
| **Alert freshness** | 5 min |

<br>

## 🛡️ Security

| Layer | Implementation |
|:------|:---------------|
| **Rate limiting** | Redis sliding window — 60 req/min per IP |
| **Input validation** | Pydantic v2 on all inputs — coordinates, dates, strings |
| **SQL injection** | SQLAlchemy ORM with parameterised queries only |
| **XSS / Clickjacking** | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `HSTS` |
| **CORS** | Configurable allowed origins via `CORS_ORIGINS` |
| **API key auth** | Optional `X-API-KEY` header — enforced when `API_KEY` env var is set |
| **Request tracking** | `X-Request-ID` on every response — logged for every request |
| **String sanitization** | HTML/script tag stripping on all text query inputs |
| **Trusted proxies** | Configurable `TRUSTED_PROXY_COUNT` for correct client IP behind load balancers |

<br>

<div align="center">

<br>

<img src="../web/src/assets/logo-weatherly.png" width="162" height="54" alt="Weatherly">

<sub>Real-time weather intelligence, aggregated and open</sub>
<br>
<sub>Open-Meteo · OpenWeatherMap · WeatherAPI · Tomorrow.io · NOAA · Copernicus</sub>
<sub>MIT License © 2024</sub>

</div>