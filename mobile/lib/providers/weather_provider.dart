// lib/providers/weather_provider.dart
import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/weather_api.dart';
import '../stores/app_store.dart';
import '../stores/location_store.dart';
import '../utils/constants.dart';

class WeatherProvider extends ChangeNotifier {
  WeatherProvider(this._locations, this._app) {
    _locations.addListener(_onDepsChanged);
    _app.addListener(_onDepsChanged);
  }

  final LocationStore _locations;
  final AppStore _app;

  Map<String, dynamic>? _current;
  Map<String, dynamic>? _forecast;
  Map<String, dynamic>? _airQuality;
  List<Map<String, dynamic>> _flatHours = const [];
  bool _loading = false;
  Object? _error;
  double? _lastLat;
  double? _lastLon;
  String? _lastUnits;
  int _forecastDays = 7;
  Future<void>? _inflight;
  bool _pendingRefresh = false;
  DateTime? _lastUpdatedAt;

  Map<String, dynamic>? get current => _current;
  Map<String, dynamic>? get forecast => _forecast;
  Map<String, dynamic>? get airQuality => _airQuality;
  bool get loading => _loading;
  Object? get error => _error;
  int get forecastDays => _forecastDays;
  List<Map<String, dynamic>> get flatHours => _flatHours;
  DateTime? get lastUpdatedAt => _lastUpdatedAt;

  void _onDepsChanged() {
    final lat = _locations.activeLat;
    final lon = _locations.activeLon;
    final units = _app.units;
    if (lat == null || lon == null) return;
    if (lat != _lastLat || lon != _lastLon || units != _lastUnits) {
      _lastLat = lat;
      _lastLon = lon;
      _lastUnits = units;
      unawaited(refresh());
    }
  }

  Future<void> refresh() {
    final existing = _inflight;
    if (existing != null) {
      _pendingRefresh = true;
      return existing;
    }
    final future = _refreshImpl();
    _inflight = future.whenComplete(() {
      _inflight = null;
      if (_pendingRefresh) {
        _pendingRefresh = false;
        unawaited(refresh());
      }
    });
    return _inflight!;
  }

  Future<void> _refreshImpl() async {
    final lat = _locations.activeLat;
    final lon = _locations.activeLon;
    if (lat == null || lon == null) return;
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        weatherApi.current(lat, lon, units: _app.units),
        weatherApi.forecast(
          lat,
          lon,
          days: _forecastDays,
          units: _app.units,
          hourly: true,
        ),
        weatherApi.airQuality(lat, lon),
      ]);
      _current = results[0];
      _forecast = results[1];
      _flatHours = _flattenHours(results[1]);
      _airQuality = results[2];
      _lastUpdatedAt = DateTime.now();
      unawaited(_persistCache());
    } catch (err) {
      _error = err;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> setForecastDays(int days) async {
    if (days == _forecastDays) return;
    _forecastDays = days;
    notifyListeners();
    await refresh();
  }

  Future<void> restoreFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(StorageKeys.weatherCache);
      if (raw == null || raw.isEmpty) return;
      final decoded = jsonDecode(raw);
      if (decoded is! Map) return;
      final map = decoded.cast<String, dynamic>();

      final current = map['current'];
      final forecast = map['forecast'];
      final airQuality = map['air_quality'];
      final savedAt = DateTime.tryParse(map['saved_at']?.toString() ?? '');

      _current = current is Map ? current.cast<String, dynamic>() : null;
      _forecast = forecast is Map ? forecast.cast<String, dynamic>() : null;
      _airQuality =
          airQuality is Map ? airQuality.cast<String, dynamic>() : null;
      _flatHours = _forecast != null ? _flattenHours(_forecast!) : const [];
      _lastUpdatedAt = savedAt;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> _persistCache() async {
    try {
      final forecast = _forecast;
      Map<String, dynamic>? trimmedForecast;
      if (forecast != null) {
        final days = forecast['days'];
        trimmedForecast = <String, dynamic>{
          ...forecast,
          if (days is List)
            'days': days.whereType<Map>().map((day) {
              final copy = Map<String, dynamic>.from(day.cast<String, dynamic>());
              copy.remove('hourly');
              return copy;
            }).toList(),
        };
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        StorageKeys.weatherCache,
        jsonEncode({
          'current': _current,
          'forecast': trimmedForecast,
          'air_quality': _airQuality,
          'saved_at': DateTime.now().toIso8601String(),
        }),
      );
    } catch (_) {}
  }

  List<Map<String, dynamic>> _flattenHours(Map<String, dynamic> forecast) {
    final days = forecast['days'];
    final hours = <Map<String, dynamic>>[];
    if (days is List) {
      for (final day in days) {
        if (day is Map) {
          final dayHours = day['hourly'];
          if (dayHours is List) {
            for (final h in dayHours) {
              if (h is Map) hours.add(h.cast<String, dynamic>());
            }
          }
        }
      }
    }
    hours.sort((a, b) {
      final da = DateTime.tryParse((a['datetime_utc'] ?? '').toString()) ??
          DateTime.fromMillisecondsSinceEpoch(0);
      final db = DateTime.tryParse((b['datetime_utc'] ?? '').toString()) ??
          DateTime.fromMillisecondsSinceEpoch(0);
      return da.compareTo(db);
    });
    final now = DateTime.now();
    final cutoff = DateTime(now.year, now.month, now.day, now.hour);
    final filtered = hours.where((h) {
      final t = DateTime.tryParse((h['datetime_utc'] ?? '').toString());
      return t != null && !t.isBefore(cutoff);
    }).toList();
    return filtered.isNotEmpty ? filtered : hours;
  }

  @override
  void dispose() {
    _locations.removeListener(_onDepsChanged);
    _app.removeListener(_onDepsChanged);
    super.dispose();
  }
}