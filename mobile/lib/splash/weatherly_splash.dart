// lib/splash/weatherly_splash.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'splash_assets.dart';
import 'splash_motion.dart';
import 'splash_painter.dart';

export 'reveal_item.dart';

typedef HomeBuilder = Widget Function(
  BuildContext context,
  Animation<double> reveal,
);

class WeatherlySplash extends StatefulWidget {
  const WeatherlySplash({
    super.key,
    required this.homeBuilder,
    this.ready,
    this.readyTimeout = const Duration(seconds: 4),
    this.onBooted,
  });

  final HomeBuilder homeBuilder;
  final Future<void>? ready;
  final Duration readyTimeout;
  final VoidCallback? onBooted;

  @override
  State<WeatherlySplash> createState() => _WeatherlySplashState();
}

class _WeatherlySplashState extends State<WeatherlySplash>
    with SingleTickerProviderStateMixin {
  late final AnimationController _clock = AnimationController(
    vsync: this,
    duration: Duration(milliseconds: kTotalMs.round()),
  );
  late final Animation<double> _reveal = _clock.drive(
    Tween<double>(begin: -kHandoffStartMs, end: kTotalMs - kHandoffStartMs),
  );

  SplashAssets? _assets;
  bool _tapped = false;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _clock.addListener(_hapticOnLanding);
    _boot();
  }

  void _hapticOnLanding() {
    if (!_tapped && _clock.value * kTotalMs >= 650) {
      _tapped = true;
      HapticFeedback.lightImpact();
    }
  }

  Future<void> _boot() async {
    try {
      final assets = await SplashAssets.load();
      if (!mounted) {
        assets.dispose();
        return;
      }
      setState(() => _assets = assets);
      await WidgetsBinding.instance.endOfFrame;
      if (!mounted) return;

      if (MediaQuery.disableAnimationsOf(context)) {
        _clock.value = 1;
        widget.onBooted?.call();
        setState(() => _done = true);
        return;
      }

      await _clock.animateTo(
        kHandoffStartMs / kTotalMs,
        duration: Duration(milliseconds: kHandoffStartMs.round()),
        curve: Curves.linear,
      );
      if (!mounted) return;
      widget.onBooted?.call();
      try {
        await widget.ready?.timeout(widget.readyTimeout);
      } catch (_) {}
      if (!mounted) return;
      await _clock.animateTo(
        1,
        duration: Duration(milliseconds: (kTotalMs - kHandoffStartMs).round()),
        curve: Curves.linear,
      );
      if (mounted) setState(() => _done = true);
    } catch (_) {
      if (!mounted) return;
      _clock.value = 1;
      widget.onBooted?.call();
      setState(() => _done = true);
    }
  }

  @override
  void dispose() {
    _clock.dispose();
    _assets?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final assets = _assets;
    if (assets == null) {
      return ColoredBox(
        color: Colors.white,
        child: _HomeLayer(
          clock: _clock,
          child: widget.homeBuilder(context, _reveal),
        ),
      );
    }
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (!_done)
            RepaintBoundary(
              key: const ValueKey('splash'),
              child: CustomPaint(painter: SplashPainter(_clock, assets)),
            ),
          _HomeLayer(
            key: const ValueKey('home'),
            clock: _clock,
            child: widget.homeBuilder(context, _reveal),
          ),
        ],
      ),
    );
  }
}

class _HomeLayer extends StatelessWidget {
  const _HomeLayer({super.key, required this.clock, required this.child});

  final AnimationController clock;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: clock,
      child: child,
      builder: (context, child) {
        final k = tw(
          clock.value * kTotalMs,
          kHandoffStartMs + 250,
          700,
          kEmphasized,
        );
        return IgnorePointer(
          ignoring: k < 1,
          child: Opacity(
            opacity: k,
            child: Transform.scale(
              scale: 1.03 - .03 * k,
              alignment: const Alignment(0, -.2),
              child: child,
            ),
          ),
        );
      },
    );
  }
}