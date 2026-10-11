// lib/app.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'components/update/update_prompt_dialog.dart';
import 'pages/alerts_page.dart';
import 'pages/analytics_page.dart';
import 'pages/forecast_page.dart';
import 'pages/home_page.dart';
import 'pages/legal/legal_page.dart';
import 'pages/not_found_page.dart';
import 'pages/search_page.dart';
import 'pages/settings_page.dart';
import 'pages/update_page.dart';
import 'services/update_service.dart';
import 'splash/weatherly_splash.dart';
import 'stores/app_store.dart';
import 'theme/app_theme.dart';
import 'utils/constants.dart';

class WeatherlyApp extends StatefulWidget {
  const WeatherlyApp({
    super.key,
    required this.ready,
    required this.updateService,
  });

  final Future<void> ready;
  final UpdateService updateService;

  @override
  State<WeatherlyApp> createState() => _WeatherlyAppState();
}

class _WeatherlyAppState extends State<WeatherlyApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  bool _booted = false;
  bool _updateCheckStarted = false;

  void _onSplashBooted() {
    if (_booted) return;
    setState(() => _booted = true);
    WidgetsBinding.instance.addPostFrameCallback((_) => _startUpdateCheck());
  }

  Future<void> _startUpdateCheck() async {
    if (_updateCheckStarted || !mounted) return;
    _updateCheckStarted = true;

    final UpdateCheck? check = await widget.updateService.check();
    if (!mounted || check == null) return;

    final navigator = _navigatorKey.currentState;
    if (navigator == null) return;

    final bool shouldUpdate = await showDialog<bool>(
          context: navigator.context,
          barrierDismissible: false,
          builder: (_) => UpdatePromptDialog(check: check),
        ) ??
        false;

    if (!mounted) return;
    if (!shouldUpdate) {
      await widget.updateService.skip(check);
      return;
    }

    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => UpdatePage(check: check),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = context.select<AppStore, ThemeMode>((s) => s.themeMode);
    return MaterialApp(
      title: 'Weatherly',
      debugShowCheckedModeBanner: false,
      navigatorKey: _navigatorKey,
      themeMode: themeMode,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: _booted
          ? const HomePage()
          : WeatherlySplash(
              ready: widget.ready,
              onBooted: _onSplashBooted,
              homeBuilder: (context, reveal) => HomePage(reveal: reveal),
            ),
      onGenerateRoute: _onGenerateRoute,
    );
  }

  Route<dynamic>? _onGenerateRoute(RouteSettings settings) {
    final name = settings.name ?? AppRoutes.home;
    late final Widget page;
    switch (name) {
      case AppRoutes.home:
        page = const HomePage();
        break;
      case AppRoutes.forecast:
        page = const ForecastPage();
        break;
      case AppRoutes.search:
        page = const SearchPage();
        break;
      case AppRoutes.analytics:
        page = const AnalyticsPage();
        break;
      case AppRoutes.alerts:
        page = const AlertsPage();
        break;
      case AppRoutes.settings:
        page = SettingsPage(updateService: widget.updateService);
        break;
      case AppRoutes.legalTerms:
        page = const LegalPage(id: 'terms');
        break;
      case AppRoutes.legalPrivacy:
        page = const LegalPage(id: 'privacy');
        break;
      case AppRoutes.legalCookies:
        page = const LegalPage(id: 'cookies');
        break;
      default:
        page = const NotFoundPage();
    }
    return PageRouteBuilder(
      settings: settings,
      transitionDuration: const Duration(milliseconds: 180),
      reverseTransitionDuration: const Duration(milliseconds: 150),
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) =>
          FadeTransition(opacity: animation, child: child),
    );
  }
}