// lib/components/nav/bottom_nav.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/alerts_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/constants.dart';

class BottomNav extends StatelessWidget {
  const BottomNav({super.key});

  /// Height of the nav content, excluding the bottom safe-area inset.
  static const double _barHeight = 56;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final current = ModalRoute.of(context)?.settings.name ?? '/';
    final alertCount = context.select<AlertsProvider, int>((p) => p.activeCount);

    return Container(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: dark ? const Color(0xFF0C0A09) : const Color(0xFFFFFFFF),
        border: Border(
          top: BorderSide(
            color: dark ? const Color(0x1EFFFFFF) : const Color(0xFFE7E5E4),
          ),
        ),
      ),
      child: SizedBox(
        height: _barHeight,
        child: Row(
          children: bottomNav.map((item) {
            final active = current == item.path;
            final color = active
                ? AppColors.brand500
                : (dark ? AppColors.stone500 : AppColors.stone400);

            return Expanded(
              child: Semantics(
                button: true,
                selected: active,
                label: item.label,
                child: InkWell(
                  onTap: () {
                    if (current != item.path) {
                      Navigator.of(context).pushReplacementNamed(item.path);
                    }
                  },
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Icon(item.icon, size: 22, color: color),
                          if (item.path == '/alerts' && alertCount > 0)
                            Positioned(
                              top: -2,
                              right: -6,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 5,
                                  vertical: 2,
                                ),
                                constraints: const BoxConstraints(minWidth: 16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEF4444),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  alertCount > 9 ? '9+' : '$alertCount',
                                  style: const TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: color,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}