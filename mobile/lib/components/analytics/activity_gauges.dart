// lib/components/analytics/activity_gauges.dart
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/analytics_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/color_tokens.dart';
import '../ui/card.dart';

class ActivityGauges extends StatelessWidget {
  const ActivityGauges({super.key});

  static const _activities = <(String, String, IconData)>[
    ('comfort_index', 'Comfort', Icons.sentiment_satisfied_alt_rounded),
    ('outdoor_activity_index', 'Outdoor', Icons.directions_walk_rounded),
    ('running_index', 'Running', Icons.directions_run_rounded),
    ('cycling_index', 'Cycling', Icons.pedal_bike_rounded),
    ('gardening_index', 'Gardening', Icons.park_rounded),
    ('allergy_index', 'Allergy', Icons.local_florist_rounded),
    ('driving_index', 'Driving', Icons.directions_car_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final data = context
        .select<AnalyticsProvider, Map<String, dynamic>?>((p) => p.indices);
    if (data == null) return const SizedBox.shrink();

    final items = <_GaugeItem>[];
    for (final a in _activities) {
      final raw = (data[a.$1] as num?)?.toDouble();
      if (raw == null) continue;
      final scaled = (raw * 10).clamp(0, 100).toDouble();
      items.add(_GaugeItem(a.$2, a.$3, raw, scaled, getGaugeToken(scaled)));
    }
    if (items.isEmpty) return const SizedBox.shrink();
    final dark = Theme.of(context).brightness == Brightness.dark;
    final uvProtection = data['uv_protection_needed'] == true;

    final rows = <Widget>[];
    for (var i = 0; i < items.length; i += 3) {
      final slice = items.skip(i).take(3).toList();
      rows.add(Padding(
        padding: EdgeInsets.only(bottom: i < items.length - 3 ? 8 : 0),
        child: SizedBox(
          height: 130,
          child: Row(
            children: slice.map((it) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: _GaugeTile(item: it, dark: dark),
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
          CardTitle(
            'Activity Indices',
            trailing: uvProtection
                ? const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.wb_sunny_rounded,
                        size: 12,
                        color: Color(0xFFF59E0B),
                      ),
                      SizedBox(width: 4),
                      Text(
                        'UV Protection Needed',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFFF59E0B),
                        ),
                      ),
                    ],
                  )
                : null,
          ),
          const SizedBox(height: 12),
          ...rows,
        ],
      ),
    );
  }
}

class _GaugeItem {
  const _GaugeItem(this.label, this.icon, this.value, this.scaled, this.token);

  final String label;
  final IconData icon;
  final double value;
  final double scaled;
  final GaugeToken token;
}

class _GaugeTile extends StatelessWidget {
  const _GaugeTile({required this.item, required this.dark});

  final _GaugeItem item;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: dark ? const Color(0x08FFFFFF) : const Color(0x99F5F5F4),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 56,
            height: 56,
            child: CustomPaint(
              painter: _GaugePainter(
                value: item.scaled,
                color: item.token.color,
                dark: dark,
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(item.icon, size: 12, color: item.token.color),
                    Text(
                      item.value.round().toString(),
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: dark ? AppColors.stone100 : AppColors.stone900,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            item.label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: dark ? AppColors.stone300 : AppColors.stone700,
            ),
          ),
          Text(
            item.token.label,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: item.token.color,
            ),
          ),
        ],
      ),
    );
  }
}

class _GaugePainter extends CustomPainter {
  _GaugePainter({
    required this.value,
    required this.color,
    required this.dark,
  });

  final double value;
  final Color color;
  final bool dark;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2 - 4;
    final trackPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..color = dark ? const Color(0x14FFFFFF) : const Color(0x33E5E7EB);
    canvas.drawCircle(center, r, trackPaint);

    final active = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round
      ..color = color;
    final sweep = (value / 100).clamp(0, 1) * 2 * pi;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: r),
      -pi / 2,
      sweep,
      false,
      active,
    );
  }

  @override
  bool shouldRepaint(_GaugePainter old) =>
      old.value != value || old.color != color || old.dark != dark;
}