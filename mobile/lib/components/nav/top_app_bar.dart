// lib/components/nav/top_app_bar.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../stores/location_store.dart';
import '../../theme/app_theme.dart';
import '../ui/tooltip.dart';

class TopAppBar extends StatelessWidget {
  const TopAppBar({super.key});

  /// Height of the bar content, excluding the status-bar inset.
  static const double _barHeight = 48;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final ready = context.select<LocationStore, bool>((s) => s.ready);
    final insets = MediaQuery.paddingOf(context);

    return Container(
      height: _barHeight + insets.top,
      padding: EdgeInsets.only(top: insets.top),
      decoration: BoxDecoration(
        color: dark
            ? const Color(0xCC0C0A09) // 80% opacity
            : const Color(0xCCFFFFFF), // 80% opacity
        border: Border(
          bottom: BorderSide(
            color: dark
                ? const Color(0x0EFFFFFF)
                : const Color(0x0EE7E5E4),
          ),
        ),
      ),
      child: Row(
        children: [
          const SizedBox(width: 16),
          MouseRegion(
            onEnter: (_) => HapticFeedback.lightImpact(),
            child: GestureDetector(
              onTapDown: (_) => HapticFeedback.lightImpact(),
              child: Text(
                'Weatherly',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.2,
                  fontFamily: 'GoogleSans',
                  color: dark ? AppColors.stone50 : AppColors.stone900,
                ),
              ),
            ),
          ),
          const Spacer(),
          AppTooltip(
            message: 'Search a city',
            child: Semantics(
              button: true,
              label: 'Search a city',
              child: InkWell(
                onTap: () => Navigator.of(context).pushNamed('/search'),
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: ready
                        ? (dark
                            ? const Color(0x2AF97316) // brand, ~16% opacity
                            : const Color(0x1AF97316)) // brand, ~10% opacity
                        : (dark
                            ? const Color(0x1FFFFFFF) // white, ~12% opacity
                            : AppColors.stone50),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.search_rounded,
                    size: 20,
                    color: ready
                        ? AppColors.brand500
                        : (dark ? AppColors.stone400 : AppColors.stone500),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
        ],
      ),
    );
  }
}