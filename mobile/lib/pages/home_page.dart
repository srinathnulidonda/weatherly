// lib/pages/home_page.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../components/common/alert_banner.dart';
import '../components/common/refresh_control.dart';
import '../components/common/smooth_scroll.dart';
import '../components/forecast/daily_forecast.dart';
import '../components/forecast/hourly_forecast.dart';
import '../components/home/air_quality.dart';
import '../components/home/current_weather.dart';
import '../components/home/location_pager.dart';
import '../components/home/smart_advisories.dart';
import '../components/home/sun_times.dart';
import '../components/home/weather_details.dart';
import '../components/nav/app_shell.dart';
import '../components/ui/app_button.dart';
import '../components/ui/error_state.dart';
import '../components/ui/skeleton.dart';
import '../components/ui/state_screen.dart';
import '../providers/alerts_provider.dart';
import '../providers/location_provider.dart';
import '../providers/weather_provider.dart';
import '../splash/reveal_item.dart';
import '../stores/location_store.dart';
import '../utils/constants.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key, this.reveal});

  final Animation<double>? reveal;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final ready = context.read<LocationStore>().ready;
      if (!ready) return;
      context.read<WeatherProvider>().refresh();
      context.read<AlertsProvider>().refresh();
    });
  }

  Widget _reveal(int index, Widget child) {
    final r = widget.reveal;
    if (r == null) return child;

    // Staggered reveal: 80ms-equivalent delay between each element
    final double delay = index * 0.08;
    final double progress = r.value - delay;
    final double revealedProgress = progress.clamp(0.0, 1.0);

    return FadeTransition(
      opacity: AlwaysStoppedAnimation(revealedProgress),
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    final ready = context.select<LocationStore, bool>((s) => s.ready);

    if (!ready) {
      return AppShell(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: StateScreen(
            icon: Icons.location_on_rounded,
            title: 'Set your location',
            description:
                'Enable location access or search for a city to see live weather.',
            action: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppButton(
                  icon: Icons.my_location_rounded,
                  label: 'Use current location',
                  fullWidth: true,
                  onPressed: () => context
                      .read<LocationProvider>()
                      .detectLocation(highAccuracy: true),
                ),
                const SizedBox(height: 8),
                AppButton(
                  variant: AppButtonVariant.outline,
                  icon: Icons.search_rounded,
                  label: 'Search for a city',
                  fullWidth: true,
                  onPressed: () =>
                      Navigator.of(context).pushNamed(AppRoutes.search),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Only rebuild this page when these specific values change, not on
    // every WeatherProvider notification.
    final hasData =
        context.select<WeatherProvider, bool>((p) => p.current != null);
    final hasError =
        context.select<WeatherProvider, bool>((p) => p.error != null) &&
            !hasData;

    if (hasError) {
      return AppShell(
        child: ErrorState(
          error: context.read<WeatherProvider>().error,
          onRetry: () => context.read<WeatherProvider>().refresh(),
        ),
      );
    }

    if (!hasData) {
      return AppShell(
        child: RefreshControl(
          onRefresh: () => context.read<WeatherProvider>().refresh(),
          child: SmoothScrollView(
            children: const [
              SkeletonHeroBlock(),
              SizedBox(height: 16),
              SkeletonCardTile(height: 120),
              SizedBox(height: 12),
              SkeletonCardTile(height: 200),
            ],
          ),
        ),
      );
    }

    return AppShell(
      child: RefreshControl(
        onRefresh: () => context.read<WeatherProvider>().refresh(),
        child: SmoothScrollView(
          children: [
            _reveal(0, const AlertBanner()),
            const SizedBox(height: 8),
            _reveal(1, const LocationPager()),
            const SizedBox(height: 16),
            _reveal(2, const RepaintBoundary(child: CurrentWeather())),
            const SizedBox(height: 16),
            _reveal(3, const SmartAdvisories()),
            const SizedBox(height: 16),
            _reveal(4, const RepaintBoundary(child: HourlyForecast())),
            const SizedBox(height: 16),
            _reveal(5, const WeatherDetails()),
            const SizedBox(height: 16),
            _reveal(6, const RepaintBoundary(child: DailyForecast())),
            const SizedBox(height: 16),
            _reveal(7, const RepaintBoundary(child: SunTimes())),
            const SizedBox(height: 16),
            _reveal(8, const RepaintBoundary(child: AirQuality())),
          ],
        ),
      ),
    );
  }
}