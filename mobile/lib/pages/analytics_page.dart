// lib/pages/analytics_page.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../components/analytics/activity_gauges.dart';
import '../components/analytics/temp_chart.dart';
import '../components/common/smooth_scroll.dart';
import '../components/nav/app_shell.dart';
import '../components/ui/app_button.dart';
import '../components/ui/error_state.dart';
import '../components/ui/skeleton.dart';
import '../components/ui/state_screen.dart';
import '../providers/analytics_provider.dart';
import '../stores/app_store.dart';
import '../stores/location_store.dart';
import '../theme/app_theme.dart';

class AnalyticsPage extends StatefulWidget {
  const AnalyticsPage({super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (context.read<LocationStore>().ready) {
        context.read<AnalyticsProvider>().refresh();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final ready = context.select<LocationStore, bool>((s) => s.ready);
    final units = context.select<AppStore, String>((a) => a.units);
    final trendHours =
        context.select<AnalyticsProvider, int>((p) => p.trendHours);
    final trends = context
        .select<AnalyticsProvider, Map<String, dynamic>?>((p) => p.trends);
    final error = context.select<AnalyticsProvider, Object?>((p) => p.error);
    final loading = context.select<AnalyticsProvider, bool>((p) => p.loading);
    final dark = Theme.of(context).brightness == Brightness.dark;

    if (!ready) {
      return AppShell(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: StateScreen(
            icon: Icons.bar_chart_rounded,
            title: 'Set your location',
            description: 'Confirm your location to view analytics.',
            action: AppButton(
              label: 'Search for a city',
              onPressed: () => Navigator.of(context).pushNamed('/search'),
            ),
          ),
        ),
      );
    }

    if (error != null && trends == null) {
      return AppShell(
        child: ErrorState(
          error: error,
          onRetry: () => context.read<AnalyticsProvider>().refresh(),
        ),
      );
    }

    final rawPoints = trends?['data_points'];
    final points = rawPoints is List
        ? rawPoints
            .whereType<Map>()
            .map((e) => e.cast<String, dynamic>())
            .toList()
        : <Map<String, dynamic>>[];

    return AppShell(
      child: SmoothScrollView(
        children: [
          Text(
            'Analytics',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.5,
              color: dark ? AppColors.stone50 : AppColors.stone900,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [12, 24, 48, 72, 168].map((h) {
              final active = trendHours == h;
              return Padding(
                padding: const EdgeInsets.only(right: 6),
                child: InkWell(
                  onTap: () =>
                      context.read<AnalyticsProvider>().setTrendHours(h),
                  borderRadius: BorderRadius.circular(999),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: active ? AppColors.brand500 : Colors.transparent,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      h <= 48 ? '${h}h' : '${h ~/ 24}d',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: active ? Colors.white : AppColors.stone500,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          if (loading && points.isEmpty)
            const SkeletonCardTile(height: 260)
          else if (points.isNotEmpty)
            RepaintBoundary(
              child: TempChart(
                dataPoints: points,
                periodHours: trendHours,
                units: units,
              ),
            ),
          const SizedBox(height: 12),
          const RepaintBoundary(child: ActivityGauges()),
        ],
      ),
    );
  }
}