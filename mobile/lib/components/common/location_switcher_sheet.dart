// lib/components/common/location_switcher_sheet.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/location_provider.dart';
import '../../stores/location_store.dart';
import '../../theme/app_theme.dart';
import '../ui/app_input.dart';
import '../ui/tooltip.dart';
import 'location_results_list.dart';
import 'location_search_controller.dart';

Future<void> showLocationSwitcher(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _LocationSwitcherSheet(),
  );
}

class _LocationSwitcherSheet extends StatefulWidget {
  const _LocationSwitcherSheet();

  @override
  State<_LocationSwitcherSheet> createState() => _LocationSwitcherSheetState();
}

class _LocationSwitcherSheetState extends State<_LocationSwitcherSheet> {
  final _search = LocationSearchController();
  final _controller = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _selectResult(Map<String, dynamic> r) async {
    final store = context.read<LocationStore>();
    final id = await store.addSavedLocation(r);
    await store.setActiveLocationId(id);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.watch<LocationStore>();
    final provider = context.read<LocationProvider>();
    final top = MediaQuery.of(context).padding.top;
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(top: top + 40, bottom: bottom),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.72,
        ),
        decoration: BoxDecoration(
          color: dark ? AppColors.stone900 : Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33000000),
              blurRadius: 24,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 8, 12),
              child: Row(
                children: [
                  Expanded(
                    child: AnimatedBuilder(
                      animation: _search,
                      builder: (context, _) => AppInput(
                        controller: _controller,
                        hint: 'Search for a city...',
                        leadingIcon: Icons.search_rounded,
                        autofocus: true,
                        onChanged: _search.onChanged,
                        trailing: _search.loading
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : null,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  AppTooltip(
                    message: 'Close',
                    child: IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded, size: 18),
                      color: AppColors.stone400,
                      tooltip: 'Close',
                    ),
                  ),
                ],
              ),
            ),
            Divider(
              height: 1,
              color: dark ? const Color(0x0FFFFFFF) : AppColors.stone100,
            ),
            Flexible(
              child: AnimatedBuilder(
                animation: _search,
                builder: (context, _) {
                  final showingSaved =
                      _controller.text.isEmpty && _search.results.isEmpty;
                  return SingleChildScrollView(
                    child: Column(
                      children: [
                        Semantics(
                          button: true,
                          label: 'Use current location',
                          child: InkWell(
                            onTap: () {
                              loc.setActiveLocationId('current');
                              if (loc.location == null) {
                                provider.detectLocation(highAccuracy: true);
                              }
                              Navigator.of(context).pop();
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 14,
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: const Color(0x1AF97316),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(
                                      Icons.my_location_rounded,
                                      size: 14,
                                      color: AppColors.brand500,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  const Expanded(
                                    child: Text(
                                      'Use current location',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.brand500,
                                      ),
                                    ),
                                  ),
                                  if (loc.isCurrentActive)
                                    const Icon(
                                      Icons.star_rounded,
                                      size: 14,
                                      color: AppColors.brand500,
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        if (showingSaved)
                          ...loc.savedLocations.map(
                            (l) => Semantics(
                              button: true,
                              label: (l['city'] ?? l['name'] ?? 'Unknown')
                                  .toString(),
                              child: InkWell(
                                onTap: () {
                                  loc.setActiveLocationId(l['id'] as String);
                                  Navigator.of(context).pop();
                                },
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 32,
                                        height: 32,
                                        decoration: BoxDecoration(
                                          color: dark
                                              ? const Color(0x0FFFFFFF)
                                              : AppColors.stone100,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: const Icon(
                                          Icons.location_on_rounded,
                                          size: 14,
                                          color: AppColors.stone400,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          (l['city'] ?? l['name'] ?? 'Unknown')
                                              .toString(),
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: dark
                                                ? AppColors.stone200
                                                : AppColors.stone800,
                                          ),
                                        ),
                                      ),
                                      if (loc.activeLocationId == l['id'])
                                        const Icon(
                                          Icons.star_rounded,
                                          size: 14,
                                          color: AppColors.brand500,
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        if (_search.results.isNotEmpty)
                          LocationResultsList(
                            results: _search.results,
                            onSelect: _selectResult,
                            showAddress: true,
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}