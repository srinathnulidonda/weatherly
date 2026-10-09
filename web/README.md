<div align="center">
<img src="src/assets/logo-weatherly.png" width="264" height="88" alt="Weatherly">

<br>

**Premium weather experience with intelligent insights**<br>
Real-time data · Smooth animations · Multi-location tracking · Completely open

<img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React">
<img src="https://img.shields.io/badge/Vite-5.4-BF4094?style=flat-square&logo=vite&logoColor=white" alt="Vite">
<img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS">
<img src="https://img.shields.io/badge/Zustand-4.5-FFCD56?style=flat-square&logo=zustand&logoColor=white" alt="Zustand">
<img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">

<br>

<a href="#-quick-start"><img src="https://img.shields.io/badge/Quick_Start-▶-2ea44f?style=for-the-badge" alt="Quick Start"></a>
<a href="#-features"><img src="https://img.shields.io/badge/Features-✨-8957e5?style=for-the-badge" alt="Features"></a>
<a href="#-architecture"><img src="https://img.shields.io/badge/Architecture-🏗️-0969da?style=for-the-badge" alt="Architecture"></a>
<a href="#-deployment"><img src="https://img.shields.io/badge/Deploy-🚀-e5534b?style=for-the-badge" alt="Deploy"></a>

---

</div>

## Why Weatherly Web?

Most weather websites offer basic data with clunky interfaces and provider lock-in. Weatherly Web solves this with:

<table>
<tr>
<td width="50%">

**🌐 Unified API Layer**<br>
<sub>Consumes our backend's aggregated weather data from 5+ providers with automatic failover. No need to manage multiple API keys.</sub>

**🎨 Beautiful, Fluid UI**<br>
<sub>Framer Motion animations, custom illustrations, and Tailwind CSS create a premium, app-like experience.</sub>

**⚡ Intelligent Caching**<br>
<sub>React Query with smart invalidation provides instant UI updates while minimizing API calls.</sub>

</td>
<td width="50%">

**📍 Advanced Location Handling**<br>
<sub>GPS → Browser Geolocation → IP fallback with accuracy scoring and manual override.</sub>

**📊 Rich Analytics Integration**<br>
<sub>Activity indices, weather trends, comparisons, and AI-style insights built into the UI.</sub>

**🎯 Theme-Aware Design**<br>
<sub>Dark/light mode with custom color tokens that adapt to weather conditions (sunny = warm tones, stormy = cool tones).</sub>

</td>
</tr>
</table>

<br>

## ⚡ Quick Start

> **Prerequisites:** Node.js 16+ · npm or yarn

```bash
git clone https://github.com/your-org/weatherly.git
cd weatherly/web

npm install

cp .env.example .env    # Configure API URL if needed

npm run dev
```

That's it. Open **http://localhost:5173** and start exploring.

<details>
<summary><kbd>▶</kbd> <b>Development Tools</b><sub>(optional — enhances development experience)</sub></summary>

<br>

```bash
# Install React DevTools for better debugging
# Install Tailwind CSS IntelliSense for VS Code
```

</details>

<br>

## 🌟 Features

### Core Features

- **Real-time Weather** - Current conditions with provider sourcing and precision indicators
- **Interactive Forecasts** - Hourly and daily forecasts with visualizations
- **Smart Location Detection** - Automatic detection with manual override capabilities
- **Weather Alerts** - Active alerts with severity filtering and descriptions
- **Air Quality Index** - Pollutant levels and health recommendations
- **Astronomy Data** - Sunrise/sunset, moon phases, and celestial events
- **UV Index** - Exposure risk and protection recommendations
- **Wind Details** - Speed, direction, gusts, and Beaufort scale
- **Precipitation Data** - Rain/snow accumulation and probability
- **Pressure & Visibility** - Atmospheric conditions and clarity indicators

### Analytics & Insights

- **Activity Indices** - Comfort scores for running, cycling, gardening, etc.
- **Weather Trends** - Temperature, pressure, and humidity changes over time
- **Location Comparison** - Side-by-side analysis of multiple locations
- **Condition Insights** - Activity recommendations based on current weather
- **Alert Statistics** - Historical alert patterns and frequency analysis

### User Experience

- **Smooth Animations** - Framer Motion-powered transitions and micro-interactions
- **Dynamic Backgrounds** - Weather-responsive sky illustrations that change with conditions
- **Theme Adaptation** - Automatic dark/light mode with weather-aware color schemes
- **Gesture Navigation** - Swipe between locations on touch devices
- **Pull-to-Refresh** - Intuitive data refresh with visual feedback
- **Offline Support** - Cached data display with stale-while-revalidate strategy
- **PWA Capabilities** - Installable web app with manifest and service worker (planned)

<br>

## 📡 API Integration

The frontend communicates with the Weatherly backend API at `/api/v1`. All requests are automatically proxied through Vite in development.

### Weather Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/weather/current` | GET | Current conditions with metadata |
| `/weather/forecast` | GET | Hourly/daily forecast data |
| `/weather/history` | GET | Historical weather data |
| `/weather/alerts` | GET | Active weather alerts |
| `/weather/air-quality` | GET | AQI and pollutant levels |
| `/weather/maps` | GET | Map tile URLs for weather layers |
| `/weather/astronomy` | GET | Sun/moon data and phases |

### Location Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/locations/detect` | POST | Smart location detection (GPS/Browser/IP) |
| `/locations/detect/ip` | GET | IP-based geolocation only |
| `/locations/search` | GET | Search by name/query |
| `/locations/reverse-geocode` | GET | Coordinates to address |
| `/locations/nearby` | GET | Find locations within radius |
| `/locations/{id}` | GET | Get stored location by ID |

### Analytics Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analytics/trends` | GET | Weather parameter trends over time |
| `/analytics/compare` | POST | Multi-location comparison |
| `/analytics/indices` | GET | Activity and comfort scores |
| `/analytics/insights` | GET | Condition-based recommendations |
| `/analytics/alert-stats` | GET | Alert frequency and severity data |

### System Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Liveness check |
| `/health` | GET | Service health status |
| `/health/detailed` | GET | Per-service health metrics |
| `/metrics` | GET | Request and performance metrics |

<br>

## 📖 Examples

### Current Weather Display

```jsx
import { useCurrentWeather } from '@/hooks/useWeather';
import { formatTemp, formatCondition, formatWind } from '@/utils/formatters';
import { WeatherIcon } from '@/components/ui/WeatherIcon';

function CurrentWeatherDisplay() {
  const { data: weather, isLoading, error } = useCurrentWeather();
  
  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={error.message} />;
  
  return (
    <div className="text-center space-y-4">
      <WeatherIcon 
        condition={weather.condition.main} 
        isDay={weather.is_day} 
        className="h-16 w-16" 
      />
      <h1 className="text-4xl font-bold">
        {formatTemp(weather.temperature_c)}
      </h1>
      <p className="text-lg">
        {formatCondition(weather.condition)}
      </p>
      <div className="flex justify-center space-x-6">
        <div>
          <p className="text-sm">Feels Like</p>
          <p className="font-medium">{formatTemp(weather.feels_like_c)}</p>
        </div>
        <div>
          <p className="text-sm">Wind</p>
          <p className="font-medium">{formatWind(weather.wind.speed_ms)}</p>
        </div>
        <div>
          <p className="text-sm">Humidity</p>
          <p className="font-medium">{weather.humidity}%</p>
        </div>
      </div>
    </div>
  );
}
```

### Location Detection

```jsx
import { useLocation } from '@/hooks/useLocation';
import { useNavigate } from 'react-router-dom';

function LocationDetector() {
  const { ready, locationError } = useLocation();
  const navigate = useNavigate();
  
  const handleLocationAccess = async () => {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000
        })
      );
      
      // This triggers automatic detection via the hook
      // In practice, the hook handles this automatically
    } catch (err) {
      // Fall back to IP detection automatically handled by backend
    }
  };
  
  if (!ready) {
    return (
      <div className="text-center py-8">
        <p className="text-stone-400">
          {locationError || 'Enable location access or search for a city'}
        </p>
        <button 
          onClick={handleLocationAccess}
          className="btn-primary mt-4"
        >
          Use My Location
        </button>
      </div>
    );
  }
  
  return <Children />; // Show main app when location is ready
}
```

### Weather Chart with Recharts

```jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useForecast } from '@/hooks/useWeather';
import { formatTemp } from '@/utils/formatters';

function TemperatureChart() {
  const { data: forecast, isLoading } = useForecast();
  
  if (isLoading || !forecast?.days) return <SkeletonChart />;
  
  const chartData = forecast.days.map(day => ({
    day: formatDateTime(day.datetime, 'MMM d'),
    temp: day.temp_avg_c,
    tempMin: day.temp_min_c,
    tempMax: day.temp_max_c
  }));
  
  return (
    <LineChart 
      data={chartData}
      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
      <YAxis 
        label={{ value: 'Temperature', angle: -90, position: 'insideLeft' }}
        tick={{ 
          formatter: (value) => `${formatTemp(value)}°`,
          fontSize: 12 
        }} 
      />
      <Tooltip 
        formatter={(value) => `${formatTemp(value)}°`}
        labelFormatter={(value) => `${value}°`}
      />
      <Line 
        type="monotone" 
        dataKey="temp" 
        stroke="orange-400" 
        strokeWidth={2}
        dot={false}
      />
      {/* Optional: Min/Max range area */}
    </LineChart>
  );
}
```

<br>

## 📊 Response Format

All API responses follow a consistent format:

### ✅ Success Response

```json
{
  "success": true,
  "data": { /* Payload varies by endpoint */ },
  "message": "Human-readable description",
  "timestamp": "ISO 8601 timestamp"
}
```

### ❌ Error Response

```json
{
  "error": true,
  "error_code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { /* Additional error details */ },
  "timestamp": "ISO 8601 timestamp"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `NOT_FOUND` | 404 | Requested resource doesn't exist |
| `BAD_REQUEST` | 400 | Malformed request or invalid data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests - check Retry-After header |
| `PROVIDER_ERROR` | 502 | Weather provider returned error |
| `PROVIDER_TIMEOUT` | 504 | Provider timeout |
| `SERVICE_UNAVAILABLE` | 503 | All providers failed or feature unavailable |
| `GEOCODING_ERROR` | 400 | Location detection failed |
| `AUTH_ERROR` | 401/403 | Authentication or authorization failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

<br>

## 🏗️ Architecture

```
Browser ─── HTTPS/WSS ────────────┐
                                  │
                           ┌──────┴──────┐
                           │   Vite      │
                           │  Dev Server │
                           │             │
                           │  Plugins    │─── @vitejs/plugin-react
                           │             │   (JSX/Fast Refresh)
                           │             │
                           │  Bundle     │
                           │  (ESM)      │
                           └──────┬──────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
               ┌─────┴──────┐           ┌──────┴──────┐
               │ React App  │           │  Service    │
               │            │           │  Worker     │
               │ (SPA)      │           │  (PWA)      │
               │            │           │             │
               │ Components │           │  Caching    │
               │  ├ Layout  │           │  Strategies │
               │  │         │           ├─────────────┤
               │  │         │           │  Background │
               │  ├ Pages   │           │  Sync       │
               │  │         │           │             │
               │  │         │           │  Network    │
               │  ├ API     │           │  Requests   │
               │  │         │           ├─────────────┤
               │  │         │           │  Cache      │
               │  ├ Store   │           │  Management │
               │  │         │           │  (IndexedDB)│
               │  └ Hooks   │           │             │
               └────────────┘           └─────────────┘
```

### State Management

- **Zustand** - Global app state (units, theme, location history)
- **React Query** - Server state management (weather data, caching, background updates)
- **Context API** - Theme distribution and localization
- **LocalStorage** - Persistent user preferences and location history

### Data Flow

1. **Location Detection** → Browser API → Backend `/locations/detect`
2. **Weather Fetch** → Backend `/weather/*` endpoints → React Query cache
3. **State Updates** → Zustand store updates → Component re-renders
4. **Background Sync** → Service worker (planned) → Periodic updates
5. **Persistence** → LocalStorage/IndexedDB → Offline capability

### Performance Optimizations

- **Code Splitting** - Route-based lazy loading with React.lazy()
- **Image Optimization** - SVGs for icons, WebP for raster images
- **CSS Optimization** - TailwindCSS JIT purging unused styles
- **Bundle Analysis** - Manual chunks for vendor libraries
- **Prefetching** - Anticipatory data loading for navigation
- **Virtual Scrolling** - For long lists (forecast hours, alert lists)

<br>

## 🚀 Deployment

### Static Hosting (Recommended)

Weatherly Web is a static SPA that can be hosted anywhere:

```bash
# Build for production
npm run build

# Output goes to /dist directory
# Deploy contents of /dist to your static host
```

#### Popular Hosting Options

- **Vercel** - `vercel` (zero-config deployment)
- **Netlify** - Netlify CLI or Git integration
- **Cloudflare Pages** - Wrangler CLI
- **Firebase Hosting** - Firebase CLI
- **GitHub Pages** - `npm run preview` then push to gh-pages branch
- **S3/CloudFront** - AWS CLI deployment
- **Traditional Hosting** - Any static file host (Apache, Nginx, etc.)

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Optional: API proxy to backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
docker build -t weatherly-web .
docker run -d -p 80:80 --name weatherly-web weatherly-web
```

### Environment Variables

Create `.env` file in web directory:

```env
VITE_APP_NAME=Weatherly
VITE_API_URL=https://your-backend-domain.com    # Required in production
VITE_DEFAULT_UNITS=metric
VITE_ENABLE_PWA=false                          # Set to true when PWA ready
VITE_ENABLE_DEBUG_TOOLS=false                  # Disable in production
```

<br>

## ⚡ Performance

| Metric | Target | Measurement Tool |
|--------|--------|------------------|
| **First Contentful Paint** | < 1.2s | Lighthouse |
| **Largest Contentful Paint** | < 2.5s | Lighthouse |
| **First Input Delay** | < 100ms | Web Vitals |
| **Cumulative Layout Shift** | < 0.1 | Web Vitals |
| **Time to Interactive** | < 3.5s | Lighthouse |
| **Bundle Size (gzipped)** | < 250KB | webpack-bundle-analyzer |
| **Cache Hit Rate** | > 80% | React Query devtools |
| **API Request Reduction** | > 70% vs naive | Custom metrics |

### Optimization Techniques

- **React Query** - Smart caching with stale-while-revalidate
- **Selective Queries** - Only fetch needed data fields
- **Pagination** - For alerts and historical data
- **Debouncing** - Search inputs and resize handlers
- **Memoization** - React.memo and useMemo for expensive computations
- **Windowing** - For long lists (react-virtualized when needed)
- **Image Loading** - Lazy loading with Intersection Observer
- **Font Optimization** - Subsetting and preloading critical fonts

<br>

## 🛡️ Security

### Client-Side Protections

- **XSS Prevention** - React's automatic escaping + DOMPurify for user content
- **CSRF Protection** - SameSite cookies + double-submit cookie pattern
- **Clickjacking Defense** - X-Frame-Options: DENY header
- **MIME Sniffing** - X-Content-Type-Options: nosniff
- **Referrer Policy** - strict-origin-when-cross-origin
- **Content Security Policy** - Planned implementation
- **Subresource Integrity** - For third-party scripts (if any)

### Data Protection

- **API Key Security** - No keys stored client-side (all via backend)
- **Data Minimization** - Only request needed fields from API
- **Secure Storage** - Encryption for sensitive local data (planned)
- **Input Validation** - Client-side validation as backup to server
- **Rate Limiting Awareness** - Respect backend rate limits in UI

### Privacy

- **Location Privacy** - Precise location only shared with explicit consent
- **Data Retention** - Configurable history retention in settings
- **Anonymous Analytics** - Opt-in telemetry with minimal data collection
- **GDPR/CCPA Ready** - Data export and deletion capabilities (planned)
- **Cookie Compliance** - Essential-only cookies by default

<br>

## 🔧 Development

### Project Structure

```
web/
├── public/                   # Static assets
│   ├── favicon.png
│   └── fronts/               # Custom fonts
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── alerts/           # Alert-related components
│   │   ├── analytics/        # Data visualization components
│   │   │   ├── ActivityGauges.jsx
│   │   │   ├── CompareCard.jsx
│   │   │   └── TempChart.jsx
│   │   ├── common/           # Shared UI components
│   │   │   ├── HourlyForecast.jsx
│   │   │   ├── DailyForecast.jsx
│   │   │   ├── RefreshControl.jsx
│   │   │   └── PageTransition.jsx
│   │   ├── home/             # Home page specific components
│   │   │   ├── CurrentWeather.jsx
│   │   │   ├── WeatherDetails.jsx
│   │   │   ├── SmartAdvisories.jsx
│   │   │   ├── SunTimes.jsx
│   │   │   ├── AirQuality.jsx
│   │   │   ├── LocationBar.jsx
│   │   │   └── LocationPager.jsx
│   │   ├── nav/              # Navigation components
│   │   │   ├── AppShell.jsx
│   │   │   └── TopAppBar.jsx
│   │   ├── settings/         # Settings page components
│   │   │   └── LocationManager.jsx
│   │   └── ui/               # Primitive UI components
│   │       ├── Badge.jsx
│   │       ├── Card.jsx
│   │       ├── EmptyState.jsx
│   │       ├── ErrorState.jsx
│   │       ├── StateScreen.jsx
│   │       └── WeatherIcon.jsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useTheme.js       # Theme management
│   │   ├── useLocation.js    # Location detection and tracking
│   │   ├── useActiveLocation.js # Active location subscription
│   │   ├── useWeather.js     # Weather data hooks
│   │   └── useAnalytics.js   # Analytics data hooks
│   ├── lib/                  # Utility libraries
│   │   ├── cn.js             # classnames utility
│   │   ├── theme.js          # Design tokens and theme
│   │   ├── weatherCondition.js # Weather condition mappings
│   │   └── skyTheme.js       # Dynamic background themes
│   ├── pages/                # Page components
│   │   ├── Home.jsx
│   │   ├── Forecast.jsx
│   │   ├── Search.jsx
│   │   ├── Analytics.jsx
│   │   ├── Alerts.jsx
│   │   ├── Settings.jsx
│   │   └── NotFound.jsx
│   ├── utils/                # Utility functions
│   │   ├── formatters.js     # Formatting and conversion utilities
│   │   └── constants.js      # Application constants
│   ├── api/                  # API service definitions
│   │   ├── client.js         # HTTP client configuration
│   │   └── weather.js        # Weather API endpoints
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # Application entry point
│   └── index.css             # Base CSS (tailwind overrides)
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── .env.example              # Environment template
└── README.md                 # This file
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production (output to `/dist`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint (when configured) |
| `npm run test` | Run test suite (when configured) |

### Code Quality

- **Formatting** - Prettier configuration (recommended)
- **Linting** - ESLint with React hooks and accessibility rules
- **Type Checking** - PropTypes or TypeScript migration path
- **Testing** - Jest and React Testing Library (planned)
- **Commit Standards** - Conventional Commits (recommended)
- **Branch Strategy** - GitFlow or GitHub Flow

<br>

## 📱 Responsive Design

### Breakpoints

| Screen Size | Width | Usage |
|-------------|-------|-------|
| `xs` | 400px | Extra small (smartphones portrait) |
| `sm` | 640px | Small (smartphones landscape) |
| `tablet` | 768px | Tablets portrait |
| `md` | 768px | Medium (tablets landscape, small laptops) |
| `lg` | 1024px | Large (laptops, small desktops) |
| `xl` | 1280px | Extra large (desktops) |
| `2xl` | 1536px | 2X large (large desktops, TVs) |

### Layout Adaptations

- **Mobile** (< 640px): Single column, full-width components, bottom navigation (planned)
- **Tablet** (640px - 1024px): Two-column layout for main content
- **Desktop** (≥ 1024px): Three-column layout with sidebar (planned)
- **Large Desktop** (≥ 1280px): Four-column layout with expanded panels

### Touch Optimization

- **Minimum Touch Target** - 48x48px for all interactive elements
- **Gesture Support** - Swipe navigation between locations (planned)
- **Haptic Feedback** - Subtle vibrations for key interactions (when supported)
- **Reduced Motion** - Respects `prefers-reduced-motion` media query

<br>

## ♿ Accessibility

### WCAG 2.1 AA Compliance (Target)

- **Color Contrast** - Minimum 4.5:1 for text, 3:1 for large text/UI
- **Keyboard Navigation** - Full functionality via keyboard
- **Screen Reader Support** - ARIA labels and semantic HTML
- **Focus Management** - Visible focus indicators and logical tab order
- **Labeling** - All form fields have associated labels
- **Error Handling** - Clear error messages with recovery suggestions
- **Responsive Text** - Text scales properly with browser zoom
- **Alternative Text** - Meaningful descriptions for all non-decorative images

### Implementation Features

- **Semantic HTML** - Proper use of header, nav, main, section, article
- **ARIA Labels** - For icon buttons and dynamic content
- **Live Regions** - For status updates and announcements
- **Skip Links** - "Skip to main content" keyboard navigation
- **Language Attributes** - Proper `lang` attribute for screen readers
- **Document Title** - Dynamic updates for page context
- **Focus Trapping** - For modals and dropdowns
- **Reduced Motion** - Animation respect for vestibular disorder users

<br>

## 🔮 Future Enhancements

### Planned Features

- **Severe Weather Alerts** - Push notifications for critical alerts
- **Weather Maps** - Interactive radar, satellite, and forecast maps
- **Historical Comparison** - Compare current conditions to historical averages
- **Travel Weather** - Multi-stop route weather planning
- **Gardening Mode** - Plant-specific advice and frost warnings
- **Astronomy View** - Detailed moon phases and celestial event calendar
- **Community Features** - User-reported conditions and photos
- **Widgets** - Home screen and lock screen widgets (when PWA ready)
- **Voice Interface** - Voice commands for hands-free operation
- **Offline Maps** - Downloadable map tiles for offline use
- **Wearable Support** - Smartwatch companions apps

### Technical Improvements

- **TypeScript Migration** - Gradual conversion for better developer experience
- **Testing Suite** - Unit, integration, and end-to-end tests
- **CI/CD Pipeline** - Automated testing and deployment
- **Performance Monitoring** - Real-user monitoring and error tracking
- **Internationalization** - Multi-language support (i18n)
- **Theme Customization** - User-definable color schemes and accents
- **Plugin Architecture** - Extensible component system
- **Analytics Dashboard** - Admin panel for usage metrics and insights

<br>

<div align="center">

<img src="src/assets/logo-weatherly.png" width="162" height="54" alt="Weatherly">

<sub>Premium weather experience, powered by intelligent aggregation</sub>
<br>
<sub>Built with React · Vite · TailwindCSS · Zustand · React Query</sub>
<sub>MIT License © 2024-Present</sub>

</div>