// lib/stores/app_store.dart
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../utils/constants.dart';

class AppStore extends ChangeNotifier {
  String _theme = 'system';
  String _units = 'metric';
  List<Map<String, dynamic>> _recentSearches = [];

  String get theme => _theme;
  String get units => _units;
  List<Map<String, dynamic>> get recentSearches =>
      List.unmodifiable(_recentSearches);

  ThemeMode get themeMode {
    switch (_theme) {
      case 'dark':
        return ThemeMode.dark;
      case 'light':
        return ThemeMode.light;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _theme = prefs.getString(StorageKeys.theme) ?? 'system';
    _units = prefs.getString(StorageKeys.units) ?? AppConfig.defaultUnits;
    final raw = prefs.getString(StorageKeys.recentSearches);
    if (raw != null && raw.isNotEmpty) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          _recentSearches = decoded
              .whereType<Map>()
              .map((e) => e.cast<String, dynamic>())
              .toList();
        }
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<void> setTheme(String value) async {
    _theme = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.theme, value);
  }

  Future<void> setUnits(String value) async {
    _units = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.units, value);
  }

  Future<void> addRecentSearch(Map<String, dynamic> entry) async {
    final lat = (entry['latitude'] as num?)?.toDouble();
    final lon = (entry['longitude'] as num?)?.toDouble();
    final next = <Map<String, dynamic>>[entry];
    for (final r in _recentSearches) {
      final rLat = (r['latitude'] as num?)?.toDouble();
      final rLon = (r['longitude'] as num?)?.toDouble();
      if (lat != null && lon != null && rLat != null && rLon != null) {
        if ((rLat - lat).abs() < 0.01 && (rLon - lon).abs() < 0.01) continue;
      }
      next.add(r);
    }
    _recentSearches = next.take(8).toList();
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.recentSearches, jsonEncode(_recentSearches));
  }

  Future<void> removeRecentSearchAt(int index) async {
    if (index < 0 || index >= _recentSearches.length) return;
    _recentSearches = [..._recentSearches]..removeAt(index);
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.recentSearches, jsonEncode(_recentSearches));
  }
}