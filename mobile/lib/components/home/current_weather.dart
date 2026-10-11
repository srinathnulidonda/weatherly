// lib/components/home/current_weather.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/weather_provider.dart';
import '../../stores/app_store.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../utils/weather_condition.dart';
import '../background/dynamic_sky.dart';
import '../ui/weather_icon.dart';

const double _currentWeatherLoadingHeight = 400.0;
const double _metricPillHeight = 60.0;
const double _temperatureFontSize = 88.0;

class CurrentWeather extends StatelessWidget {
  const CurrentWeather({super.key});

  @override
  Widget build(BuildContext context) {
    final weather = context.watch<WeatherProvider>();
    final units = context.watch<AppStore>().units;
    final data = weather.current;
    if (data == null) {
      return Container(
        height: _currentWeatherLoadingHeight,
        decoration: BoxDecoration(
          color: AppColors.stone900,
          borderRadius: BorderRadius.circular(AppRadius.hero),
        ),
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }

    final isDay = resolveIsDay(data);
    final conditionKey = getConditionKey(data['condition']);
    final astro = data['astronomy'] is Map
        ? (data['astronomy'] as Map).cast<String, dynamic>()
        : null;
    final wind = data['wind'] is Map
        ? (data['wind'] as Map).cast<String, dynamic>()
        : null;
    final temp = (data['temperature_c'] as num?)?.toDouble();
    final feels = (data['feels_like_c'] as num?)?.toDouble();
    final max = (data['temp_max_c'] as num?)?.toDouble();
    final min = (data['temp_min_c'] as num?)?.toDouble();
    final humidity = (data['humidity'] as num?)?.toDouble();
    final visibility = (data['visibility_m'] as num?)?.toDouble();
    final windSpeed = (wind?['speed_ms'] as num?)?.toDouble();
    final uv = (data['uv_index'] as num?)?.toDouble();

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.hero),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: DynamicSky(
              condition: conditionKey,
              isDay: isDay,
              sunrise: astro?['sunrise'] != null
                  ? DateTime.tryParse(astro!['sunrise'].toString())
                  : null,
              sunset: astro?['sunset'] != null
                  ? DateTime.tryParse(astro!['sunset'].toString())
                  : null,
              moonPhase: astro?['moon_phase_name']?.toString(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Updated ${formatRelative(data['observed_at'])}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: Colors.white.withValues(alpha: 0.75),
                        ),
                      ),
                    ),
                    if (uv != null && uv >= 3)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.15),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.wb_sunny_rounded,
                              size: 12,
                              color: Color(0xFFFCD34D),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'UV ${uv.round()}',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 32),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          formatTemp(temp, units),
                          style: TextStyle(
                            fontSize: _temperatureFontSize,
                            fontWeight: FontWeight.w200,
                            height: 0.95,
                            letterSpacing: 0, // Removed negative letter spacing
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Padding(
                      padding: const EdgeInsets.only(top: 14),
                      child: WeatherIcon(
                        condition: conditionKey,
                        size: WeatherIconSize.md,
                        isNight: !isDay,
                        glow: false, // No glow effect
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  formatCondition(data['condition']),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withValues(alpha: 0.9),
                    letterSpacing: 0, // Removed negative letter spacing
                  ),
                ),
                if (feels != null || max != null || min != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (feels != null)
                        Flexible(
                          child: Text(
                            'Feels ${formatTemp(feels, units)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                          ),
                        ),
                      if (feels != null && (max != null || min != null))
                        const SizedBox(width: 10),
                      if (max != null || min != null)
                        Flexible(
                          child: Text(
                            'H:${formatTemp(max, units)} L:${formatTemp(min, units)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  height: _metricPillHeight,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _MetricPill(
                        icon: Icons.water_drop_rounded,
                        label: 'Humidity',
                        value: formatPercent(humidity),
                      ),
                      const SizedBox(width: 8),
                      _MetricPill(
                        icon: Icons.air_rounded,
                        label: 'Wind',
                        value: formatWind(windSpeed, units),
                      ),
                      const SizedBox(width: 8),
                      _MetricPill(
                        icon: Icons.remove_red_eye_rounded,
                        label: 'Visibility',
                        value: formatVisibility(visibility, units),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricPill extends StatelessWidget {
  const _MetricPill({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 15, color: Colors.white.withValues(alpha: 0.7)),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label.toUpperCase(),
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0, // Removed letter spacing
                  color: Colors.white.withValues(alpha: 0.5),
                ),
              ),
              const SizedBox(height: 1),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}