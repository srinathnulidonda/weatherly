// lib/components/alerts/alert_radius_map.dart
import 'dart:math';

import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../theme/color_tokens.dart';

const int _maxAlertsToProcess = 12;
const int _maxAlertsToDisplay = 8;
const double _mapContainerSize = 280.0;
const double _mapCenter = 50.0;
const double _mapRadius = 42.0;
const double _unplacedTextFontSize = 11.0;
const List<double> _radarRingRadii = [14.0, 28.0, 42.0];
const double _radarRingStrokeWidth = 1.0;
const double _outerRingStrokeWidth = 1.5;
const double _outerRingAlpha = 0.3;
const double _centerCircleRadius = 5.0;
const double _innerStrokeCircleRadius = 9.0;
const double _innerStrokeCircleWidth = 1.5;
const double _innerStrokeCircleAlpha = 0.4;
const double _pointCircleRadius = 6.0;
const double _pointStrokeCircleRadius = 10.0;
const double _pointStrokeCircleWidth = 1.0;
const double _pointStrokeCircleAlpha = 0.3;

class AlertRadiusMap extends StatelessWidget {
  const AlertRadiusMap({
    super.key,
    required this.alerts,
    required this.radiusKm,
    required this.userLat,
    required this.userLon,
  });

  final List<Map<String, dynamic>> alerts;
  final double radiusKm;
  final double? userLat;
  final double? userLon;

  @override
  Widget build(BuildContext context) {
    if (userLat == null || userLon == null) return const SizedBox.shrink();

    final points = <(double, double, Color)>[];
    var unplaced = 0;
    for (final a in alerts.take(_maxAlertsToProcess)) {
      final lat = a['latitude'] ?? a['lat'];
      final lon = a['longitude'] ?? a['lon'];
      if (lat is! num || lon is! num) {
        unplaced++;
        continue;
      }
      final info =
          _bearingDistance(userLat!, userLon!, lat.toDouble(), lon.toDouble());
      final ratio = (info.$2 / radiusKm).clamp(0, 1).toDouble();
      final rad = (info.$1 - 90) * pi / 180;
      final x = _mapCenter + cos(rad) * ratio * _mapRadius;
      final y = _mapCenter + sin(rad) * ratio * _mapRadius;
      points.add((x, y, getSeverityToken(a['severity']?.toString()).color));
      if (points.length >= _maxAlertsToDisplay) break;
    }

    return Column(
      children: [
        SizedBox(
          width: _mapContainerSize,
          height: _mapContainerSize,
          child: CustomPaint(painter: _RadarPainter(points: points)),
        ),
        if (unplaced > 0) ...[
          const SizedBox(height: 8),
          Text(
            '$unplaced alert${unplaced != 1 ? 's' : ''} without precise location data not shown on radar',
            style: TextStyle(fontSize: _unplacedTextFontSize, color: AppColors.stone500),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }

  (double, double) _bearingDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    final dLon = (lon2 - lon1) * pi / 180;
    final y = sin(dLon) * cos(lat2 * pi / 180);
    final x = cos(lat1 * pi / 180) * sin(lat2 * pi / 180) -
        sin(lat1 * pi / 180) * cos(lat2 * pi / 180) * cos(dLon);
    final bearing = (atan2(y, x) * 180 / pi + 360) % 360;
    final dLat = (lat2 - lat1) * pi / 180;
    final a = pow(sin(dLat / 2), 2) +
        cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * pow(sin(dLon / 2), 2);
    final distanceKm = 6371 * 2 * atan2(sqrt(a), sqrt(1 - a));
    return (bearing, distanceKm);
  }
}

class _RadarPainter extends CustomPainter {
  _RadarPainter({required this.points});

  final List<(double, double, Color)> points;

  @override
  void paint(Canvas canvas, Size size) {
    final sx = size.width / 100;
    final sy = size.height / 100;

    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = _radarRingStrokeWidth
      ..color = const Color(0x1AA8A29E);
    for (final r in _radarRingRadii) {
      canvas.drawCircle(Offset(_mapCenter * sx, _mapCenter * sy), r * sx, ringPaint);
    }
    canvas.drawCircle(
      Offset(_mapCenter * sx, _mapCenter * sy),
      _mapRadius * sx,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = _outerRingStrokeWidth
        ..color = AppColors.brand500.withValues(alpha: _outerRingAlpha),
    );

    final sevPaint = Paint()..color = AppColors.brand500;
    canvas.drawCircle(Offset(_mapCenter * sx, _mapCenter * sy), _centerCircleRadius, sevPaint);
    canvas.drawCircle(
      Offset(_mapCenter * sx, _mapCenter * sy),
      _innerStrokeCircleRadius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = _innerStrokeCircleWidth
        ..color = AppColors.brand500.withValues(alpha: _innerStrokeCircleAlpha),
    );

    for (final p in points) {
      final o = Offset(p.$1 * sx, p.$2 * sy);
      canvas.drawCircle(o, _pointCircleRadius, Paint()..color = p.$3);
      canvas.drawCircle(
        o,
        _pointStrokeCircleRadius,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = _pointStrokeCircleWidth
          ..color = p.$3.withValues(alpha: _pointStrokeCircleAlpha),
      );
    }
  }

  @override
  bool shouldRepaint(_RadarPainter old) {
    if (old.points.length != points.length) return true;
    for (var i = 0; i < points.length; i++) {
      if (old.points[i] != points[i]) return true;
    }
    return false;
  }
}