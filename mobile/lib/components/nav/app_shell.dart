// lib/components/nav/app_shell.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../providers/weather_provider.dart';
import '../../utils/formatters.dart';
import '../common/offline_banner.dart';
import 'bottom_nav.dart';
import 'sidebar.dart';
import 'top_app_bar.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final wide = MediaQuery.sizeOf(context).width >= 900;
    final insets = MediaQuery.paddingOf(context);
    final weatherError =
        context.select<WeatherProvider, Object?>((p) => p.error);
    final lastUpdated =
        context.select<WeatherProvider, DateTime?>((p) => p.lastUpdatedAt);
    final isOffline = weatherError is ApiException && weatherError.isNetwork;

    final overlay = SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
      statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarDividerColor: Colors.transparent,
      systemNavigationBarIconBrightness:
          isDark ? Brightness.light : Brightness.dark,
      systemNavigationBarContrastEnforced: false,
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: overlay,
      child: Scaffold(
        resizeToAvoidBottomInset: true,
        body: Padding(
          padding: EdgeInsets.only(
            left: insets.left,
            right: insets.right,
            top: wide ? insets.top : 0,
            bottom: wide ? insets.bottom : 0,
          ),
          child: Row(
            children: [
              if (wide) const AppSidebar(),
              Expanded(
                child: Column(
                  children: [
                    if (!wide) const TopAppBar(),
                    OfflineBanner(
                      visible: isOffline,
                      message: lastUpdated == null
                          ? null
                          : 'You are offline — showing data saved ${formatRelative(lastUpdated)}',
                    ),
                    Expanded(child: child),
                  ],
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: wide ? null : const BottomNav(),
      ),
    );
  }
}