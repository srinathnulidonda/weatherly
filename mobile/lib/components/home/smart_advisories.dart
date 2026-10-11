// lib/components/home/smart_advisories.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/weather_provider.dart';
import '../../stores/app_store.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../utils/weather_condition.dart';

const double _coldExtremeThreshold = -10.0;
const double _heatThreshold = 35.0;
const int _aqiBadThreshold = 150;
const int _hoursToCheckForRain = 6;
const int _skipCurrentHour = 1;
const double _rainChanceThreshold = 0.5; // 50%
const double _fogVisibilityReduced = 1.0; // fog condition
const double _windSpeedThreshold = 12.0; // m/s
const double _windGustDifferenceThreshold = 8.0; // m/s
const int _aqiModerateLower = 100;
const int _aqiModerateUpper = 150;
const double _uvIndexThreshold = 6.0;
const double _uvIndexVeryHigh = 8.0;
const double _coldTemperatureMax = 2.0;
const double _coldTemperatureMin = -10.0;
const double _feelsLikeDifferenceThreshold = 5.0;
const double _clearGoodTemperatureMin = 15.0;
const double _clearGoodTemperatureMax = 28.0;
const double _advisoryBottomPadding = 8.0;
const double _advisoryHorizontalPadding = 14.0;
const double _advisoryVerticalPadding = 12.0;
const double _advisoryBorderRadius = 20.0;
const double _advisoryBorderAlpha = 0.2;
const double _advisoryIconSize = 16.0;
const double _advisoryFontSize = 13.0;
const double _advisoryLineHeight = 1.35;

class _Advisory {
  const _Advisory({
    required this.id,
    required this.icon,
    required this.tone,
    required this.message,
  });
  final String id;
  final IconData icon;
  final String tone;
  final String message;
}

class _Tone {
  const _Tone(this.background, this.foreground);
  final Color background;
  final Color foreground;
}

const Map<String, _Tone> _tones = {
  'info': _Tone(Color(0x1AF97316), Color(0xFFEA580C)),
  'caution': _Tone(Color(0x1AF59E0B), Color(0xFFD97706)),
  'warning': _Tone(Color(0x1AEF4444), Color(0xFFDC2626)),
  'positive': _Tone(Color(0x1A22C55E), Color(0xFF16A34A)),
};

class _AdvisoryContext {
  const _AdvisoryContext({
    required this.current,
    required this.hours,
    required this.air,
    required this.units,
  });

  final Map<String, dynamic> current;
  final List<Map<String, dynamic>> hours;
  final Map<String, dynamic>? air;
  final String units;

  String get category => resolveConditionCategory(current['condition']);
  double? get tempC => (current['temperature_c'] as num?)?.toDouble();
  double? get feelsC => (current['feels_like_c'] as num?)?.toDouble();
  double? get uv => (current['uv_index'] as num?)?.toDouble();
  num? get aqi => air?['aqi'] as num?;
  Map<String, dynamic>? get wind => current['wind'] is Map
      ? (current['wind'] as Map).cast<String, dynamic>()
      : null;
  double? get windSpeed => (wind?['speed_ms'] as num?)?.toDouble();
  double? get gust => (wind?['gust_ms'] as num?)?.toDouble();
}

List<_Advisory> _generate(
  Map<String, dynamic>? current,
  List<Map<String, dynamic>> hours,
  Map<String, dynamic>? air,
  String units,
) {
  if (current == null) return const [];
  final ctx = _AdvisoryContext(
    current: current,
    hours: hours,
    air: air,
    units: units,
  );
  final result = <_Advisory>[];

  if (ctx.category == ConditionCategory.thunderstorm) {
    result.add(const _Advisory(
      id: 'storm',
      icon: Icons.thunderstorm_rounded,
      tone: 'warning',
      message: 'Thunderstorms nearby — move indoors and avoid open areas or tall isolated objects.',
    ));
  }
  if (ctx.tempC != null && ctx.tempC! <= _coldExtremeThreshold) {
    result.add(_Advisory(
      id: 'cold-extreme',
      icon: Icons.ac_unit_rounded,
      tone: 'warning',
      message:
          'Dangerously cold at ${formatTemp(ctx.tempC, ctx.units)} — limit time outdoors and cover exposed skin.',
    ));
  }
  if (ctx.tempC != null && ctx.tempC! >= _heatThreshold) {
    result.add(const _Advisory(
      id: 'heat',
      icon: Icons.local_fire_department_rounded,
      tone: 'warning',
      message: 'Extreme heat today — stay hydrated and avoid direct sun during peak hours.',
    ));
  }
  if (ctx.aqi != null && ctx.aqi! > _aqiBadThreshold) {
    result.add(_Advisory(
      id: 'aqi-bad',
      icon: Icons.shield_rounded,
      tone: 'warning',
      message:
          'Air quality is unhealthy (AQI ${ctx.aqi!.round()}) — avoid prolonged outdoor exertion.',
    ));
  }
  if (ctx.category == ConditionCategory.rain ||
      ctx.category == ConditionCategory.heavyRain ||
      ctx.category == ConditionCategory.drizzle) {
    result.add(const _Advisory(
      id: 'rain-now',
      icon: Icons.umbrella_rounded,
      tone: 'caution',
      message: 'Rain is falling right now — grab an umbrella before heading out.',
    ));
  }
  if (ctx.category == ConditionCategory.snow) {
    result.add(const _Advisory(
      id: 'snow',
      icon: Icons.ac_unit_rounded,
      tone: 'caution',
      message: 'Snow is falling — roads and walkways may be slippery, drive carefully.',
    ));
  }
  if (ctx.category != ConditionCategory.rain &&
      ctx.category != ConditionCategory.heavyRain) {
    final idx = ctx.hours
        .take(_hoursToCheckForRain)
        .skip(_skipCurrentHour)
        .toList()
        .indexWhere((h) => (getPrecipChance(h) ?? 0) >= (_rainChanceThreshold * 100).toInt());
    if (idx != -1) {
      final hoursAway = idx + 1;
      result.add(_Advisory(
        id: 'rain-soon',
        icon: Icons.umbrella_rounded,
        tone: 'caution',
        message:
            'Rain likely within $hoursAway hour${hoursAway > 1 ? 's' : ''} — plan to bring an umbrella.',
      ));
    }
  }
  if (ctx.category == ConditionCategory.fog) {
    result.add(const _Advisory(
      id: 'fog',
      icon: Icons.foggy,
      tone: 'caution',
      message:
          'Foggy conditions are reducing visibility — allow extra time and following distance if driving.',
    ));
  }
  if ((ctx.windSpeed != null && ctx.windSpeed! >= _windSpeedThreshold) ||
      ctx.category == ConditionCategory.wind) {
    final message = ctx.windSpeed != null &&
            ctx.gust != null &&
            ctx.gust! - ctx.windSpeed! >= _windGustDifferenceThreshold
        ? 'Gusty winds up to ${formatWind(ctx.gust, ctx.units)} expected — secure loose outdoor items.'
        : ctx.windSpeed != null
            ? 'Winds around ${formatWind(ctx.windSpeed, ctx.units)} — secure loose objects outdoors.'
            : 'Windy conditions expected — secure loose objects outdoors.';
    result.add(_Advisory(
      id: 'wind',
      icon: Icons.air_rounded,
      tone: 'caution',
      message: message,
    ));
  }
  if (ctx.aqi != null && ctx.aqi! > _aqiModerateLower && ctx.aqi! <= _aqiModerateUpper) {
    result.add(_Advisory(
      id: 'aqi-mod',
      icon: Icons.shield_rounded,
      tone: 'caution',
      message:
          'Air quality is unhealthy for sensitive groups (AQI ${ctx.aqi!.round()}) — limit exertion if you have asthma or heart conditions.',
    ));
  }
  if (ctx.uv != null && ctx.uv! >= _uvIndexThreshold) {
    result.add(_Advisory(
      id: 'uv',
      icon: Icons.wb_sunny_rounded,
      tone: 'caution',
      message: ctx.uv! >= _uvIndexVeryHigh
          ? 'UV index is ${ctx.uv!.round()} (very high) — sunburn can occur in minutes, seek shade and wear SPF 30+.'
          : 'UV index is ${ctx.uv!.round()} — wear sunscreen and sunglasses if you\'re out for long.',
    ));
  }
  if (ctx.tempC != null && ctx.tempC! <= _coldTemperatureMax && ctx.tempC! > _coldTemperatureMin) {
    result.add(_Advisory(
      id: 'cold',
      icon: Icons.thermostat_rounded,
      tone: 'caution',
      message: 'It\'s ${formatTemp(ctx.tempC, ctx.units)} out — bundle up before heading outside.',
    ));
  }
  if (ctx.feelsC != null &&
      ctx.tempC != null &&
      (ctx.feelsC! - ctx.tempC!).abs() >= _feelsLikeDifferenceThreshold) {
    result.add(_Advisory(
      id: 'feels',
      icon: Icons.thermostat_auto_rounded,
      tone: 'info',
      message: ctx.feelsC! < ctx.tempC!
          ? 'Feels like ${formatTemp(ctx.feelsC, ctx.units)} — noticeably colder than actual due to wind.'
          : 'Feels like ${formatTemp(ctx.feelsC, ctx.units)} — warmer than actual due to humidity.',
    ));
  }
  if (result.isEmpty &&
      ctx.category == ConditionCategory.clear &&
      ctx.tempC != null &&
      ctx.tempC! >= _clearGoodTemperatureMin &&
      ctx.tempC! <= _clearGoodTemperatureMax) {
    result.add(const _Advisory(
      id: 'clear-good',
      icon: Icons.auto_awesome_rounded,
      tone: 'positive',
      message: 'Great day to be outside — clear skies and comfortable temperatures.',
    ));
  }
  if (result.isEmpty) {
    result.add(const _Advisory(
      id: 'all-clear',
      icon: Icons.auto_awesome_rounded,
      tone: 'positive',
      message: 'No major weather concerns right now — enjoy your day.',
    ));
  }
  return result;
}

class SmartAdvisories extends StatelessWidget {
  const SmartAdvisories({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WeatherProvider>();
    final units = context.watch<AppStore>().units;
    final advisories = _generate(
      provider.current,
      provider.flatHours,
      provider.airQuality,
      units,
    );
    if (advisories.isEmpty) return const SizedBox.shrink();
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: advisories.map((a) {
        final tone = _tones[a.tone] ?? _tones['info']!;
        return Padding(
          padding: EdgeInsets.only(bottom: _advisoryBottomPadding),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: _advisoryHorizontalPadding, vertical: _advisoryVerticalPadding),
            decoration: BoxDecoration(
              color: tone.background,
              borderRadius: BorderRadius.circular(_advisoryBorderRadius),
              border: Border.all(color: tone.foreground.withValues(alpha: _advisoryBorderAlpha)),
            ),
            child: Row(
              children: [
                Icon(a.icon, size: _advisoryIconSize, color: tone.foreground),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    a.message,
                    style: TextStyle(
                      fontSize: _advisoryFontSize,
                      fontWeight: FontWeight.w500,
                      height: _advisoryLineHeight,
                      color: dark ? AppColors.stone300 : AppColors.stone700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}