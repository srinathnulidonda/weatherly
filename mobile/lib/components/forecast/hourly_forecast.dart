// lib/components/forecast/hourly_forecast.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/weather_provider.dart';
import '../../stores/app_store.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../utils/weather_condition.dart';
import '../ui/card.dart';
import '../ui/weather_icon.dart';

bool _isNightHour(dynamic value) {
  final dt = DateTime.tryParse(value?.toString() ?? '');
  if (dt == null) return false;
  final hour = dt.toLocal().hour;
  return hour < 6 || hour >= 19;
}

const double _hourlyForecastHeight = 140.0;
const double _hourlyForecastItemWidth = 62.0;

class HourlyForecast extends StatelessWidget {
  const HourlyForecast({super.key, this.limit = 24});

  final int limit;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WeatherProvider>();
    final units = context.watch<AppStore>().units;
    final hours = provider.flatHours.take(limit).toList();
    if (hours.isEmpty) return const SizedBox.shrink();
    final dark = Theme.of(context).brightness == Brightness.dark;

    return AppCard(
      padding: CardPadding.lg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CardTitle('Hourly Forecast'),
          const SizedBox(height: 12),
          SizedBox(
            height: _hourlyForecastHeight,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: hours.length,
              separatorBuilder: (_, __) => const SizedBox(width: 4),
              itemBuilder: (context, i) {
                final h = hours[i];
                final isNow = i == 0;
                final pop = getPrecipChance(h);
                return Container(
                  width: _hourlyForecastItemWidth,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isNow ? const Color(0x14F97316) : null,
                    borderRadius: BorderRadius.circular(12),
                    border: isNow
                        ? Border.all(color: const Color(0x33F97316))
                        : null,
                  ),
                  child: Column(
                    children: [
                      Text(
                        isNow ? 'Now' : formatHour(h['datetime_utc']),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: isNow
                              ? AppColors.brand500
                              : AppColors.stone500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      WeatherIcon(
                        condition: getConditionKey(h['condition']),
                        size: WeatherIconSize.md,
                        isNight: _isNightHour(h['datetime_utc']),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        formatTemp(
                          (h['temperature_c'] as num?)?.toDouble(),
                          units,
                        ),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: dark
                              ? AppColors.stone100
                              : AppColors.stone800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        pop != null && pop > 0 ? formatPercent(pop) : '0%',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: pop != null && pop > 50
                              ? const Color(0xFF3B82F6)
                              : (pop != null && pop > 0
                                  ? const Color(0x993B82F6)
                                  : Colors.transparent),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}