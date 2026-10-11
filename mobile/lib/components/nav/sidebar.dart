// lib/components/nav/sidebar.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../stores/app_store.dart';
import '../../theme/app_theme.dart';
import '../../utils/constants.dart';
import '../ui/tooltip.dart';

class AppSidebar extends StatelessWidget {
  const AppSidebar({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final current = ModalRoute.of(context)?.settings.name ?? AppRoutes.home;
    final theme = context.select<AppStore, String>((s) => s.theme);
    final topInset = MediaQuery.of(context).padding.top;

    return Container(
      width: 260,
      decoration: BoxDecoration(
        color: dark ? AppColors.stone950 : AppColors.stone50,
        border: Border(
          right: BorderSide(
            color: dark ? const Color(0x12FFFFFF) : AppColors.stone200,
          ),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.only(top: topInset),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
              child: Text(
                'Weatherly',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: dark ? AppColors.stone50 : AppColors.stone900,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Semantics(
                button: true,
                label: 'Search a city',
                child: InkWell(
                  onTap: () => Navigator.of(context).pushNamed(AppRoutes.search),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: dark ? const Color(0x08FFFFFF) : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: dark
                            ? const Color(0x0FFFFFFF)
                            : AppColors.stone200,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.search_rounded,
                          size: 15,
                          color: dark ? AppColors.stone500 : AppColors.stone400,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Search a city…',
                          style: TextStyle(
                            fontSize: 13,
                            color:
                                dark ? AppColors.stone500 : AppColors.stone500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: sidebarNav.map((item) {
                  final active = current == item.path;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Semantics(
                      button: true,
                      selected: active,
                      label: item.label,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () {
                          if (current != item.path) {
                            if (item.path == AppRoutes.home) {
                              Navigator.of(context).pushNamedAndRemoveUntil(
                                AppRoutes.home,
                                (r) => false,
                              );
                            } else {
                              Navigator.of(context)
                                  .pushReplacementNamed(item.path);
                            }
                          }
                        },
                        child: Container(
                          height: 48,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: active
                                ? (dark
                                    ? const Color(0x0FFFFFFF)
                                    : const Color(0x99E7E5E4))
                                : null,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                item.icon,
                                size: 16,
                                color: active
                                    ? AppColors.brand500
                                    : (dark
                                        ? AppColors.stone500
                                        : AppColors.stone400),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                item.label,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: active
                                      ? FontWeight.w600
                                      : FontWeight.w400,
                                  color: dark
                                      ? AppColors.stone300
                                      : AppColors.stone700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: ['light', 'dark', 'system'].map((t) {
                  final active = theme == t;
                  final icon = t == 'light'
                      ? Icons.wb_sunny_rounded
                      : t == 'dark'
                          ? Icons.nights_stay_rounded
                          : Icons.devices_rounded;
                  final label = '${t[0].toUpperCase()}${t.substring(1)} theme';
                  return Expanded(
                    child: AppTooltip(
                      message: label,
                      child: Semantics(
                        button: true,
                        selected: active,
                        label: label,
                        child: InkWell(
                          onTap: () => context.read<AppStore>().setTheme(t),
                          child: Container(
                            height: AppTapTarget.min,
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            decoration: BoxDecoration(
                              color: active
                                  ? (dark
                                      ? const Color(0x14FFFFFF)
                                      : Colors.white)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              icon,
                              size: 15,
                              color: active
                                  ? AppColors.brand500
                                  : AppColors.stone400,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}