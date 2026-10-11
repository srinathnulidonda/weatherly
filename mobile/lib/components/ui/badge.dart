// lib/components/ui/badge.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

enum BadgeVariant { defaultVariant, brand, success, warning, danger, info }

enum BadgeSize { xs, sm, md }

class AppBadge extends StatelessWidget {
  const AppBadge(
    this.label, {
    super.key,
    this.variant = BadgeVariant.defaultVariant,
    this.size = BadgeSize.sm,
    this.dot = false,
    this.icon,
  });

  final String label;
  final BadgeVariant variant;
  final BadgeSize size;
  final bool dot;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final colors = _palette(variant, dark);
    final (padding, fontSize) = _sizeStyle(size);

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(color: colors.$2, shape: BoxShape.circle),
            ),
            const SizedBox(width: 4),
          ],
          if (icon != null) ...[
            Icon(icon, size: fontSize + 2, color: colors.$2),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w500,
              color: colors.$2,
            ),
          ),
        ],
      ),
    );
  }

  (EdgeInsetsGeometry, double) _sizeStyle(BadgeSize size) {
    switch (size) {
      case BadgeSize.xs:
        return (const EdgeInsets.symmetric(horizontal: 6, vertical: 2), 10);
      case BadgeSize.md:
        return (const EdgeInsets.symmetric(horizontal: 10, vertical: 4), 14);
      case BadgeSize.sm:
      default:
        return (const EdgeInsets.symmetric(horizontal: 8, vertical: 2), 12);
    }
  }

  (Color, Color) _palette(BadgeVariant variant, bool dark) {
    switch (variant) {
      case BadgeVariant.brand:
        return (
          const Color(0x1AF97316),
          dark ? const Color(0xFFFB923C) : const Color(0xFFEA580C),
        );
      case BadgeVariant.success:
        return (
          const Color(0x1A22C55E),
          dark ? const Color(0xFF4ADE80) : const Color(0xFF16A34A),
        );
      case BadgeVariant.warning:
        return (
          const Color(0x1AF59E0B),
          dark ? const Color(0xFFFBBF24) : const Color(0xFFD97706),
        );
      case BadgeVariant.danger:
        return (
          const Color(0x1AEF4444),
          dark ? const Color(0xFFF87171) : const Color(0xFFDC2626),
        );
      case BadgeVariant.info:
        return (
          const Color(0x1A0EA5E9),
          dark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7),
        );
      case BadgeVariant.defaultVariant:
      default:
        return (
          dark ? const Color(0x0FFFFFFF) : AppColors.stone100,
          dark ? AppColors.stone300 : AppColors.stone700,
        );
    }
  }
}