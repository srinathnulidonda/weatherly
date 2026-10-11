// lib/components/background/dynamic_sky.dart
import 'dart:math';
import 'package:flutter/material.dart';
import '../../theme/sky_theme.dart';
import '../../utils/weather_condition.dart';

class DynamicSky extends StatefulWidget {
  const DynamicSky({
    super.key,
    required this.condition,
    required this.isDay,
    this.sunrise,
    this.sunset,
    this.moonPhase,
  });

  final dynamic condition;
  final bool isDay;
  final DateTime? sunrise;
  final DateTime? sunset;
  final String? moonPhase;

  @override
  State<DynamicSky> createState() => _DynamicSkyState();
}

class _DynamicSkyState extends State<DynamicSky>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final category = resolveConditionCategory(widget.condition);
    final solar = computeSolarState(
      sunrise: widget.sunrise,
      sunset: widget.sunset,
    );
    final gradient = buildSkyGradient(category, solar.from, solar.to, solar.t);
    final glow = getSkyGlow(category, solar.from, solar.to, solar.t);
    final variant = getParticleVariant(category, widget.isDay);

    return Stack(
      fit: StackFit.expand,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 1200),
          decoration: BoxDecoration(gradient: gradient),
        ),
        if (!widget.isDay && variant == 'stars-moon')
          _NightSky(
            controller: _controller,
            isDay: widget.isDay,
          ),
        if (variant.startsWith('clouds'))
          _CloudLayer(
            controller: _controller,
            isDay: widget.isDay,
          ),
        if (variant.startsWith('rain'))
          _RainLayer(
            controller: _controller,
            isDay: widget.isDay,
            intensity: variant.contains('heavy')
                ? 'heavy'
                : (variant.contains('light') ? 'light' : 'medium'),
          ),
        if (variant == 'snow')
          _SnowLayer(
            controller: _controller,
          ),
        if (variant == 'fog')
          _FogLayer(
            controller: _controller,
          ),
        if (variant == 'storm')
          _StormLayer(
            controller: _controller,
          ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.transparent,
                  Colors.black12,
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _NightSky extends StatelessWidget {
  const _NightSky({
    required this.controller,
    required this.isDay,
  });

  final AnimationController controller;
  final bool isDay;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => CustomPaint(
        size: Size.infinite,
        painter: _StarsPainter(controller.value),
      ),
    );
  }
}

class _CloudLayer extends StatelessWidget {
  const _CloudLayer({
    required this.controller,
    required this.isDay,
  });

  final AnimationController controller;
  final bool isDay;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => CustomPaint(
        size: Size.infinite,
        painter: _CloudPainter(controller.value, isDay),
      ),
    );
  }
}

class _RainLayer extends StatelessWidget {
  const _RainLayer({
    required this.controller,
    required this.isDay,
    required this.intensity,
  });

  final AnimationController controller;
  final bool isDay;
  final String intensity;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => CustomPaint(
        size: Size.infinite,
        painter: _RainPainter(
          controller.value,
          intensity,
        ),
      ),
    );
  }
}

class _SnowLayer extends StatelessWidget {
  const _SnowLayer({
    required this.controller,
  });

  final AnimationController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => CustomPaint(
        size: Size.infinite,
        painter: _SnowPainter(controller.value),
      ),
    );
  }
}

class _FogLayer extends StatelessWidget {
  const _FogLayer({
    required this.controller,
  });

  final AnimationController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => CustomPaint(
        size: Size.infinite,
        painter: _FogPainter(controller.value),
      ),
    );
  }
}

class _StormLayer extends StatelessWidget {
  const _StormLayer({
    required this.controller,
  });

  final AnimationController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => CustomPaint(
        size: Size.infinite,
        painter: _RainPainter(
          controller.value,
          'heavy',
          showLightning: false,
        ),
      ),
    );
  }
}

class _StarsPainter extends CustomPainter {
  _StarsPainter(this.t);
  final double t;

  static final List<_Star> _stars = (_createStars());

  static List<_Star> _createStars() {
    final List<_Star> stars = [];
    final random = Random(42);
    for (int i = 0; i < 30; i++) {
      stars.add(_Star(
        random.nextDouble(),
        random.nextDouble() * 0.7,
        0.5 + random.nextDouble() * 1.0,
        random.nextDouble() * 6.28,
      ));
    }
    return stars;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    for (final star in _stars) {
      final x = star.nx * size.width;
      final y = star.ny * size.height;
      final alpha = 0.3 + 0.4 * (0.5 + 0.5 * sin(t * 6.28 + star.phase));
      paint.color = Colors.white.withValues(alpha: alpha);
      canvas.drawCircle(Offset(x, y), star.r, paint);
    }
  }

  @override
  bool shouldRepaint(_StarsPainter old) => old.t != t;
}

class _Star {
  const _Star(this.nx, this.ny, this.r, this.phase);
  final double nx;
  final double ny;
  final double r;
  final double phase;
}

class _CloudSpec {
  const _CloudSpec(this.yNorm, this.width, this.speed, this.offset);
  final double yNorm;
  final double width;
  final double speed;
  final double offset;
}

class _CloudPainter extends CustomPainter {
  _CloudPainter(this.t, this.isDay);
  final double t;
  final bool isDay;

  static final List<_CloudSpec> _clouds = (_createClouds());

  static List<_CloudSpec> _createClouds() {
    final List<_CloudSpec> clouds = [];
    final random = Random(7);
    for (int i = 0; i < 5; i++) {
      clouds.add(_CloudSpec(
        0.1 + random.nextDouble() * 0.4,
        60.0 + random.nextDouble() * 80.0,
        0.1 + random.nextDouble() * 0.2,
        random.nextDouble(),
      ));
    }
    return clouds;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final baseColor = isDay ? Colors.white : Colors.grey.shade600;
    final paint = Paint()..color = baseColor;
    for (final cloud in _clouds) {
      final y = cloud.yNorm * size.height;
      final x = ((t * cloud.speed + cloud.offset) % 1.3 - 0.15) * size.width;
      _drawCloud(canvas, paint, Offset(x, y), cloud.width);
    }
  }

  void _drawCloud(Canvas canvas, Paint paint, Offset offset, double width) {
    final height = width * 0.35;
    canvas.drawOval(Rect.fromLTWH(offset.dx, offset.dy, width, height), paint);
    canvas.drawOval(
      Rect.fromLTWH(
        offset.dx + width * 0.15,
        offset.dy - height * 0.4,
        width * 0.5,
        height * 0.6,
      ),
      paint,
    );
    canvas.drawOval(
      Rect.fromLTWH(
        offset.dx + width * 0.4,
        offset.dy - height * 0.2,
        width * 0.4,
        height * 0.4,
      ),
      paint,
    );
  }

  @override
  bool shouldRepaint(_CloudPainter old) =>
      old.t != t || old.isDay != isDay;
}

class _RainPainter extends CustomPainter {
  _RainPainter(this.t, this.intensity, {this.showLightning = false});
  final double t;
  final String intensity;
  final bool showLightning;

  static final Map<int, List<_RainSpec>> _rainSpecs = {};

  static List<_RainSpec> _rainFor(int count) {
    return _rainSpecs.putIfAbsent(count, () {
      final List<_RainSpec> specs = [];
      final random = Random(11);
      for (int i = 0; i < count; i++) {
        specs.add(_RainSpec(
          random.nextDouble(),
          random.nextDouble(),
          1.4 + random.nextDouble(),
        ));
      }
      return specs;
    });
  }

  @override
  void paint(Canvas canvas, Size size) {
    final count =
        intensity == 'heavy' ? 50 : (intensity == 'light' ? 20 : 35);
    final height =
        intensity == 'heavy' ? 25.0 : (intensity == 'light' ? 12.0 : 18.0);
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.5)
      ..strokeWidth = 1.2;
    for (final drop in _rainFor(count)) {
      final x = drop.nx * size.width;
      final y = ((drop.phase + t * drop.speed) % 1.0) * size.height - 20;
      canvas.drawLine(
        Offset(x, y),
        Offset(x - 2, y + height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_RainPainter old) => old.t != t;
}

class _RainSpec {
  const _RainSpec(this.nx, this.phase, this.speed);
  final double nx;
  final double phase;
  final double speed;
}

class _SnowPainter extends CustomPainter {
  _SnowPainter(this.t);
  final double t;

  static final List<_SnowSpec> _snowflakes = (_createSnowflakes());

  static List<_SnowSpec> _createSnowflakes() {
    final List<_SnowSpec> flakes = [];
    final random = Random(5);
    for (int i = 0; i < 25; i++) {
      flakes.add(_SnowSpec(
        random.nextDouble(),
        random.nextDouble(),
        1.2 + random.nextDouble() * 1.5,
        0.4 + random.nextDouble() * 0.4,
        i.toDouble(),
      ));
    }
    return flakes;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white.withValues(alpha: 0.7);
    for (final flake in _snowflakes) {
      final rawX = (flake.nx + sin(t * 6.28 + flake.swayPhase) * 0.02) % 1.0;
      final x = rawX * size.width;
      final y = ((flake.phase + t * flake.fallSpeed) % 1.0) * size.height;
      canvas.drawCircle(Offset(x, y), flake.r, paint);
    }
  }

  @override
  bool shouldRepaint(_SnowPainter old) => old.t != t;
}

class _SnowSpec {
  const _SnowSpec(this.nx, this.phase, this.r, this.fallSpeed, this.swayPhase);
  final double nx;
  final double phase;
  final double r;
  final double fallSpeed;
  final double swayPhase;
}

class _FogPainter extends CustomPainter {
  _FogPainter(this.t);
  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white.withValues(alpha: 0.15);
    for (var i = 0; i < 3; i++) {
      final y = size.height * (0.15 + i * 0.18);
      final dx = sin(t * 6.28 + i) * 15.0;
      canvas.drawRect(Rect.fromLTWH(dx, y, size.width, 40.0), paint);
    }
  }

  @override
  bool shouldRepaint(_FogPainter old) => old.t != t;
}