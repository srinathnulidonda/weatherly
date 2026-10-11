# Changelog

All notable changes to Weatherly are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). For narrative notes, install steps and migration help, see [RELEASES.md](RELEASES.md).

---

## [Unreleased]

_Nothing yet._

---

## [2.0.0] — 2026-10-11

**Full rewrite.** New FastAPI backend with multi-provider aggregation, new React/Vite web app, and a rebuilt Flutter mobile app.

### Added

#### Backend

- Multi-provider aggregation with automatic failover across Open-Meteo, NOAA, OpenWeatherMap, WeatherAPI, Tomorrow.io and Copernicus, plus per-provider health reporting
- Weather endpoints: current conditions, 1–16 day forecast with optional hourly data, 30-day history, alerts by radius and severity, air quality (AQI, PM2.5, PM10, O₃, NO₂, SO₂, CO), map tile URLs for five layers, and astronomy (sun, moon, moon phase)
- Analytics endpoints: trends (1–168 h), comparison of 2–5 locations, activity indices (comfort, outdoor, running, cycling, gardening, allergy, driving), condition insights, alert statistics
- Marine and environmental endpoints: ocean, tides, agriculture, environmental
- `GET /api/v1/app/version`, the update manifest for the Android app, with its own rate limit (`APP_UPDATE_RATE_LIMIT_PER_MINUTE`)
- `/health`, plus API-key-protected `/health/detailed` and `/metrics`
- Celery queues `weather`, `alerts` and `default` for cache warming, alert ingestion and expiry
- Alembic migrations for schema versioning

#### Web

- React 18 + Vite 5 app with a TailwindCSS 3 design system and light/dark modes
- Zustand store (theme, units, saved locations, recent searches) and React Query for server state
- Framer Motion transitions and micro-interactions
- **DynamicSky** engine: gradient stops for 11 condition categories × 4 solar phases
- GPS → browser → IP location pipeline with precision scoring
- Location pager with drag-to-reorder, long-press menu and live temperature chips
- Analytics page (trends, activity gauges, insight cards) and Alerts page (radius selector, radar map, expandable cards, statistics)
- Settings page (theme, units, current and saved locations, legal links)
- Legal pages (Terms, Privacy, Cookies) with a shared scaffold, and a custom 404 page
- Error boundaries (inline and full-page), skeleton loaders for every card type, and an offline banner
- PWA scaffolding with manifest and icon
- Android download page (`/apk`) with SHA-256 verification, and release history (`/apk/releases`), both driven by `releases.json`
- `vercel.json` so deep links such as `/apk` work on direct load

#### Mobile

- Flutter app with Provider-based state (`LocationProvider`, `WeatherProvider`, `AlertsProvider`, `AnalyticsProvider`), and `LocationStore` and `AppStore` persisted with `SharedPreferences`
- **Dynamic Sky** engine: custom painter for gradient, sun, moon, clouds, rain, snow, fog, storm, wind, haze and lightning, with solar-arc transitions and moon phase from illumination
- Custom-painted temperature chart, AQI gauge, wind compass (36 ticks, spring-animated needle) and sun arc
- Custom-painted alert radar plotting alerts by bearing and distance
- Smart advisories: a 14-rule engine covering storms, extreme temperatures, AQI, UV, wind, fog, rain, snow and feels-like deviations
- Animated write-on splash
- Location pager with live temperature previews (capped at 8 to limit API calls)
- Bottom navigation with animated indicator and alert badge, and a sidebar for tablet and desktop widths
- Light, dark and system themes with a weather-aware palette
- Legal pages with a shared `LegalScaffold`
- Last-known weather restored from cache when offline
- **In-app updates:** checks the backend after launch, downloads the APK, verifies its SHA-256, and hands it to the system installer. Supports mandatory updates (minimum version or force flag), a "Later" option, and guidance when installs from this app are not yet allowed
- App icon pipeline via `flutter_launcher_icons`

#### Performance

- Impeller disabled on Android through manifest metadata, targeting MediaTek and Realme devices with known jank
- Static sky painter: rebuilt only when the condition category or day/night changes, not every frame
- `TickerMode` pauses animation controllers while scrolling
- `RepaintBoundary` on heavy cards for isolated raster layers
- Row-based grids replace nested `GridView.count(shrinkWrap: true)`, the main source of frame jank
- `context.select` instead of `context.watch` at page level, so cards rebuild only when their slice changes
- `cacheExtent: 300` on scroll views

### Changed

- Backend framework: **Flask → FastAPI**, with all endpoints under `/api/v1`
- Backend data source: single OpenWeatherMap → **six-provider aggregation**
- Backend responses: successful responses use a `data` envelope with a `message`; errors use `{ error, error_code, message, details }`
- Backend alerts are paginated
- Backend rate limiting: per-endpoint limits (30 / 20 / 10) → one per-IP limit, configurable with `RATE_LIMIT_PER_MINUTE` (default 120)
- Web frontend: vanilla HTML/CSS/JS → **React 18 + Vite + TailwindCSS**
- Web state: ad-hoc localStorage → **Zustand + React Query**
- Mobile package ID: `com.example.weather` → `com.sn.weatherly` (breaking: existing installs are a different app)
- Mobile state: singleton managers → **Provider + ChangeNotifier**
- Mobile theming: static gradient map → **Dynamic Sky engine** with solar arc
- Mobile structure: `screens/` → `pages/`; utilities split into `theme/`, `utils/`, `providers/`, `stores/`

### Removed

- Backend: Flask app (`app.py`) and its synchronous handlers; `/api/v1/weather/{city}`, `/api/v1/weather/coordinates`, `/api/v1/forecast/{city}` and `/api/v1/weather/bulk`
- Web: `js/main.js`, `js/theme.js`, `js/animations.js`, `css/style.css`, `css/responsive.css`, and the multi-page routes such as `/about.html`
- Mobile: `splash_screen.dart`, `home_screen.dart`, `settings_screen.dart`, `about_screen.dart`; `ThemeManager`, `NotificationManager` and `SavedLocationsManager` (replaced by `LocationStore`); local push notifications

### Fixed

- Mobile scroll jank on MediaTek chips (see Performance)
- Mobile night icons and activity gauges
- Mobile alerts list keeps its items when loading more results
- Mobile location updates: `watchPosition` no longer fires for manual or IP-derived locations
- Web location detector: cached GPS fixes are honoured for 15 minutes before re-detection
- Web forecast hook: hourly entries are flattened across multi-day payloads and filtered from the current hour

### Security

- Request ID (`X-Request-ID`) and response time (`X-Response-Time-Ms`) on every response for traceability
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- Redis-backed sliding-window rate limiting, with `Retry-After` on rejected requests
- Optional API-key enforcement through `X-API-KEY` when `API_KEY` is set
- CORS allowlist from `CORS_ORIGINS`
- Configurable trusted-proxy count for correct client IPs behind load balancers
- Production start-up validation: `API_KEY` required, explicit `ALLOWED_HOSTS`, no wildcard CORS
- HTML and script tags stripped from free-text query inputs
- Android updates accept HTTPS download URLs only, verify the SHA-256 before installing, and rely on Android's signature check

---

## [1.0.0] — 2025-10-08 (Legacy)

**Initial public release.**

### Added

- Flask backend with OpenWeatherMap integration, Redis caching (5-minute TTL), and rate limiting (30 / 20 / 10 requests per minute)
- Endpoints for current weather by city or coordinates, forecast by city, and bulk lookups
- Vanilla HTML/CSS/JS web app with a glassmorphism design, installable as a PWA
- Dynamic theming by time of day and weather category, with rain, snow, thunderstorm, fog and cloud animations
- Responsive layout for mobile, tablet and desktop, with a desktop sidebar and extended forecast
- Search with recent searches and popular-city chips
- Flutter app with splash, home, settings and about screens
- GPS location detection with IP fallback, saved locations (up to 10) via `SharedPreferences`, and local push notifications for severe weather
- APK distributed through Google Drive

### Known limitations

- Single weather provider (OpenWeatherMap)
- No analytics, insights, indices, comparison, air-quality or alert endpoints
- Vanilla JS frontend without component reuse
- Mobile theming limited to a static gradient map
- No mobile analytics, alert radar or legal pages
- Notifications limited to a subset of severe conditions

---

[Unreleased]: https://github.com/srinathnulidonda/weatherly/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/srinathnulidonda/weatherly/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/srinathnulidonda/weatherly/releases/tag/v1.0.0