// lib/pages/search_page.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../components/common/location_results_list.dart';
import '../components/common/location_search_controller.dart';
import '../components/nav/app_shell.dart';
import '../components/ui/app_input.dart';
import '../components/ui/confirm_dialog.dart';
import '../components/ui/section_label.dart';
import '../providers/location_provider.dart';
import '../stores/app_store.dart';
import '../stores/location_store.dart';
import '../theme/app_theme.dart';
import '../utils/constants.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _search = LocationSearchController();
  final _controller = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _select(Map<String, dynamic> r) async {
    final store = context.read<LocationStore>();
    final app = context.read<AppStore>();
    final id = await store.addSavedLocation(r);
    await store.setActiveLocationId(id);
    await app.addRecentSearch({
      'name': r['name'] ?? r['city'],
      'latitude': r['latitude'],
      'longitude': r['longitude'],
      'country_code': r['country_code'],
    });
    if (mounted) Navigator.of(context).pushReplacementNamed(AppRoutes.home);
  }

  Future<void> _useCurrent() async {
    final store = context.read<LocationStore>();
    final provider = context.read<LocationProvider>();
    await store.setActiveLocationId('current');
    if (store.location == null) {
      await provider.detectLocation(highAccuracy: true);
    }
    if (mounted) Navigator.of(context).pushReplacementNamed(AppRoutes.home);
  }

  Future<void> _removeRecent(int index) async {
    final app = context.read<AppStore>();
    final entry = app.recentSearches[index];
    final label = (entry['name'] ?? 'this location').toString();
    final ok = await showConfirmDialog(
      context,
      title: 'Remove $label?',
      description: 'This only removes it from your recent searches.',
      confirmLabel: 'Remove',
      danger: true,
    );
    if (ok) await app.removeRecentSearchAt(index);
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final store = context.watch<LocationStore>();
    final app = context.watch<AppStore>();

    return AppShell(
      child: AnimatedBuilder(
        animation: _search,
        builder: (context, _) {
          final showSaved =
              _controller.text.isEmpty && _search.results.isEmpty;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              Text(
                'Search Location',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.5,
                  color: dark ? AppColors.stone50 : AppColors.stone900,
                ),
              ),
              const SizedBox(height: 12),
              AppInput(
                controller: _controller,
                hint: 'Search for a city, town, or place...',
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
              const SizedBox(height: 12),
              if (showSaved && store.location != null)
                _UseCurrentTile(onTap: _useCurrent),
              if (showSaved && app.recentSearches.isNotEmpty) ...[
                const SizedBox(height: 16),
                const SectionLabel('Recent'),
                const SizedBox(height: 8),
                ...app.recentSearches.asMap().entries.map(
                  (entry) => _RecentTile(
                    label: (entry.value['name'] ?? '').toString(),
                    dark: dark,
                    onTap: () => _select(entry.value),
                    onLongPress: () => _removeRecent(entry.key),
                  ),
                ),
              ],
              if (_search.results.isNotEmpty) ...[
                const SizedBox(height: 12),
                const SectionLabel('Results'),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: dark ? const Color(0x08FFFFFF) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: dark
                          ? const Color(0x0FFFFFFF)
                          : AppColors.stone200,
                    ),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: LocationResultsList(
                    results: _search.results,
                    onSelect: _select,
                    showAddress: true,
                    showFlag: true,
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _UseCurrentTile extends StatelessWidget {
  const _UseCurrentTile({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Use my current location',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0x14F97316), Color(0x00F97316)],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x33F97316)),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  color: AppColors.brand500,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.my_location_rounded,
                  size: 14,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Use my current location',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.brand500,
                  ),
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                size: 16,
                color: AppColors.brand500,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentTile extends StatelessWidget {
  const _RecentTile({
    required this.label,
    required this.dark,
    required this.onTap,
    required this.onLongPress,
  });

  final String label;
  final bool dark;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$label, long press to remove',
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          constraints: const BoxConstraints(minHeight: 48),
          margin: const EdgeInsets.only(bottom: 6),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: dark ? const Color(0x08FFFFFF) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: dark ? const Color(0x0FFFFFFF) : AppColors.stone200,
            ),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.history_rounded,
                size: 14,
                color: AppColors.stone400,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    color: dark ? AppColors.stone200 : AppColors.stone800,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}