// lib/components/home/location_bar.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../stores/location_store.dart';
import '../../theme/app_theme.dart';
import '../common/location_switcher_sheet.dart';

class LocationBar extends StatelessWidget {
  const LocationBar({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.watch<LocationStore>();
    return Semantics(
      button: true,
      label: 'Switch location, currently ${loc.activeLabel}',
      child: InkWell(
        onTap: () => showLocationSwitcher(context),
        borderRadius: BorderRadius.circular(999),
        child: Container(
          constraints: const BoxConstraints(minHeight: 40),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: glassPill(dark: dark),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.location_on_rounded,
                size: 14,
                color: loc.ready ? AppColors.brand500 : const Color(0xFFF59E0B),
              ),
              const SizedBox(width: 6),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 140),
                child: Text(
                  loc.activeLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: dark ? AppColors.stone100 : AppColors.stone900,
                  ),
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.expand_more_rounded,
                size: 14,
                color: AppColors.stone400,
              ),
            ],
          ),
        ),
      ),
    );
  }
}