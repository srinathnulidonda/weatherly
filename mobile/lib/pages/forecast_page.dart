// lib/pages/forecast_page.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../components/common/smooth_scroll.dart';
import '../components/forecast/daily_forecast.dart';
import '../components/forecast/hourly_forecast.dart';
import '../components/forecast/precipitation_timeline.dart';
import '../components/nav/app_shell.dart';
import '../components/ui/app_button.dart';
import '../components/ui/error_state.dart';
import '../components/ui/skeleton.dart';
import '../components/ui/state_screen.dart';
import '../providers/weather_provider.dart';
import '../stores/location_store.dart';
import '../theme/app_theme.dart';

class ForecastPage extends StatelessWidget {
  const ForecastPage({super.key});

  @override
  Widget build(BuildContext context) {
    final ready = context.select<LocationStore, bool>((s) => s.ready);
    final days = context.select<WeatherProvider, int>((p) => p.forecastDays);
    final provider = context.watch<WeatherProvider>();

    if (!ready) {
      return AppShell(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: StateScreen(
            icon: Icons.calendar_month_rounded,
            title: 'Set your location',
            description: 'Confirm your location to see the forecast.',
            action: AppButton(
              label: 'Search for a city',
              onPressed: () => Navigator.of(context).pushNamed('/search'),
            ),
          ),
        ),
      );
    }

    if (provider.error != null && provider.forecast == null) {
      return AppShell(
        child: ErrorState(
          error: provider.error,
          onRetry: () => context.read<WeatherProvider>().refresh(),
        ),
      );
    }

    if (provider.forecast == null) {
      return AppShell(
        child: SmoothScrollView(
          children: const [
            SkeletonCardTile(height: 120),
            SizedBox(height: 12),
            SkeletonCardTile(height: 200),
            SizedBox(height: 12),
            SkeletonCardTile(height: 320),
          ],
        ),
      );
    }

    return AppShell(
      child: SmoothScrollView(
        children: [
          Row(
            children: [
              Text(
                'Forecast',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.5,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.stone50
                      : AppColors.stone900,
                ),
              ),
              const Spacer(),
              ...[3, 7, 14].map(
                (d) => Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: InkWell(
                    onTap: () =>
                        context.read<WeatherProvider>().setForecastDays(d),
                    borderRadius: BorderRadius.circular(999),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: days == d
                            ? AppColors.brand500
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '${d}d',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: days == d ? Colors.white : AppColors.stone500,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const RepaintBoundary(child: PrecipitationTimeline()),
          const SizedBox(height: 12),
          const RepaintBoundary(child: HourlyForecast(limit: 48)),
          const SizedBox(height: 12),
          RepaintBoundary(child: DailyForecast(days: days)),
        ],
      ),
    );
  }
}