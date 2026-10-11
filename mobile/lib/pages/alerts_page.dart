// lib/pages/alerts_page.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../components/alerts/alert_radius_map.dart';
import '../components/nav/app_shell.dart';
import '../components/ui/badge.dart';
import '../components/ui/app_button.dart';
import '../components/ui/empty_state.dart';
import '../components/ui/error_state.dart';
import '../components/ui/state_screen.dart';
import '../providers/alerts_provider.dart';
import '../stores/location_store.dart';
import '../theme/app_theme.dart';
import '../theme/color_tokens.dart';
import '../utils/formatters.dart';

class AlertsPage extends StatefulWidget {
  const AlertsPage({super.key});

  @override
  State<AlertsPage> createState() => _AlertsPageState();
}

class _AlertsPageState extends State<AlertsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (context.read<LocationStore>().ready) {
        context.read<AlertsProvider>().refresh();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final ready = context.select<LocationStore, bool>((s) => s.ready);
    final provider = context.watch<AlertsProvider>();
    final store = context.watch<LocationStore>();
    final dark = Theme.of(context).brightness == Brightness.dark;

    if (!ready) {
      return AppShell(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: StateScreen(
            icon: Icons.shield_rounded,
            title: 'Set your location',
            description: 'Confirm your location to view weather alerts.',
            action: AppButton(
              label: 'Search for a city',
              onPressed: () => Navigator.of(context).pushNamed('/search'),
            ),
          ),
        ),
      );
    }

    if (provider.error != null && provider.alerts.isEmpty) {
      return AppShell(
        child: ErrorState(
          error: provider.error,
          onRetry: () => context.read<AlertsProvider>().refresh(),
        ),
      );
    }

    final totalItems = (provider.pagination?['total_items'] as num?)?.toInt();
    final hasMore = totalItems != null && provider.alerts.length < totalItems;

    return AppShell(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Row(
            children: [
              Text(
                'Weather Alerts',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.5,
                  color: dark ? AppColors.stone50 : AppColors.stone900,
                ),
              ),
              const Spacer(),
              DropdownButton<double>(
                value: provider.radiusKm,
                underline: const SizedBox.shrink(),
                items: [25, 50, 100, 250, 500]
                    .map(
                      (r) => DropdownMenuItem(
                        value: r.toDouble(),
                        child: Text(
                          '${r.toInt()} km',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (v) {
                  if (v != null) context.read<AlertsProvider>().setRadius(v);
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (provider.alerts.isEmpty && !provider.loading)
            const EmptyState(
              icon: Icons.shield_rounded,
              title: 'No active alerts',
              description: 'No weather alerts near your location. Stay safe!',
            ),
          if (provider.alerts.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: dark ? const Color(0x08FFFFFF) : Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: AlertRadiusMap(
                alerts: provider.alerts,
                radiusKm: provider.radiusKm,
                userLat: store.activeLat,
                userLon: store.activeLon,
              ),
            ),
            const SizedBox(height: 12),
            ...provider.alerts.map((a) {
              final severity = (a['severity'] ?? 'unknown').toString();
              final token = getSeverityToken(severity);
              final isCritical = criticalSeverities.contains(
                severity.toLowerCase(),
              );
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: dark ? const Color(0x08FFFFFF) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: token.color.withValues(alpha: 0.25),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: token.color.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            Icons.warning_amber_rounded,
                            size: 16,
                            color: token.color,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                a['headline']?.toString() ?? 'Alert',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: dark
                                      ? AppColors.stone100
                                      : AppColors.stone900,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  AppBadge(
                                    token.label,
                                    size: BadgeSize.xs,
                                    variant: isCritical
                                        ? BadgeVariant.danger
                                        : BadgeVariant.warning,
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      a['event_type']?.toString() ?? '',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.stone500,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (a['description'] != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        a['description'].toString(),
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.45,
                          color: dark
                              ? AppColors.stone400
                              : AppColors.stone600,
                        ),
                      ),
                    ],
                    if (a['effective_at'] != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        formatRelative(a['effective_at']),
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.stone400,
                        ),
                      ),
                    ],
                  ],
                ),
              );
            }).toList(),
            if (hasMore)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Center(
                  child: AppButton(
                    variant: AppButtonVariant.outline,
                    size: AppButtonSize.sm,
                    label: 'Load more',
                    loading: provider.loading,
                    onPressed: () => context
                        .read<AlertsProvider>()
                        .setPage(provider.page + 1),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}