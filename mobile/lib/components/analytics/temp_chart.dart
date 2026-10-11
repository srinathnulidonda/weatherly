// lib/components/analytics/temp_chart.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../theme/color_tokens.dart';
import '../../utils/formatters.dart';
import '../ui/card.dart';

class TempChart extends StatelessWidget {
  const TempChart({
    super.key,
    required this.dataPoints,
    required this.periodHours,
    required this.units,
  });

  final List<Map<String, dynamic>> dataPoints;
  final int periodHours;
  final String units;

  @override
  Widget build(BuildContext context) {
    if (dataPoints.isEmpty) return const SizedBox.shrink();
    final temps = dataPoints
        .map((p) => convertTemp((p['temperature_c'] as num?)?.toDouble(), units))
        .toList();
    final minT = temps.reduce((a, b) => a < b ? a : b);
    final maxT = temps.reduce((a, b) => a > b ? a : b);
    final avg = temps.reduce((a, b) => a + b) / temps.length;
    final dark = Theme.of(context).brightness == Brightness.dark;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CardTitle(
            'Temperature Trend — ${periodHours}h',
            trailing: Text(
              'Avg: ${avg.round()}°',
              style: const TextStyle(fontSize: 11, color: AppColors.stone400),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: CustomPaint(
              painter: _TempChartPainter(
                temps: temps,
                minT: minT,
                maxT: maxT,
                avg: avg,
                dark: dark,
              ),
              size: Size.infinite,
            ),
          ),
        ],
      ),
    );
  }
}

class _TempChartPainter extends CustomPainter {
  _TempChartPainter({
    required this.temps,
    required this.minT,
    required this.maxT,
    required this.avg,
    required this.dark,
  });

  final List<double> temps;
  final double minT;
  final double maxT;
  final double avg;
  final bool dark;

  @override
  void paint(Canvas canvas, Size size) {
    if (temps.length < 2) return;
    const leftPad = 12.0;
    const rightPad = 12.0;
    const topPad = 12.0;
    const bottomPad = 24.0;

    final w = size.width - leftPad - rightPad;
    final h = size.height - topPad - bottomPad;
    final range = (maxT - minT).clamp(1.0, double.infinity);

    final points = temps.asMap().entries.map((e) {
      final x = leftPad + (e.key / (temps.length - 1)) * w;
      final y = topPad + (1 - (e.value - minT) / range) * h;
      return Offset(x, y);
    }).toList();

    final gridPaint = Paint()
      ..color = (dark ? gridDark : gridLight)
      ..strokeWidth = 1;
    for (var i = 0; i < 4; i++) {
      final y = topPad + (h / 3) * i;
      canvas.drawLine(
        Offset(leftPad, y),
        Offset(size.width - rightPad, y),
        gridPaint,
      );
    }

    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (var i = 1; i < points.length; i++) {
      path.lineTo(points[i].dx, points[i].dy);
    }

    final fillPath = Path.from(path)
      ..lineTo(points.last.dx, topPad + h)
      ..lineTo(points.first.dx, topPad + h)
      ..close();

    final fillPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [chartFillFrom, chartFillTo],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawPath(fillPath, fillPaint);

    final linePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..color = chartLine;

    canvas.drawPath(path, linePaint);

    final avgY = topPad + (1 - (avg - minT) / range) * h;
    final avgPaint = Paint()
      ..color = const Color(0x4DF97316)
      ..strokeWidth = 1;
    _drawDashedLine(
      canvas,
      Offset(leftPad, avgY),
      Offset(size.width - rightPad, avgY),
      avgPaint,
    );
  }

  void _drawDashedLine(Canvas canvas, Offset a, Offset b, Paint paint) {
    const dash = 4.0;
    const gap = 4.0;
    final total = (b - a).distance;
    if (total <= 0) return;
    final dir = (b - a) / total;
    var d = 0.0;
    while (d < total) {
      final start = a + dir * d;
      final end = a + dir * (d + dash).clamp(0.0, total);
      canvas.drawLine(start, end, paint);
      d += dash + gap;
    }
  }

  @override
  bool shouldRepaint(_TempChartPainter old) =>
      old.temps != temps || old.dark != dark;
}