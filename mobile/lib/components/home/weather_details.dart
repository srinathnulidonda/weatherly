// lib/components/home/weather_details.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/weather_provider.dart';
import '../../stores/app_store.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../ui/card.dart';

class WeatherDetails extends StatelessWidget {
  const WeatherDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context
        .select<WeatherProvider, Map<String, dynamic>?>((p) => p.current);
    final units = context.select<AppStore, String>((a) => a.units);
    if (data == null) return const SizedBox.shrink();

    final feels = (data['feels_like_c'] as num?)?.toDouble();
    final dew = (data['dew_point_c'] as num?)?.toDouble();
    final humidity = (data['humidity'] as num?)?.toDouble();
    final pressure = (data['pressure_hpa'] as num?)?.toDouble();
    final visibility = (data['visibility_m'] as num?)?.toDouble();
    final uv = (data['uv_index'] as num?)?.toDouble();
    final wind = data['wind'] is Map
        ? (data['wind'] as Map).cast<String, dynamic>()
        : null;
    final precip = data['precipitation'] is Map
        ? (data['precipitation'] as Map).cast<String, dynamic>()
        : null;
    final precipChance = getPrecipChance(data);
    final precipAmount = (precip?['rain_1h_mm'] as num?)?.toDouble() ??
        (precip?['snow_1h_mm'] as num?)?.toDouble() ??
        0;
    final uvInfo = getUvInfo(uv);
    final pressureLabel = pressure == null
        ? null
        : pressure > 1020
            ? 'Above normal'
            : pressure < 1005
                ? 'Below normal'
                : 'Normal';

    final entries = <(IconData, String, String, String?, Color?)>[
      (
        Icons.thermostat_rounded,
        'Feels Like',
        formatTemp(feels, units),
        dew != null ? 'Dew point ${formatTemp(dew, units)}' : null,
        null,
      ),
      (
        Icons.water_drop_rounded,
        'Humidity',
        formatPercent(humidity),
        data['humidity_comfort']?.toString().replaceAll('_', ' '),
        null,
      ),
      (
        Icons.speed_rounded,
        'Pressure',
        formatPressure(pressure, units),
        pressureLabel,
        null,
      ),
      (
        Icons.remove_red_eye_rounded,
        'Visibility',
        formatVisibility(visibility, units),
        null,
        null,
      ),
      (
        Icons.wb_sunny_rounded,
        'UV Index',
        uv?.toString() ?? '--',
        uvInfo.label,
        uv != null ? uvInfo.color : null,
      ),
      (
        Icons.grain_rounded,
        'Precipitation',
        formatPrecipitation(precipAmount, units),
        precipChance != null ? '${precipChance.round()}% chance' : null,
        null,
      ),
    ];

    final dark = Theme.of(context).brightness == Brightness.dark;
    final rows = <Widget>[];
    for (var i = 0; i < entries.length; i += 2) {
      rows.add(Padding(
        padding: EdgeInsets.only(bottom: i < entries.length - 2 ? 12 : 0),
        child: SizedBox(
          height: 110,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: _DetailCard(entry: entries[i], dark: dark)),
              const SizedBox(width: 12),
              Expanded(child: _DetailCard(entry: entries[i + 1], dark: dark)),
            ],
          ),
        ),
      ));
    }

    return RepaintBoundary(
      child: Column(
        children: [
          ...rows,
          if (wind != null) ...[
            const SizedBox(height: 12),
            AppCard(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'WIND',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0, // Removed letter spacing
                            color: AppColors.stone500,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${getWindLabel((wind['direction_deg'] as num?)?.toDouble())}  ${formatWind((wind['speed_ms'] as num?)?.toDouble(), units)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (wind['gust_ms'] != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'Gusts ${formatWind((wind['gust_ms'] as num?)?.toDouble(), units)}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.stone500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.air_rounded,
                    size: 40,
                    color: AppColors.brand500,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.entry, required this.dark});

  final (IconData, String, String, String?, Color?) entry;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      variant: CardVariant.metric,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(entry.$1, size: 13, color: AppColors.stone400),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  entry.$2.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0, // Removed letter spacing
                    color: AppColors.stone500,
                  ),
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                entry.$3,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0, // Removed negative letter spacing
                  color: entry.$5 ??
                      (dark ? AppColors.stone200 : AppColors.stone800),
                ),
              ),
              if (entry.$4 != null) ...[
                const SizedBox(height: 2),
                Text(
                  entry.$4!.replaceAll('_', ' '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.stone500,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}