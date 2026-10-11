// lib/components/forecast/daily_forecast.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/weather_provider.dart';
import '../../stores/app_store.dart';
import '../../theme/app_theme.dart';
import '../../theme/color_tokens.dart';
import '../../utils/formatters.dart';
import '../../utils/weather_condition.dart';
import '../ui/card.dart';
import '../ui/weather_icon.dart';

class DailyForecast extends StatelessWidget {
  const DailyForecast({super.key, this.days = 7});
  final int days;

  @override
  Widget build(BuildContext context) {
    final forecast = context.watch<WeatherProvider>().forecast;
    final units = context.watch<AppStore>().units;
    if (forecast == null) return const SizedBox.shrink();
    final raw = forecast['days'];
    if (raw is! List) return const SizedBox.shrink();
    final list = raw
        .whereType<Map>()
        .map((e) => e.cast<String, dynamic>())
        .take(days)
        .toList();
    if (list.isEmpty) return const SizedBox.shrink();

    double minAll = double.infinity;
    double maxAll = double.negativeInfinity;
    for (final d in list) {
      final mn = (d['temp_min_c'] as num?)?.toDouble();
      final mx = (d['temp_max_c'] as num?)?.toDouble();
      if (mn != null && mn < minAll) minAll = mn;
      if (mx != null && mx > maxAll) maxAll = mx;
    }
    if (minAll.isInfinite) minAll = 0;
    if (maxAll == double.negativeInfinity) maxAll = 30;

    final dark = Theme.of(context).brightness == Brightness.dark;

    return AppCard(
      padding: CardPadding.lg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CardTitle('$days-Day Forecast'),
          const SizedBox(height: 12),
          ...list.asMap().entries.map((entry) {
            final i = entry.key;
            final d = entry.value;
            final isToday = i == 0;
            final mn = (d['temp_min_c'] as num?)?.toDouble();
            final mx = (d['temp_max_c'] as num?)?.toDouble();
            final pop = getPrecipChance(d);
            if (mn == null || mx == null) return const SizedBox.shrink();

            final range = maxAll - minAll;
            final leftPct = range <= 0 ? 0.0 : (mn - minAll) / range;
            final rightPct = range <= 0 ? 1.0 : (mx - minAll) / range;
            final safeLeft = leftPct.clamp(0.0, 0.95);
            final safeWidth = (rightPct - safeLeft).clamp(0.05, 1.0 - safeLeft);

            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
              decoration: BoxDecoration(
                color: isToday ? const Color(0x14F97316) : null,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 76,
                    child: Text(
                      formatDay(d['date']),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isToday
                            ? AppColors.brand500
                            : (dark ? AppColors.stone300 : AppColors.stone700),
                      ),
                    ),
                  ),
                  WeatherIcon(
                    condition: getConditionKey(d['condition']),
                    size: WeatherIconSize.sm,
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 32,
                    child: pop != null && pop > 0
                        ? Text(
                            formatPercent(pop),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: pop > 60
                                  ? const Color(0xFF3B82F6)
                                  : (pop > 30
                                      ? const Color(0xCC3B82F6)
                                      : AppColors.stone400),
                            ),
                          )
                        : const Text(
                            '—',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppColors.stone300,
                            ),
                          ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        return Stack(
                          children: [
                            Container(
                              height: 6,
                              decoration: BoxDecoration(
                                color: dark
                                    ? const Color(0x0FFFFFFF)
                                    : AppColors.stone200,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            Positioned(
                              left: safeLeft * constraints.maxWidth,
                              top: 0,
                              child: Container(
                                height: 6,
                                width: safeWidth * constraints.maxWidth,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [colorAtTemp(mn), colorAtTemp(mx)],
                                  ),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${formatTemp(mn, units, showUnit: false)}/${formatTemp(mx, units, showUnit: false)}°',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: dark ? AppColors.stone300 : AppColors.stone700,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}