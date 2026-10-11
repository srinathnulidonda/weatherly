// lib/components/ui/weather_icon.dart
import 'package:flutter/material.dart';

import '../../utils/weather_condition.dart';

enum WeatherIconSize { xs, sm, md, lg, xl, xxl, xxxl, hero }

class WeatherIcon extends StatelessWidget {
  const WeatherIcon({
    super.key,
    required this.condition,
    this.size = WeatherIconSize.md,
    this.glow = false,
    this.isNight,
  });

  final dynamic condition;
  final WeatherIconSize size;
  final bool glow;
  final bool? isNight;

  static const Map<String, (IconData, IconData, Color, Color, String)> _map = {
    ConditionCategory.clear: (
      Icons.wb_sunny_rounded,
      Icons.nightlight_round,
      Color(0xFFFDA929),
      Color(0xFFC9CEDB),
      'Clear sky',
    ),
    ConditionCategory.partlyCloudy: (
      Icons.wb_cloudy_rounded,
      Icons.nights_stay_rounded,
      Color(0xFFFDA929),
      Color(0xFFC9CEDB),
      'Partly cloudy',
    ),
    ConditionCategory.cloudy: (
      Icons.cloud_rounded,
      Icons.cloud_rounded,
      Color(0xFF9AA5B1),
      Color(0xFF6B7280),
      'Cloudy',
    ),
    ConditionCategory.fog: (
      Icons.foggy,
      Icons.foggy,
      Color(0xFFB7C1CA),
      Color(0xFF7C8894),
      'Foggy',
    ),
    ConditionCategory.drizzle: (
      Icons.grain_rounded,
      Icons.grain_rounded,
      Color(0xFF5B9BD5),
      Color(0xFF4A7FAE),
      'Light drizzle',
    ),
    ConditionCategory.rain: (
      Icons.water_drop_rounded,
      Icons.water_drop_rounded,
      Color(0xFF4E80B0),
      Color(0xFF3D6690),
      'Rain',
    ),
    ConditionCategory.heavyRain: (
      Icons.water_rounded,
      Icons.water_rounded,
      Color(0xFF3A6494),
      Color(0xFF2C4F76),
      'Heavy rain',
    ),
    ConditionCategory.snow: (
      Icons.ac_unit_rounded,
      Icons.ac_unit_rounded,
      Color(0xFF9BB3C8),
      Color(0xFF7E93A6),
      'Snow',
    ),
    ConditionCategory.thunderstorm: (
      Icons.thunderstorm_rounded,
      Icons.thunderstorm_rounded,
      Color(0xFFF4C542),
      Color(0xFFE0B430),
      'Thunderstorm',
    ),
    ConditionCategory.wind: (
      Icons.air_rounded,
      Icons.air_rounded,
      Color(0xFF4FB0BE),
      Color(0xFF3D8E9A),
      'Windy',
    ),
    ConditionCategory.haze: (
      Icons.blur_on_rounded,
      Icons.blur_on_rounded,
      Color(0xFFC3B389),
      Color(0xFFA0906A),
      'Hazy',
    ),
  };

  double get _px {
    switch (size) {
      case WeatherIconSize.xs:
        return 16;
      case WeatherIconSize.sm:
        return 20;
      case WeatherIconSize.md:
        return 28;
      case WeatherIconSize.lg:
        return 40;
      case WeatherIconSize.xl:
        return 56;
      case WeatherIconSize.xxl:
        return 72;
      case WeatherIconSize.xxxl:
        return 88;
      case WeatherIconSize.hero:
        return 112;
    }
  }

  @override
  Widget build(BuildContext context) {
    final category = resolveConditionCategory(condition);
    final night = isNight ?? isNightCondition(condition);
    final entry = _map[category] ?? _map[ConditionCategory.cloudy]!;
    final icon = night ? entry.$2 : entry.$1;
    final color = night ? entry.$4 : entry.$3;
    final px = _px;

    Widget widget = SizedBox(
      width: px,
      height: px,
      child: Icon(icon, size: px, color: color),
    );

    if (glow) {
      widget = Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(color: color.withValues(alpha: 0.35), blurRadius: 14),
          ],
        ),
        child: widget,
      );
    }

    return Semantics(label: entry.$5, child: widget);
  }
}