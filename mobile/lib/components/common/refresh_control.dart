// lib/components/common/refresh_control.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class RefreshControl extends StatelessWidget {
  const RefreshControl({
    super.key,
    required this.onRefresh,
    required this.child,
  });

  final Future<void> Function() onRefresh;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.brand500,
      backgroundColor: Theme.of(context).brightness == Brightness.dark
          ? AppColors.stone900
          : Colors.white,
      displacement: 40,
      strokeWidth: 2.0, // Make the indicator slightly thicker for better visibility
      child: child,
    );
  }
}