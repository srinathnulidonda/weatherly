// lib/components/home/location_pager.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../stores/location_store.dart';
import '../../theme/app_theme.dart';

class LocationPager extends StatelessWidget {
  const LocationPager({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LocationStore>();
    final dark = Theme.of(context).brightness == Brightness.dark;
    if (!store.locationConfirmed || store.location == null) {
      return Semantics(
        button: true,
        label: 'Add a location',
        child: InkWell(
          onTap: () => Navigator.of(context).pushNamed('/search'),
          borderRadius: BorderRadius.circular(999),
          child: Container(
            constraints: const BoxConstraints(minHeight: 40),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              border: Border.all(
                color: dark ? const Color(0x26FFFFFF) : AppColors.stone300,
              ),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.add_rounded, size: 12, color: AppColors.stone400),
                SizedBox(width: 4),
                Text(
                  'Add a location',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.stone400,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _Chip(
            label: store.location?['city']?.toString() ?? 'Current',
            active: store.isCurrentActive,
            onTap: () => store.setActiveLocationId('current'),
          ),
          ...store.savedLocations.map(
            (l) => Padding(
              padding: const EdgeInsets.only(left: 6),
              child: _Chip(
                label: (l['city'] ?? l['name'] ?? 'Unknown').toString(),
                active: store.activeLocationId == l['id'],
                onTap: () => store.setActiveLocationId(l['id'] as String),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: Semantics(
              button: true,
              label: 'Add a location',
              child: InkWell(
                onTap: () => Navigator.of(context).pushNamed('/search'),
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: dark
                          ? const Color(0x26FFFFFF)
                          : AppColors.stone300,
                    ),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Icon(
                    Icons.add_rounded,
                    size: 12,
                    color: AppColors.stone400,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Semantics(
      button: true,
      selected: active,
      label: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: active
                ? AppColors.brand500
                : (dark ? const Color(0x0FFFFFFF) : Colors.white),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: active
                  ? Colors.transparent
                  : (dark ? const Color(0x14FFFFFF) : AppColors.stone200),
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: active
                  ? Colors.white
                  : (dark ? AppColors.stone300 : AppColors.stone600),
            ),
          ),
        ),
      ),
    );
  }
}