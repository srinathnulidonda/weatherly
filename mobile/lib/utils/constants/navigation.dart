// lib/utils/constants/navigation.dart
import 'package:flutter/material.dart';

class AppRoutes {
  static const home = '/';
  static const forecast = '/forecast';
  static const search = '/search';
  static const analytics = '/analytics';
  static const alerts = '/alerts';
  static const settings = '/settings';
  static const legalTerms = '/legal/terms';
  static const legalPrivacy = '/legal/privacy';
  static const legalCookies = '/legal/cookies';
}

class NavDestination {
  const NavDestination({
    required this.path,
    required this.label,
    required this.icon,
  });

  final String path;
  final String label;
  final IconData icon;
}

const List<NavDestination> sidebarNav = [
  NavDestination(path: AppRoutes.home, label: 'Weather', icon: Icons.wb_sunny_rounded),
  NavDestination(path: AppRoutes.forecast, label: 'Forecast', icon: Icons.calendar_month_rounded),
  NavDestination(path: AppRoutes.analytics, label: 'Analytics', icon: Icons.bar_chart_rounded),
  NavDestination(path: AppRoutes.alerts, label: 'Alerts', icon: Icons.shield_rounded),
  NavDestination(path: AppRoutes.search, label: 'Search', icon: Icons.search_rounded),
  NavDestination(path: AppRoutes.settings, label: 'Settings', icon: Icons.settings_rounded),
];

const List<NavDestination> bottomNav = [
  NavDestination(path: AppRoutes.home, label: 'Home', icon: Icons.wb_sunny_rounded),
  NavDestination(path: AppRoutes.forecast, label: 'Forecast', icon: Icons.calendar_month_rounded),
  NavDestination(path: AppRoutes.alerts, label: 'Alerts', icon: Icons.shield_rounded),
  NavDestination(path: AppRoutes.settings, label: 'Settings', icon: Icons.settings_rounded),
];