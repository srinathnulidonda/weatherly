// lib/components/home/air_quality.dart
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/weather_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/color_tokens.dart';
import '../../utils/formatters.dart';
import '../ui/card.dart';

class AirQuality extends StatelessWidget {
  const AirQuality({super.key});

  String _shortLabel(String label) {
    if (label.length <= 14) return label;
    if (label.contains('Sensitive')) return 'Sensitive';
    if (label.contains('Very')) return 'Very Unhealthy';
    if (label.contains('Hazardous')) return 'Hazardous';
    return label;
  }

  @override
  Widget build(BuildContext context) {
    final data = context
        .select<WeatherProvider, Map<String, dynamic>?>((p) => p.airQuality);
    if (data == null) return const SizedBox.shrink();
    final aqi = (data['aqi'] as num?)?.toDouble();
    final info = getAqiToken(aqi);
    final dominant = data['dominant_pollutant']?.toString();

    final pollutants = <(String, PollutantInfo, double, bool)>[];
    pollutantTokens.forEach((key, token) {
      final value = (data[key] as num?)?.toDouble();
      if (value != null) {
        pollutants.add((key, token, value, value > token.safe));
      }
    });

    final gaugeAngle =
        aqi == null ? 0.0 : (aqi / 300 * 180).clamp(0, 180).toDouble();
    final dark = Theme.of(context).brightness == Brightness.dark;

    final rows = <Widget>[];
    for (var i = 0; i < pollutants.length; i += 3) {
      final slice = pollutants.skip(i).take(3).toList();
      while (slice.length < 3) {
        slice.add((
          '',
          const PollutantInfo(label: '', unit: '', safe: 0),
          0,
          false,
        ));
      }
      rows.add(Padding(
        padding: EdgeInsets.only(bottom: i < pollutants.length - 3 ? 6 : 0),
        child: SizedBox(
          height: 62,
          child: Row(
            children: slice.map((p) {
              if (p.$1.isEmpty) {
                return const Expanded(child: SizedBox());
              }
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: _PollutantTile(pollutant: p, dark: dark),
                ),
              );
            }).toList(),
          ),
        ),
      ));
    }

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CardTitle('Air Quality'),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(
                width: 96,
                height: 56,
                child: CustomPaint(
                  painter: _AqiGaugePainter(
                    angle: gaugeAngle,
                    needleColor: info.color,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          aqi?.round().toString() ?? '--',
                          style: TextStyle(
                            fontSize: 26,
                            height: 1,
                            fontWeight: FontWeight.w800,
                            color: info.color,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: info.color.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              _shortLabel(info.label),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: info.color,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (dominant != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        'Dominant: ${pollutantTokens[dominant]?.label ?? dominant}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: info.color,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (pollutants.isNotEmpty) ...[
            const SizedBox(height: 14),
            ...rows,
          ],
        ],
      ),
    );
  }
}

class _PollutantTile extends StatelessWidget {
  const _PollutantTile({required this.pollutant, required this.dark});

  final (String, PollutantInfo, double, bool) pollutant;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final isOver = pollutant.$4;
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: isOver ? const Color(0x1AEF4444) : const Color(0x08F5F5F4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isOver ? const Color(0x33EF4444) : const Color(0x14A8A29E),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  pollutant.$2.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.stone500,
                  ),
                ),
              ),
              if (isOver)
                const Icon(
                  Icons.warning_amber_rounded,
                  size: 10,
                  color: Color(0xFFEF4444),
                ),
            ],
          ),
          const Spacer(),
          Text(
            pollutant.$3.toStringAsFixed(1),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: isOver ? const Color(0xFFDC2626) : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _AqiGaugePainter extends CustomPainter {
  _AqiGaugePainter({required this.angle, required this.needleColor});
  final double angle;
  final Color needleColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height - 6);
    final radius = size.width / 2 - 6;

    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7
      ..strokeCap = StrokeCap.round
      ..color = const Color(0x14A8A29E);

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi,
      pi,
      false,
      track,
    );

    final active = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7
      ..strokeCap = StrokeCap.round
      ..shader = const LinearGradient(
        colors: [
          Color(0xFF22C55E),
          Color(0xFFF59E0B),
          Color(0xFFF97316),
          Color(0xFFEF4444),
          Color(0xFFA855F7),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi,
      pi * (angle / 180),
      false,
      active,
    );

    final u = (angle / 180).clamp(0.0, 1.0);
    final markerAngle = pi + pi * u;
    final markerX = center.dx + radius * cos(markerAngle);
    final markerY = center.dy + radius * sin(markerAngle);
    canvas.drawCircle(
      Offset(markerX, markerY),
      4,
      Paint()..color = needleColor,
    );
    canvas.drawCircle(
      Offset(center.dx, center.dy),
      6,
      Paint()..color = needleColor,
    );
  }

  @override
  bool shouldRepaint(_AqiGaugePainter old) =>
      old.angle != angle || old.needleColor != needleColor;
}