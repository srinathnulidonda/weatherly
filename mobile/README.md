<div align="center">
<img src="../web/src/assets/logo-weatherly.png" width="264" height="88" alt="Weatherly">

<br>

**Native weather intelligence for Android**<br>
Real-time data · Fluid animations · Multi-location tracking · Completely open

<img src="https://img.shields.io/badge/Flutter-3.24-02569B?style=flat-square&logo=flutter&logoColor=white" alt="Flutter">
<img src="https://img.shields.io/badge/Dart-3.3+-0175C2?style=flat-square&logo=dart&logoColor=white" alt="Dart">
<img src="https://img.shields.io/badge/Provider-6.1-8957E5?style=flat-square&logo=flutter&logoColor=white" alt="Provider">
<img src="https://img.shields.io/badge/Geolocator-12.0-34A853?style=flat-square&logo=googlemaps&logoColor=white" alt="Geolocator">
<img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">

<br>

<a href="#-quick-start"><img src="https://img.shields.io/badge/Quick_Start-▶-2ea44f?style=for-the-badge" alt="Quick Start"></a>
<a href="#-features"><img src="https://img.shields.io/badge/Features-✨-8957e5?style=for-the-badge" alt="Features"></a>
<a href="#-architecture"><img src="https://img.shields.io/badge/Architecture-🏗️-0969da?style=for-the-badge" alt="Architecture"></a>
<a href="#-release"><img src="https://img.shields.io/badge/Release-🚀-e5534b?style=for-the-badge" alt="Release"></a>

---

</div>

## Why Weatherly Mobile?

The mobile app is the native Flutter port of the Weatherly web experience — same backend, same design language, tuned for phones.

<table>
<tr>
<td width="50%">

**📱 Native performance**<br>
<sub>Flutter with custom-painted animations, no WebView, no hybrid layer. 60 fps scroll and animated weather scenes.</sub>

**🎨 Dynamic Sky engine**<br>
<sub>Custom painter renders the sky gradient, sun/moon, clouds, rain, snow, and lightning based on live weather conditions.</sub>

**📍 Smart GPS location**<br>
<sub>Browser GPS → IP fallback, distance-based watch stream, accuracy scoring, and manual override.</sub>

</td>
<td width="50%">

**🌗 Adaptive theming**<br>
<sub>Light / dark / system modes with weather-aware color tokens. AQI, UV, and severity palettes match the web app.</sub>

**📊 Full analytics parity**<br>
<sub>Activity indices, temperature trends, hourly scrubber, and insights — all rendered natively.</sub>

**🔄 Unified backend**<br>
<sub>Same `/api/v1` endpoints used by the web app. No separate mobile backend.</sub>

</td>
</tr>
</table>

<br>

## ⚡ Quick Start

> **Prerequisites:** Flutter 3.24+ · Dart 3.3+ · Android SDK 21+ · A running backend

```bash
git clone https://github.com/your-org/weatherly.git
cd weatherly/mobile

flutter pub get

cp .env.example .env    # Add your backend URL if not localhost

flutter run --dart-define-from-file=.env
```

The app launches on any connected Android device or emulator.

<details>
<summary><kbd>▶</kbd> <b>Pointing at a different backend</b></summary>

<br>

Edit `.env`:

```env
API_URL=https://weatherly-dev.onrender.com
APP_NAME=Weatherly
DEFAULT_UNITS=metric
ENABLE_DEBUG_TOOLS=true
```

Then run:

```bash
flutter run --dart-define-from-file=.env
```

</details>

<details>
<summary><kbd>⚙</kbd> <b>Android build configuration</b></summary>

<br>

`android/local.properties` must contain:

```properties
sdk.dir=C:\\Users\\<you>\\AppData\\Local\\Android\\sdk
flutter.sdk=C:\\path\\to\\flutter
API_KEY=
BASE_URL=https://weatherly-dev.onrender.com
```

`android/app/build.gradle.kts` reads `BASE_URL` and injects it as a `manifestPlaceholder` and `BuildConfig` field.

</details>

<br>

## 🌟 Features

### Weather

- **Current Conditions** - Hero card with animated sky, temperature, feels-like, humidity, wind, visibility
- **Hourly Forecast** - Horizontal scroll, day-boundary separators, peak-hour marker, precip chance per hour
- **7 / 14-Day Forecast** - Colored temperature range bars, today highlighted with orange accent
- **Precipitation Timeline** - 12-hour bar chart with narrative headline
- **Interactive Scrubber** - Drag a line across 24 hours to preview temperature + condition

### Environmental

- **Air Quality Index** - Semi-circular gauge with dominant pollutant and PM2.5 / PM10 / O₃ / NO₂ / SO₂ / CO tiles
- **Sun & Moon** - Custom-painted sun arc with live position, phase-aware moon glyph
- **Wind Compass** - 36-tick compass with spring-animated needle and Beaufort scale
- **UV Index** - Color-coded with protection recommendations

### Insights

- **Smart Advisories** - 14-rule engine that surfaces rain, fog, wind, heat, cold, UV, and AQI warnings
- **Activity Indices** - Comfort, outdoor, running, cycling, gardening, allergy, driving scores
- **Weather Insights** - Condition-based recommendations with severity borders
- **Temperature Trends** - 12h / 24h / 48h / 72h / 7d custom-painted line chart

### Alerts

- **Active Alerts** - Radius filter (25–500 km), severity badges, expandable descriptions
- **Radar View** - SVG map plotting alerts by bearing and distance from your location
- **Critical Banner** - Auto-surfaces extreme / severe alerts on the home screen
- **Statistics** - Alert counts grouped by severity and event type

### Locations

- **GPS Detection** - High-accuracy fix with fallback to balanced accuracy
- **IP Fallback** - Automatic when GPS unavailable
- **Saved Locations** - Add up to unlimited, reorder with drag handles
- **Live Temp Chips** - Location pager with per-chip temperature previews (capped at 8 to limit API calls)
- **Long-Press Menu** - Set default, view weather, or remove locations
- **Manual Override** - Search any city and use it as primary

### User Experience

- **Dynamic Sky Background** - Renders as a static painter for GPU performance
- **Pull to Refresh** - Native `RefreshIndicator` with brand-colored spinner
- **Scroll Optimization** - `TickerMode` pauses animations during scroll; cards wrapped in `RepaintBoundary`
- **Skeleton Loaders** - Shimmer placeholders for every card
- **Error Boundaries** - Inline + full-page variants with retry
- **Offline Banner** - Detects connectivity loss
- **Accessibility** - Semantic labels, 44 px minimum touch targets

<br>

## 🏗 Architecture

```
        ┌────────────────────────────────────────┐
        │          Android Device                │
        │                                        │
        │  ┌──────────────────────────────────┐  │
        │  │      Flutter Application         │  │
        │  │                                  │  │
        │  │  ┌────────────┐   ┌───────────┐  │  │
        │  │  │   Pages    │   │Components │  │  │
        │  │  │            │   │           │  │  │
        │  │  │ Home       │◄──│ Home/*    │  │  │
        │  │  │ Forecast   │   │ Forecast/*│  │  │
        │  │  │ Search     │   │ Analytics/│  │  │
        │  │  │ Analytics  │   │ Alerts/*  │  │  │
        │  │  │ Alerts     │   │ Search/*  │  │  │
        │  │  │ Settings   │   │ Nav/*     │  │  │
        │  │  │ Legal/*    │   │ UI/*      │  │  │
        │  │  └──────┬─────┘   └───────────┘  │  │
        │  │         │                        │  │
        │  │  ┌──────▼─────┐   ┌───────────┐  │  │
        │  │  │ Providers  │   │  Stores   │  │  │
        │  │  │            │   │           │  │  │
        │  │  │ Location   │◄──│ Location  │  │  │
        │  │  │ Weather    │   │ App       │  │  │
        │  │  │ Alerts     │   │           │  │  │
        │  │  │ Analytics  │   │(Shared    │  │  │
        │  │  │            │   │ Prefs)    │  │  │
        │  │  └──────┬─────┘   └───────────┘  │  │
        │  │         │                        │  │
        │  │  ┌──────▼─────┐   ┌───────────┐  │  │
        │  │  │    API     │   │   Utils   │  │  │
        │  │  │            │   │           │  │  │
        │  │  │ API Client │   │Formatters │  │  │
        │  │  │ Locations  │   │Constants  │  │  │
        │  │  │ Weather    │   │Flags      │  │  │
        │  │  │            │   │Conditions │  │  │
        │  │  └──────┬─────┘   └───────────┘  │  │
        │  └─────────┼────────────────────────┘  │
        │            │                           │
        │  ┌─────────▼──────────┐                │
        │  │  Geolocator Plugin │                │
        │  │  SharedPreferences │                │
        │  └─────────┬──────────┘                │
        └────────────┼───────────────────────────┘
                     │ HTTPS
                     ▼
           ┌─────────────────────┐
           │  Weatherly Backend  │
           │   /api/v1/weather   │
           │   /api/v1/locations │
           │   /api/v1/analytics │
           └─────────────────────┘
```

### State Management

- **Provider** - `ChangeNotifier` based, one provider per domain
- **LocationStore** - Confirmed + saved + active locations persisted to `SharedPreferences`
- **AppStore** - Theme, units, recent searches
- **LocationProvider** - GPS permissions, position watch stream, IP fallback
- **WeatherProvider** - Current, forecast, hourly, air quality (auto-refetches on location or unit change)
- **AlertsProvider** - Alerts + stats, radius filtering, pagination
- **AnalyticsProvider** - Trends, indices, insights, compare, history

### Data Flow

1. **App launch** → `main.dart` initializes stores → providers subscribe
2. **Location missing** → `LocationProvider.init()` runs GPS → IP fallback
3. **Location ready** → Providers auto-fire API calls with lat/lon
4. **Theme/Units change** → `AppStore.notifyListeners()` → providers refetch → UI rebuilds
5. **Pull to refresh** → `provider.refresh()` → API call → UI updates

### Performance Optimizations

| Optimization | Impact |
|:-------------|:-------|
| **Impeller disabled** (`AndroidManifest.xml`) | Eliminates raster-thread stalls on MediaTek / Realme devices |
| **Static sky painter** | Sky costs 2 draw calls instead of ~7 |
| **`TickerMode` during scroll** | Pauses all `AnimationController`s while the finger is moving |
| **`RepaintBoundary` on heavy cards** | Isolates raster layers per card |
| **`cacheExtent: 300`** on ListView | Prefetches offscreen without pre-baking the whole list |
| **`context.select` instead of `watch`** | Cards rebuild only on their slice of state changing |
| **`BouncingScrollPhysics`** | Native-feeling momentum on every device |
| **Row-based grids** | No nested `GridView.count(shrinkWrap: true)` — that pattern blocks the scroll thread |
| **`useSeeded` particle generation** | Deterministic stars / raindrops / snow — no reshuffling on rebuild |

<br>

## 📱 Screens

| Screen | Path | Contents |
|:-------|:-----|:---------|
| **Home** | `/` | Hero card with dynamic sky · Location pager · Smart advisories · Hourly · Weather details · 7-day forecast · Sun & Moon · Air quality |
| **Forecast** | `/forecast` | 3/7/14-day toggle · Precipitation timeline · 48-hour list · Daily forecast |
| **Search** | `/search` | Debounced city search · Current location CTA · Recent searches · Popular destinations |
| **Analytics** | `/analytics` | Trend period toggle · Temperature chart · Activity gauges |
| **Alerts** | `/alerts` | Radius selector · Alert radar map · Expandable alert cards |
| **Settings** | `/settings` | Theme segmented control · Unit selector · Current location card · Saved locations · Legal links |
| **Legal** | `/legal/*` | Terms · Privacy · Cookies |

<br>

## 🎨 Design System

### Color Tokens (`lib/theme/color_tokens.dart`)

- **Brand**: `#FB923C` / `#F97316` / `#EA580C`
- **Severity**: extreme / severe / moderate / minor / unknown
- **AQI**: 6 tiers from Good (`#22C55E`) to Hazardous (`#881337`)
- **UV**: 5 tiers from Low to Extreme
- **Gauges**: 5 tiers from Excellent to Bad
- **Temperature scale**: 7 stop gradient from `-10°C` to `50°C`

### Sky Palettes (`lib/theme/sky_theme.dart`)

11 condition categories × 4 solar phases (night / dawn / day / dusk) × 4 color stops each.

Solar phase is computed by `computeSolarState()` from sunrise/sunset times — a piecewise arc that interpolates between phases based on sun elevation.

### Typography

| Role | Size | Weight |
|:-----|:-----|:-------|
| Hero temperature | 88 px | 200 |
| Page heading | 26 px | 600 |
| Section heading | 12 px | 600 |
| Metric value | 22 px | 600 |
| Label (uppercase) | 10 px | 600 |
| Body | 14 px | 400 |

<br>

## 📦 Project Structure

```
mobile/
├── android/                     # Android native config
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── kotlin/com/sn/weatherly/MainActivity.kt
│   │   │   └── res/             # Icons, splash, themes
│   │   └── build.gradle.kts     # Namespace, buildConfig, signing
│   └── local.properties         # SDK paths + API_KEY / BASE_URL
├── assets/
│   └── app-icon.png             # 1024×1024 source
├── lib/
│   ├── main.dart                # Entry, provider wiring
│   ├── app.dart                 # MaterialApp, routes, transitions
│   ├── api/                     # HTTP layer
│   │   ├── api_client.dart      # Dart wrapper around http, error mapping
│   │   ├── locations_api.dart   # /locations endpoints
│   │   └── weather_api.dart     # /weather + /analytics endpoints
│   ├── stores/                  # Persisted state (SharedPreferences)
│   │   ├── app_store.dart       # Theme, units, recent searches
│   │   └── location_store.dart  # Confirmed, saved, active locations
│   ├── providers/               # ChangeNotifier services
│   │   ├── location_provider.dart
│   │   ├── weather_provider.dart
│   │   ├── alerts_provider.dart
│   │   └── analytics_provider.dart
│   ├── utils/                   # Pure functions
│   │   ├── constants.dart       # Storage keys, nav destinations
│   │   ├── formatters.dart      # Temperature, wind, AQI, dates
│   │   ├── flags.dart           # Country code → flag emoji
│   │   └── weather_condition.dart  # Category resolution, day/night
│   ├── theme/                   # Design tokens
│   │   ├── color_tokens.dart
│   │   ├── app_theme.dart       # ThemeData light/dark
│   │   └── sky_theme.dart       # Palettes, solar arc, moon phases
│   ├── components/
│   │   ├── background/
│   │   │   └── dynamic_sky.dart
│   │   ├── nav/
│   │   │   ├── app_shell.dart
│   │   │   ├── top_app_bar.dart
│   │   │   ├── bottom_nav.dart
│   │   │   └── sidebar.dart
│   │   ├── common/
│   │   │   ├── smooth_scroll.dart
│   │   │   ├── refresh_control.dart
│   │   │   ├── offline_banner.dart
│   │   │   ├── alert_banner.dart
│   │   │   ├── location_results_list.dart
│   │   │   └── location_switcher_sheet.dart
│   │   ├── home/
│   │   │   ├── current_weather.dart
│   │   │   ├── weather_details.dart
│   │   │   ├── smart_advisories.dart
│   │   │   ├── sun_times.dart
│   │   │   ├── air_quality.dart
│   │   │   ├── location_pager.dart
│   │   │   ├── location_bar.dart
│   │   │   └── location_manager.dart
│   │   ├── forecast/
│   │   │   ├── hourly_forecast.dart
│   │   │   ├── daily_forecast.dart
│   │   │   └── precipitation_timeline.dart
│   │   ├── analytics/
│   │   │   ├── temp_chart.dart
│   │   │   └── activity_gauges.dart
│   │   ├── alerts/
│   │   │   └── alert_radius_map.dart
│   │   ├── search/
│   │   │   └── popular_destinations.dart
│   │   └── ui/
│   │       ├── card.dart
│   │       ├── badge.dart
│   │       ├── app_button.dart
│   │       ├── app_input.dart
│   │       ├── skeleton.dart
│   │       ├── empty_state.dart
│   │       ├── error_state.dart
│   │       ├── state_screen.dart
│   │       ├── tooltip.dart
│   │       ├── confirm_dialog.dart
│   │       └── weather_icon.dart
│   └── pages/
│       ├── home_page.dart
│       ├── forecast_page.dart
│       ├── search_page.dart
│       ├── analytics_page.dart
│       ├── alerts_page.dart
│       ├── settings_page.dart
│       ├── not_found_page.dart
│       └── legal/
│           ├── legal_scaffold.dart
│           ├── terms_page.dart
│           ├── privacy_page.dart
│           └── cookies_page.dart
├── .env                         # Dart-define values
├── pubspec.yaml
└── README.md
```

<br>

## 📡 API Integration

All network calls hit the same backend used by the web app (`../backend`).

| Dart call | HTTP | Endpoint |
|:----------|:----:|:---------|
| `weatherApi.current()` | `GET` | `/api/v1/weather/current` |
| `weatherApi.forecast()` | `GET` | `/api/v1/weather/forecast` |
| `weatherApi.history()` | `GET` | `/api/v1/weather/history` |
| `weatherApi.alerts()` | `GET` | `/api/v1/weather/alerts` |
| `weatherApi.airQuality()` | `GET` | `/api/v1/weather/air-quality` |
| `weatherApi.trends()` | `GET` | `/api/v1/analytics/trends` |
| `weatherApi.compare()` | `POST` | `/api/v1/analytics/compare` |
| `weatherApi.indices()` | `GET` | `/api/v1/analytics/indices` |
| `weatherApi.insights()` | `GET` | `/api/v1/analytics/insights` |
| `weatherApi.alertStats()` | `GET` | `/api/v1/analytics/alert-stats` |
| `locationsApi.detect()` | `POST` | `/api/v1/locations/detect` |
| `locationsApi.search()` | `GET` | `/api/v1/locations/search` |

Error responses are normalized to `ApiException` with `code`, `status`, and optional `retryAfter` — matching the web app's `NETWORK_ERROR` / `TIMEOUT` / `RATE_LIMIT_EXCEEDED` / `UNAUTHORIZED` codes.

<br>

## 🚀 Release

### App Icon

```bash
flutter pub get
dart run flutter_launcher_icons
```

Generates every Android mipmap and iOS app icon size from `assets/app-icon.png`.

### Debug build on a device

```bash
flutter clean
flutter pub get
flutter run --dart-define-from-file=.env -d <device-id>
```

### Profile build (verifying performance)

```bash
flutter run --profile --dart-define-from-file=.env
```

### Release APK

```bash
flutter build apk --release --dart-define-from-file=.env
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Release App Bundle (Play Store)

```bash
flutter build appbundle --release --dart-define-from-file=.env
# Output: build/app/outputs/bundle/release/app-release.aab
```

### Signing

Add to `android/local.properties` or use environment variables:

```properties
UPLOAD_STORE_FILE=../upload-keystore.jks
UPLOAD_STORE_PASSWORD=...
UPLOAD_KEY_ALIAS=...
UPLOAD_KEY_PASSWORD=...
```

Then reference them in `android/app/build.gradle.kts` inside `signingConfigs.release`.

<br>

## ⚡ Performance

| Metric | Target | Notes |
|:-------|:-------|:------|
| **Frame budget** | 16 ms | Verified via `flutter run --profile` |
| **Cold start** | < 2 s | From tap to first meaningful frame |
| **Time to first weather** | < 3 s | From launch to hero card rendered |
| **Cache hit rate** | > 90% | Weather cached per lat/lon bucket |
| **APK size** | ~28 MB | Release build, includes native libs |

### Impeller Note

Impeller is disabled via `AndroidManifest.xml`:

```xml
<meta-data
    android:name="io.flutter.embedding.android.EnableImpeller"
    android:value="false" />
```

This is specifically for devices with MediaTek GPUs (Helio, Dimensity) where the OpenGLES Impeller backend has known frame-jank issues. If you're building for a Pixel or Snapdragon flagship only, you can re-enable it by changing the value to `true` — you'll get slightly smoother animations on those chips.

<br>

## 🔮 Future Enhancements

- **Home screen widgets** - Android App Widget + Glance for current conditions
- **Push notifications** - Critical alerts via FCM
- **Offline mode** - Cache last weather per location, serve from disk
- **iOS build** - The Dart code is platform-agnostic; only iOS-specific config remains
- **Weather maps** - Tile-based radar with a map SDK
- **Custom theme accents** - User-defined brand color
- **Internationalization** - Full i18n with ARB files
- **Wear OS companion** - Quick-glance tile and complication
- **Voice queries** - Ask for weather via the assistant
- **Historical comparisons** - Compare today vs. same day last year

<br>

<div align="center">

<img src="../web/src/assets/logo-weatherly.png" width="162" height="54" alt="Weatherly">

<sub>Native weather intelligence, powered by a unified aggregation backend</sub>
<br>
<sub>Built with Flutter · Provider · Geolocator · http · SharedPreferences</sub>
<sub>MIT License © 2024-Present</sub>

</div>