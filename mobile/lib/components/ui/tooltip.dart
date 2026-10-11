// lib/components/ui/tooltip.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class AppTooltip extends StatelessWidget {
  const AppTooltip({
    super.key,
    required this.message,
    required this.child,
    this.preferBelow = false,
  });

  final String message;
  final Widget child;
  final bool preferBelow;

  @override
  Widget build(BuildContext context) {
    if (message.isEmpty) return child;
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Tooltip(
      message: message,
      preferBelow: preferBelow,
      waitDuration: const Duration(milliseconds: 220),
      decoration: BoxDecoration(
        color: dark ? AppColors.stone900 : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: dark ? const Color(0x14FFFFFF) : AppColors.stone200,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F000000),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      textStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: dark ? AppColors.stone200 : AppColors.stone700,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: child,
    );
  }
}