// lib/pages/settings_page.dart
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

import '../components/home/location_manager.dart';
import '../components/nav/app_shell.dart';
import '../components/ui/app_button.dart';
import '../components/ui/card.dart';
import '../components/ui/confirm_dialog.dart';
import '../components/ui/section_label.dart';
import '../components/update/update_prompt_dialog.dart';
import '../pages/update_page.dart';
import '../providers/location_provider.dart';
import '../services/update_service.dart';
import '../stores/app_store.dart';
import '../stores/location_store.dart';
import '../theme/app_theme.dart';
import '../utils/constants.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key, required this.updateService});

  final UpdateService updateService;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final app = context.watch<AppStore>();
    final loc = context.watch<LocationStore>();
    return AppShell(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Text(
            'Settings',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.5,
              color: dark ? AppColors.stone50 : AppColors.stone900,
            ),
          ),
          const SizedBox(height: 16),
          const SectionLabel('Preferences'),
          const SizedBox(height: 8),
          AppCard(
            child: Column(
              children: [
                _RowSetting(
                  title: 'Appearance',
                  control: _Segmented(
                    options: const ['light', 'dark', 'system'],
                    value: app.theme,
                    labelBuilder: (v) =>
                        '${v[0].toUpperCase()}${v.substring(1)}',
                    onChanged: (v) => context.read<AppStore>().setTheme(v),
                  ),
                ),
                const Divider(height: 20),
                _RowSetting(
                  title: 'Units',
                  control: _Segmented(
                    options: const ['metric', 'imperial', 'standard'],
                    value: app.units,
                    labelBuilder: (v) => switch (v) {
                      'imperial' => 'Imp',
                      'standard' => 'Std',
                      _ => 'Met',
                    },
                    onChanged: (v) => context.read<AppStore>().setUnits(v),
                  ),
                ),
                const Divider(height: 20),
                _UpdateCheckRow(updateService: updateService),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const SectionLabel('Locations'),
          const SizedBox(height: 8),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Current: ${loc.activeLabel}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: dark ? AppColors.stone200 : AppColors.stone700,
                  ),
                ),
                if (loc.location != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    '${(loc.location!['latitude'] as num?)?.toStringAsFixed(2)}, ${(loc.location!['longitude'] as num?)?.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.stone500,
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: AppButton(
                        variant: AppButtonVariant.outline,
                        size: AppButtonSize.sm,
                        icon: Icons.refresh_rounded,
                        label: 'Re-detect',
                        fullWidth: true,
                        onPressed: () =>
                            context.read<LocationProvider>().refreshLocation(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: AppButton(
                        variant: AppButtonVariant.outline,
                        size: AppButtonSize.sm,
                        label: 'Clear',
                        fullWidth: true,
                        onPressed: () async {
                          final ok = await showConfirmDialog(
                            context,
                            title: 'Clear current location?',
                            description:
                                'This will remove your detected location.',
                            confirmLabel: 'Clear',
                            danger: true,
                          );
                          if (ok) {
                            await context.read<LocationStore>().clearLocation();
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const AppCard(child: LocationManager()),
          const SizedBox(height: 16),
          const SectionLabel('Legal'),
          const SizedBox(height: 8),
          AppCard(
            child: Column(
              children: [
                _LinkRow(
                  title: 'Terms of Service',
                  onTap: () =>
                      Navigator.of(context).pushNamed(AppRoutes.legalTerms),
                ),
                const Divider(height: 1),
                _LinkRow(
                  title: 'Privacy Policy',
                  onTap: () =>
                      Navigator.of(context).pushNamed(AppRoutes.legalPrivacy),
                ),
                const Divider(height: 1),
                _LinkRow(
                  title: 'Cookie Policy',
                  onTap: () =>
                      Navigator.of(context).pushNamed(AppRoutes.legalCookies),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Center(child: _VersionLabel()),
        ],
      ),
    );
  }
}

class _UpdateCheckRow extends StatefulWidget {
  const _UpdateCheckRow({required this.updateService});

  final UpdateService updateService;

  @override
  State<_UpdateCheckRow> createState() => _UpdateCheckRowState();
}

class _UpdateCheckRowState extends State<_UpdateCheckRow> {
  bool _checking = false;
  String? _status;
  UpdateCheck? _updateCheck;

  @override
  void initState() {
    super.initState();
    _checkForUpdates();
  }

  Future<void> _checkForUpdates() async {
    if (_checking) return;
    setState(() => _checking = true);
    _status = null;

    try {
      final check = await widget.updateService.check(ignoreSkip: true);
      if (!mounted) return;
      setState(() {
        _checking = false;
        _updateCheck = check;
        if (check == null) {
          _status = 'Up to date';
        } else {
          _status = 'Update available';
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _checking = false;
        _status = 'Error checking for updates';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Check for Updates',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: dark ? AppColors.stone50 : AppColors.stone900,
              ),
            ),
          ),
          if (_checking)
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.brand500,
              ),
            )
          else if (_status == 'Up to date')
            Text(
              'Up to date',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.stone400,
              ),
            )
          else if (_status == 'Update available')
            AppButton(
              variant: AppButtonVariant.outline,
              size: AppButtonSize.sm,
              icon: Icons.system_update_rounded,
              label: 'Update',
              onPressed: () async {
                final shouldUpdate = await showDialog<bool>(
                      context: context,
                      barrierDismissible: false,
                      builder: (_) => UpdatePromptDialog(
                        check: _updateCheck!,
                      ),
                    ) ??
                    false;

                if (!mounted) return;
                if (shouldUpdate) {
                  await widget.updateService.skip(_updateCheck!);
                  if (!mounted) return;
                  await Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => UpdatePage(check: _updateCheck!),
                    ),
                  );
                }
              },
            )
          else
            AppButton(
              variant: AppButtonVariant.outline,
              size: AppButtonSize.sm,
              label: 'Retry',
              onPressed: _checkForUpdates,
            ),
        ],
      ),
    );
  }
}

class _VersionLabel extends StatefulWidget {
  const _VersionLabel();

  @override
  State<_VersionLabel> createState() => _VersionLabelState();
}

class _VersionLabelState extends State<_VersionLabel> {
  late final Future<PackageInfo> _info = PackageInfo.fromPlatform();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PackageInfo>(
      future: _info,
      builder: (context, snapshot) {
        final version = snapshot.data?.version;
        final label = version == null || version.isEmpty
            ? '© ${DateTime.now().year} Weatherly'
            : '© ${DateTime.now().year} Weatherly · v$version';
        return Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.stone500),
        );
      },
    );
  }
}

class _RowSetting extends StatelessWidget {
  const _RowSetting({required this.title, required this.control});

  final String title;
  final Widget control;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
        ),
        control,
      ],
    );
  }
}

class _Segmented extends StatelessWidget {
  const _Segmented({
    required this.options,
    required this.value,
    required this.labelBuilder,
    required this.onChanged,
  });

  final List<String> options;
  final String value;
  final String Function(String option) labelBuilder;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: dark ? const Color(0x0FFFFFFF) : AppColors.stone100,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        children: options.map((o) {
          final active = value == o;
          final label = labelBuilder(o);
          return Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => onChanged(o),
              borderRadius: BorderRadius.circular(999),
              child: Semantics(
                button: true,
                selected: active,
                label: label,
                child: Container(
                  constraints:
                      const BoxConstraints(minHeight: AppTapTarget.min),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: active
                        ? (dark ? const Color(0x14FFFFFF) : Colors.white)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: active
                          ? AppColors.brand500
                          : AppColors.stone500,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.title, required this.onTap});

  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: title,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                size: 16,
                color: AppColors.stone400,
              ),
            ],
          ),
        ),
      ),
    );
  }
}