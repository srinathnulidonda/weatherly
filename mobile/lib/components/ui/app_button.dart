// lib/components/ui/app_button.dart
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme/app_theme.dart';

enum AppButtonVariant { primary, ghost, outline, danger, icon }

enum AppButtonSize { sm, md }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.icon,
    this.loading = false,
    this.disabled = false,
    this.fullWidth = false,
    this.child,
  });

  final String? label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? icon;
  final bool loading;
  final bool disabled;
  final bool fullWidth;
  final Widget? child;

  bool get _isDisabled => disabled || loading || onPressed == null;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final theme = _theme(dark);
    final content = _content(theme);

    final button = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _isDisabled
            ? null
            : () async {
                // Provide haptic feedback for button presses
                if (Platform.isAndroid || Platform.isIOS) {
                  HapticFeedback.lightImpact();
                }
                onPressed?.call();
              },
        borderRadius: BorderRadius.circular(theme.borderRadius),
        child: Container(
          width: fullWidth ? double.infinity : null,
          padding: theme.padding,
          constraints: theme.constraints,
          decoration: BoxDecoration(
            color: theme.background,
            border: theme.border,
            gradient: theme.gradient,
            borderRadius: BorderRadius.circular(theme.borderRadius),
            boxShadow: theme.shadow,
          ),
          child: Opacity(
            opacity: disabled ? 0.5 : (loading ? 0.7 : 1),
            child: DefaultTextStyle(
              style: theme.textStyle,
              child: IconTheme(
                data: IconThemeData(color: theme.foreground, size: 16),
                child: content,
              ),
            ),
          ),
        ),
      ),
    );

    if (variant == AppButtonVariant.icon) {
      return SizedBox(
        width: AppTapTarget.min,
        height: AppTapTarget.min,
        child: button,
      );
    }
    return button;
  }

  Widget _content(_ButtonTheme theme) {
    if (variant == AppButtonVariant.icon) {
      final iconWidget = loading
          ? SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(theme.foreground),
              ),
            )
          : Icon(icon, size: 20);
      return Center(child: iconWidget);
    }

    final children = <Widget>[];
    if (loading) {
      children.add(
        SizedBox(
          width: 16,
          height: 16,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(theme.foreground),
          ),
        ),
      );
      if (icon != null) children.add(const SizedBox(width: 8));
    } else if (icon != null) {
      children.add(Icon(icon, size: 16));
      if (label != null || child != null) {
        children.add(const SizedBox(width: 6));
      }
    }
    if (child != null) {
      children.add(child!);
    } else if (label != null) {
      children.add(Text(label!));
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: children,
    );
  }

  _ButtonTheme _theme(bool dark) {
    const textSm = TextStyle(fontWeight: FontWeight.w500, fontSize: 12);
    const textMd = TextStyle(fontWeight: FontWeight.w600, fontSize: 14);
    const minHeight = BoxConstraints(minHeight: AppTapTarget.min);

    final padding = size == AppButtonSize.sm
        ? const EdgeInsets.symmetric(horizontal: 14, vertical: 10)
        : const EdgeInsets.symmetric(horizontal: 20, vertical: 12);

    switch (variant) {
      case AppButtonVariant.primary:
        return _ButtonTheme(
          background: Colors.transparent,
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFB923C), Color(0xFFEA580C)],
          ),
          foreground: Colors.white,
          borderRadius: 999,
          padding: padding,
          constraints: minHeight,
          textStyle: size == AppButtonSize.sm ? textSm : textMd,
          shadow: const [
            BoxShadow(
              color: Color(0x10F97316),
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        );
      case AppButtonVariant.ghost:
        return _ButtonTheme(
          background: Colors.transparent,
          foreground: dark ? AppColors.stone400 : AppColors.stone600,
          borderRadius: 999,
          padding: padding,
          constraints: minHeight,
          textStyle: size == AppButtonSize.sm ? textSm : textMd,
        );
      case AppButtonVariant.outline:
        return _ButtonTheme(
          background: Colors.transparent,
          foreground: dark ? AppColors.stone300 : AppColors.stone700,
          border: Border.all(
            color: dark ? const Color(0x1FFFFFFF) : AppColors.stone300,
          ),
          borderRadius: 999,
          padding: padding,
          constraints: minHeight,
          textStyle: size == AppButtonSize.sm ? textSm : textMd,
        );
      case AppButtonVariant.danger:
        return _ButtonTheme(
          background: const Color(0xFFDC2626),
          foreground: Colors.white,
          borderRadius: 999,
          padding: padding,
          constraints: minHeight,
          textStyle: size == AppButtonSize.sm ? textSm : textMd,
          shadow: const [
            BoxShadow(
              color: Color(0x10DC2626),
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        );
      case AppButtonVariant.icon:
        return _ButtonTheme(
          background: Colors.transparent,
          foreground: dark ? AppColors.stone400 : AppColors.stone500,
          borderRadius: 999,
          padding: EdgeInsets.zero,
        );
    }
  }
}

class _ButtonTheme {
  _ButtonTheme({
    required this.background,
    required this.foreground,
    required this.borderRadius,
    required this.padding,
    this.border,
    this.gradient,
    this.textStyle = const TextStyle(),
    this.shadow,
    this.constraints,
  });

  final Color background;
  final Color foreground;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final BoxBorder? border;
  final Gradient? gradient;
  final TextStyle textStyle;
  final List<BoxShadow>? shadow;
  final BoxConstraints? constraints;
}