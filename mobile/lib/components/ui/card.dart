// lib/components/ui/card.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

enum CardVariant { base, glass, elevated, brand, active, metric, ghost }

enum CardPadding { none, sm, md, lg }

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.variant = CardVariant.base,
    this.padding = CardPadding.md,
    this.onTap,
    this.margin,
    this.radius,
    this.width,
    this.height,
  });

  final Widget child;
  final CardVariant variant;
  final CardPadding padding;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? margin;
  final double? radius;
  final double? width;
  final double? height;

  EdgeInsetsGeometry get _paddingInsets {
    switch (padding) {
      case CardPadding.none:
        return EdgeInsets.zero;
      case CardPadding.sm:
        return const EdgeInsets.all(12);
      case CardPadding.lg:
        return const EdgeInsets.all(24);
      case CardPadding.md:
      default:
        return const EdgeInsets.all(16);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final r = radius ?? AppRadius.card;
    final decoration = _decorationFor(variant, dark, r);

    Widget content;
    if (variant == CardVariant.ghost) {
      content = Container(
        width: width,
        height: height,
        padding: _paddingInsets,
        child: child,
      );
    } else if (onTap == null) {
      content = Container(
        width: width,
        height: height,
        padding: _paddingInsets,
        decoration: decoration,
        clipBehavior: Clip.antiAlias,
        child: child,
      );
    } else {
      content = Container(
        width: width,
        height: height,
        decoration: decoration,
        clipBehavior: Clip.antiAlias,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Padding(padding: _paddingInsets, child: child),
          ),
        ),
      );
    }

    if (margin == null) return content;
    return Padding(padding: margin!, child: content);
  }

  BoxDecoration _decorationFor(CardVariant variant, bool dark, double radius) {
    switch (variant) {
      case CardVariant.elevated:
        return BoxDecoration(
          color: dark ? const Color(0x0FFFFFFF) : const Color(0xE6FFFFFF),
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(
            color: dark ? const Color(0x17FFFFFF) : const Color(0xCCE7E5E4),
          ),
          boxShadow: dark
              ? null
              : const [
                  BoxShadow(
                    color: Color(0x1F000000),
                    blurRadius: 24,
                    offset: Offset(0, 8),
                  ),
                ],
        );
      case CardVariant.brand:
        return BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFB923C), Color(0xFFEA580C)],
          ),
          borderRadius: BorderRadius.circular(radius),
        );
      case CardVariant.active:
        return BoxDecoration(
          color: dark ? const Color(0x1FF97316) : const Color(0x14F97316),
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(color: const Color(0x33F97316)),
        );
      case CardVariant.metric:
        return BoxDecoration(
          color: dark ? const Color(0x08FFFFFF) : const Color(0xCCF5F5F4),
          borderRadius: BorderRadius.circular(radius - AppRadius.metricInset),
          border: Border.all(
            color: dark ? const Color(0x0DFFFFFF) : const Color(0xFFF5F5F4),
          ),
        );
      case CardVariant.ghost:
        return const BoxDecoration();
      case CardVariant.glass:
      case CardVariant.base:
      default:
        return glassSurface(dark: dark, radius: radius);
    }
  }
}

class CardTitle extends StatelessWidget {
  const CardTitle(this.text, {super.key, this.trailing});

  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final style = TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.6,
      color: dark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
    );
    if (trailing == null) {
      return Text(text.toUpperCase(), style: style);
    }
    return Row(
      children: [
        Expanded(child: Text(text.toUpperCase(), style: style)),
        trailing!,
      ],
    );
  }
}