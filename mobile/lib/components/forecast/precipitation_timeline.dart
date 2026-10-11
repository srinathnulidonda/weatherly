// lib/components/forecast/precipitation_timeline.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/weather_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../ui/card.dart';

const double _precipitationTimelineHeight = 60.0;

class PrecipitationTimeline extends StatelessWidget {
  const PrecipitationTimeline({super.key});

  @override
  Widget build(BuildContext context) {
    final hours = context.watch<WeatherProvider>().flatHours.take(12).toList();
    if (hours.isEmpty) return const SizedBox.shrink();
    double maxPop = 10;
    for (final h in hours) {
      final p = getPrecipChance(h) ?? 0;
      if (p > maxPop) maxPop = p;
    }

    final firstIdx =
        hours.indexWhere((h) => (getPrecipChance(h) ?? 0) >= 40);
    final (String headline, IconData headIcon, Color headColor) = firstIdx == -1
        ? (
            'No significant precipitation expected for the next 12 hours',
            Icons.umbrella_rounded,
            const Color(0xFF10B981),
          )
        : firstIdx == 0
            ? (
                'Precipitation is likely right now',
                Icons.water_drop_rounded,
                const Color(0xFF3B82F6),
              )
            : (
                'Precipitation likely around ${formatHour(hours[firstIdx]['datetime_utc'])}',
                Icons.water_drop_rounded,
                const Color(0xFF3B82F6),
              );

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CardTitle('Precipitation'),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(headIcon, size: 15, color: headColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  headline,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.stone300
                        : AppColors.stone700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: _precipitationTimelineHeight,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: hours.asMap().entries.map((entry) {
                final i = entry.key;
                final h = entry.value;
                final pop = getPrecipChance(h) ?? 0;
                final heightPct = (pop / maxPop).clamp(0.06, 1.0);
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Align(
                            alignment: Alignment.bottomCenter,
                            child: FractionallySizedBox(
                              heightFactor: heightPct,
                              widthFactor: 0.7,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: pop > 5
                                      ? const Color(0xFF60A5FA)
                                      : const Color(0x14A8A29E),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          i == 0 ? 'Now' : formatHour(h['datetime_utc']),
                          style: const TextStyle(
                            fontSize: 9,
                            color: AppColors.stone400,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.clip,
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}