// lib/components/home/sun_times.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/weather_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/sky_theme.dart';
import '../../utils/formatters.dart';
import '../ui/card.dart';

class SunTimes extends StatelessWidget {
  const SunTimes({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<WeatherProvider>().current;
    if (data == null) return const SizedBox.shrink();
    final astro = data['astronomy'];
    if (astro is! Map) return const SizedBox.shrink();
    final sunrise = astro['sunrise'];
    final sunset = astro['sunset'];
    final dayLength = (astro['day_length_hours'] as num?)?.toDouble();
    final moonPhase = astro['moon_phase_name']?.toString();
    if (sunrise == null && sunset == null) return const SizedBox.shrink();

    final dark = Theme.of(context).brightness == Brightness.dark;
    final sr = DateTime.tryParse(sunrise?.toString() ?? '');
    final ss = DateTime.tryParse(sunset?.toString() ?? '');
    final now = DateTime.now();
    double progress = 0;
    bool isDaytime = false;
    if (sr != null && ss != null && ss.isAfter(sr)) {
      if (now.isBefore(sr)) {
        progress = 0;
      } else if (now.isAfter(ss)) {
        progress = 1;
      } else {
        progress = now.difference(sr).inMinutes / ss.difference(sr).inMinutes;
        isDaytime = true;
      }
    }
    final moon =
        moonPhase != null ? getMoonIllumination(moonPhase) : null;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(child: CardTitle('Sun & Moon')),
              if (isDaytime)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0x1AF59E0B),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.wb_sunny_rounded,
                        size: 11,
                        color: Color(0xFFD97706),
                      ),
                      SizedBox(width: 4),
                      Text(
                        'Day',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFD97706),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 90,
            child: CustomPaint(
              painter: _SunArcPainter(progress: progress, isDaytime: isDaytime),
              size: const Size(double.infinity, 90),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _SunTile(
                  icon: Icons.wb_twilight_rounded,
                  label: 'Sunrise',
                  value: formatTime(sunrise),
                  color: const Color(0xFFF59E0B),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _SunTile(
                  icon: Icons.wb_twilight_rounded,
                  label: 'Sunset',
                  value: formatTime(sunset),
                  color: AppColors.brand500,
                ),
              ),
            ],
          ),
          if (dayLength != null || moonPhase != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                if (dayLength != null)
                  Expanded(
                    child: _SunTile(
                      icon: Icons.schedule_rounded,
                      label: 'Daylight',
                      value: '${dayLength.toStringAsFixed(1)}h',
                      color: AppColors.stone400,
                    ),
                  ),
                if (dayLength != null && moonPhase != null)
                  const SizedBox(width: 8),
                if (moonPhase != null)
                  Expanded(
                    child: _SunTile(
                      icon: moon != null && moon.waxing
                          ? Icons.brightness_2_rounded
                          : Icons.brightness_3_rounded,
                      label: 'Moon Phase',
                      value: moonPhase.replaceAll('_', ' '),
                      color: const Color(0xFF6366F1),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _SunTile extends StatelessWidget {
  const _SunTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: dark ? const Color(0x08FFFFFF) : const Color(0x99F5F5F4),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0,
                    color: AppColors.stone500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: dark ? AppColors.stone200 : AppColors.stone800,
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

class _SunArcPainter extends CustomPainter {
  _SunArcPainter({required this.progress, required this.isDaytime});
  final double progress;
  final bool isDaytime;

  @override
  void paint(Canvas canvas, Size size) {
    const left = 12.0;
    final right = size.width - 12;
    final baselineY = size.height - 8;

    final arcPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = const Color(0x33A8A29E);
    final path = Path()
      ..moveTo(left, baselineY)
      ..quadraticBezierTo(size.width / 2, 6, right, baselineY);
    canvas.drawPath(path, arcPaint);

    if (isDaytime) {
      final metric = path.computeMetrics().first;
      final activePath = metric.extractPath(
        0,
        metric.length * progress.clamp(0, 1),
      );
      final activePaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round
        ..color = const Color(0xFFFB923C);
      canvas.drawPath(activePath, activePaint);
    }

    final t = progress.clamp(0.0, 1.0);
    final x = (1 - t) * (1 - t) * left +
        2 * (1 - t) * t * (size.width / 2) +
        t * t * right;
    final y =
        (1 - t) * (1 - t) * baselineY + 2 * (1 - t) * t * 6 + t * t * baselineY;

    canvas.drawCircle(
      Offset(left, baselineY),
      3,
      Paint()..color = const Color(0xFFF59E0B),
    );
    canvas.drawCircle(
      Offset(right, baselineY),
      3,
      Paint()..color = AppColors.brand500,
    );

    if (isDaytime) {
      canvas.drawCircle(
        Offset(x, y),
        7,
        Paint()..color = AppColors.brand500.withValues(alpha: 0.18),
      );
      canvas.drawCircle(Offset(x, y), 4.5, Paint()..color = AppColors.brand500);
      canvas.drawCircle(
        Offset(x, y),
        2.5,
        Paint()..color = const Color(0xFFFDE68A),
      );
    }
  }

  @override
  bool shouldRepaint(_SunArcPainter old) =>
      old.progress != progress || old.isDaytime != isDaytime;
}