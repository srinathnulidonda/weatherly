// lib/components/ui/skeleton.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class SkeletonBox extends StatefulWidget {
  const SkeletonBox({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 8,
    this.baseColor,
    this.highlightColor,
    this.radius = 4.0, // Elite-level: more subtle shine effect
  });

  final double? width;
  final double? height;
  final double borderRadius;
  final Color? baseColor;
  final Color? highlightColor;
  final double radius; // Controls the tightness of the shine

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500), // Slightly faster for more responsive feel
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final base = widget.baseColor ??
        (dark ? const Color(0x0FFFFFFF) : const Color(0xB3E7E5E4));
    final highlight = widget.highlightColor ??
        (dark ? const Color(0x14FFFFFF) : const Color(0x73FFFFFF));

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final t = _controller.value;
        // Elite-level: more natural shine effect with easing
        final easedT = _controller.value;
        final shinePosition = -1.0 + easedT * 2.0; // -1 to 1 range

        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(-shinePosition * widget.radius, 0),
              end: Alignment((2.0 - shinePosition) * widget.radius, 0),
              colors: [base, highlight, base],
              stops: const [0.40, 0.45, 0.50], // Tighter, more focused shine
            ),
          ),
        );
      },
    );
  }
}

class SkeletonCardTile extends StatelessWidget {
  const SkeletonCardTile({super.key, this.height});

  final double? height;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      constraints: BoxConstraints(minHeight: height ?? 102),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: dark ? const Color(0x08FFFFFF) : const Color(0xCCF5F5F4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: dark ? const Color(0x0DFFFFFF) : const Color(0xFFF5F5F4),
        ),
      ),
      child: const Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SkeletonBox(width: 64, height: 10, borderRadius: 999),
              const SizedBox(width: 12), // Consistent spacing
              Expanded(child: SkeletonBox(height: 10, borderRadius: 999)),
            ],
          ),
          const SizedBox(height: 12),
          SkeletonBox(width: double.infinity, height: 24, borderRadius: 8),
          const SizedBox(height: 10),
          SkeletonBox(width: double.infinity, height: 10, borderRadius: 999),
        ],
      ),
    );
  }
}

class SkeletonRowTile extends StatelessWidget {
  const SkeletonRowTile({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          SkeletonBox(width: 48, height: 48, borderRadius: 12),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: double.infinity, height: 12, borderRadius: 999),
                const SizedBox(height: 6),
                SkeletonBox(width: double.infinity, height: 10, borderRadius: 999),
              ],
            ),
          ),
          SkeletonBox(width: 40, height: 16, borderRadius: 999),
        ],
      ),
    );
  }
}

class SkeletonHeroBlock extends StatelessWidget {
  const SkeletonHeroBlock({super.key, this.height = 440});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.stone800,
        borderRadius: BorderRadius.circular(AppRadius.hero),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Expanded(
                child: SkeletonBox(
                  width: double.infinity,
                  height: 12,
                  borderRadius: 999,
                  baseColor: Color(0x33FFFFFF),
                ),
              ),
              const SizedBox(width: 16),
              SkeletonBox(
                width: 64,
                height: 28,
                borderRadius: 999,
                baseColor: Color(0x33FFFFFF),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonBox(width: double.infinity, height: 80, borderRadius: 16, baseColor: Color(0x40FFFFFF)),
              const SizedBox(height: 12),
              SkeletonBox(width: double.infinity, height: 16, borderRadius: 999, baseColor: Color(0x33FFFFFF)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: SkeletonBox(height: 48, borderRadius: 999, baseColor: Color(0x1FFFFFFF)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SkeletonBox(height: 48, borderRadius: 999, baseColor: Color(0x1FFFFFFF)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SkeletonBox(height: 48, borderRadius: 999, baseColor: Color(0x1FFFFFFF)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}