// lib/main.dart
import 'dart:developer' as developer;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'api/app_version_api.dart';
import 'app.dart';
import 'providers/alerts_provider.dart';
import 'providers/analytics_provider.dart';
import 'providers/location_provider.dart';
import 'providers/weather_provider.dart';
import 'services/update_service.dart';
import 'stores/app_store.dart';
import 'stores/location_store.dart';

void _reportError(Object error, StackTrace stackTrace) {
  developer.log(
    'Unhandled error',
    name: 'weatherly',
    level: 1000,
    error: error,
    stackTrace: stackTrace,
  );
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    _reportError(details.exception, details.stack ?? StackTrace.empty);
  };
  PlatformDispatcher.instance.onError = (Object error, StackTrace stackTrace) {
    _reportError(error, stackTrace);
    return true;
  };

  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.dark,
    systemNavigationBarDividerColor: Colors.transparent,
    systemNavigationBarContrastEnforced: false,
  ));

  final appStore = AppStore();
  final locationStore = LocationStore();
  await appStore.init();
  await locationStore.init();

  final locationProvider = LocationProvider(locationStore);
  final weatherProvider = WeatherProvider(locationStore, appStore);
  final alertsProvider = AlertsProvider(locationStore);
  final analyticsProvider = AnalyticsProvider(locationStore);
  final updateService = UpdateService(api: appVersionApi);
  await weatherProvider.restoreFromCache();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AppStore>.value(value: appStore),
        ChangeNotifierProvider<LocationStore>.value(value: locationStore),
        ChangeNotifierProvider<LocationProvider>.value(value: locationProvider),
        ChangeNotifierProvider<WeatherProvider>.value(value: weatherProvider),
        ChangeNotifierProvider<AlertsProvider>.value(value: alertsProvider),
        ChangeNotifierProvider<AnalyticsProvider>.value(value: analyticsProvider),
      ],
      child: WeatherlyApp(
        ready: locationProvider.init(),
        updateService: updateService,
      ),
    ),
  );
}