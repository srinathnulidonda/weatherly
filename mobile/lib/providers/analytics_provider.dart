// lib/providers/analytics_provider.dart
import 'dart:async';

import 'package:flutter/foundation.dart';

import '../api/weather_api.dart';
import '../stores/location_store.dart';

class AnalyticsProvider extends ChangeNotifier {
  AnalyticsProvider(this._locations) {
    _locations.addListener(_onDepsChanged);
  }

  final LocationStore _locations;

  Map<String, dynamic>? _trends;
  Map<String, dynamic>? _indices;
  bool _loading = false;
  Object? _error;
  int _trendHours = 24;
  double? _lastLat;
  double? _lastLon;

  Map<String, dynamic>? get trends => _trends;
  Map<String, dynamic>? get indices => _indices;
  bool get loading => _loading;
  Object? get error => _error;
  int get trendHours => _trendHours;

  void _onDepsChanged() {
    final lat = _locations.activeLat;
    final lon = _locations.activeLon;
    if (lat == null || lon == null) return;
    if (lat != _lastLat || lon != _lastLon) {
      _lastLat = lat;
      _lastLon = lon;
      unawaited(refresh());
    }
  }

  Future<void> setTrendHours(int hours) async {
    if (hours == _trendHours) return;
    _trendHours = hours;
    notifyListeners();
    await _loadTrends();
  }

  Future<void> refresh() async {
    final lat = _locations.activeLat;
    final lon = _locations.activeLon;
    if (lat == null || lon == null) return;
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await Future.wait([
        _loadTrends(notify: false),
        _loadIndices(notify: false),
      ]);
    } catch (err) {
      _error = err;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> _loadTrends({bool notify = true}) async {
    final lat = _locations.activeLat;
    final lon = _locations.activeLon;
    if (lat == null || lon == null) return;
    _trends = await weatherApi.trends(lat, lon, hours: _trendHours);
    if (notify) notifyListeners();
  }

  Future<void> _loadIndices({bool notify = true}) async {
    final lat = _locations.activeLat;
    final lon = _locations.activeLon;
    if (lat == null || lon == null) return;
    _indices = await weatherApi.indices(lat, lon);
    if (notify) notifyListeners();
  }

  @override
  void dispose() {
    _locations.removeListener(_onDepsChanged);
    super.dispose();
  }
}