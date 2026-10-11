// lib/components/ui/state_screen.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class StateScreen extends StatelessWidget {
  const StateScreen({
    super.key,
    this.icon,
    required this.title,
    this.description,
    this.action,
    this.height = 380,
  });

  final IconData? icon;
  final String title;
  final String? description;
  final Widget? action;
  final double height;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      constraints: BoxConstraints(minHeight: height),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: dark
              ? const [Color(0xFF1C1917), Color(0xFF1C1917), Color(0xFF0C0A09)]
              : const [Color(0xFFF8F9FA), Color(0xFFFFFFFF), Color(0xFFFAFAFA)],
        ),
        borderRadius: BorderRadius.circular(AppRadius.hero),
        boxShadow: [
          BoxShadow(
            color: dark ? Color(0x1A000000) : Color(0x0A000000),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Center(
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: MediaQuery.of(context).size.width > 600 ? 32 : 20,
            vertical: MediaQuery.of(context).size.height > 600 ? 48 : 32,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width > 600 ? 380 : 320,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 500),
                    curve: Curves.elasticOut,
                    width: 64,
                    height: 64,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: const Color(0x1AF97316),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(
                      icon,
                      size: 30,
                      color: const Color(0xFFF97316),
                    ),
                  ),
                const SizedBox(height: 4),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: MediaQuery.of(context).size.width > 600 ? 22 : 20,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.5,
                    color: dark ? AppColors.stone50 : AppColors.stone900,
                  ),
                ),
                if (description != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    description!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: MediaQuery.of(context).size.width > 600 ? 16 : 14,
                      height: 1.5,
                      color: dark ? AppColors.stone300 : AppColors.stone600,
                    ),
                  ),
                ],
                if (action != null) ...[
                  const SizedBox(height: 24),
                  action!,
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}