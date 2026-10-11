// lib/components/home/location_manager.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../stores/location_store.dart';
import '../../theme/app_theme.dart';
import '../ui/confirm_dialog.dart';
import '../ui/empty_state.dart';

class LocationManager extends StatelessWidget {
  const LocationManager({super.key});

  Future<void> _confirmRemove(
    BuildContext context,
    LocationStore store,
    Map<String, dynamic> loc,
    String label,
  ) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Remove $label?',
      description: 'This removes the saved location. You can add it again anytime.',
      confirmLabel: 'Remove',
      danger: true,
    );
    if (ok) await store.removeSavedLocation(loc['id'] as String);
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LocationStore>();
    final dark = Theme.of(context).brightness == Brightness.dark;
    if (store.savedLocations.isEmpty) {
      return const EmptyState(
        icon: Icons.location_on_rounded,
        title: 'No saved locations',
        description: 'Search for a city to add one.',
      );
    }
    return Column(
      children: store.savedLocations.map((loc) {
        final active = store.activeLocationId == loc['id'];
        final label = (loc['city'] ?? loc['name'] ?? 'Unknown').toString();
        return Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: active
                  ? const Color(0x1AF97316)
                  : (dark ? const Color(0x08FFFFFF) : Colors.white),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: active
                    ? const Color(0x33F97316)
                    : (dark ? const Color(0x0FFFFFFF) : AppColors.stone200),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Semantics(
                    button: true,
                    selected: active,
                    label: 'Set $label as active location',
                    child: InkWell(
                      onTap: () =>
                          store.setActiveLocationId(loc['id'] as String),
                      borderRadius: BorderRadius.circular(10),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 8,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.location_on_rounded,
                              size: 14,
                              color: active
                                  ? AppColors.brand500
                                  : AppColors.stone400,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                label,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: active
                                      ? AppColors.brand500
                                      : (dark
                                          ? AppColors.stone300
                                          : AppColors.stone700),
                                ),
                              ),
                            ),
                            if (active)
                              const Icon(
                                Icons.star_rounded,
                                size: 12,
                                color: AppColors.brand500,
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Remove $label',
                  onPressed: () => _confirmRemove(context, store, loc, label),
                  icon: const Icon(Icons.close_rounded, size: 16),
                  color: AppColors.stone400,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}