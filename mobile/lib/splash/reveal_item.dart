// lib/splash/reveal_item.dart
import 'package:flutter/material.dart';
import 'splash_motion.dart';

class RevealItem extends StatelessWidget {
  const RevealItem({
    super.key,
    required this.reveal,
    required this.index,
    required this.child,
  });

  final Animation<double> reveal;
  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: reveal,
      child: child,
      builder: (context, child) {
        final t = tw(reveal.value, 380.0 + index * 70, 550, kEmphasized);
        return Opacity(
          opacity: t,
          child: Transform.translate(
            offset: Offset(0, 18 * (1 - t)),
            child: child,
          ),
        );
      },
    );
  }
}