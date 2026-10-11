// lib/providers/alerts_provider.dart
import 'dart:async';

import 'package:flutter/foundation.dart';

import '../api/weather_api.dart';
import '../stores/location_store.dart';

class AlertsProvider extends ChangeNotifier {
  AlertsProvider(this._locations) {
    _locations.addListener(_onDepsChanged);
  }

  final LocationStore _locations;
  List<Map<String, dynamic>> _alerts = [];
  Map<String, dynamic>? _pagination;
  Map<String, dynamic>? _stats;
  bool _loading = false;
  Object? _error;
  double _radiusKm = 50;
  int _page = 1;
  static const int _size = 20;
  double? _lastLat;
  double? _lastLon;

  List<Map<String, dynamic>> get alerts => List.unmodifiable(_alerts);
  Map<String, dynamic>? get pagination => _pagination;
  Map<String, dynamic>? get stats => _stats;
  bool get loading => _loading;
  Object? get error => _error;
  double get radiusKm => _radiusKm;
  int get page => _page;

  int get activeCount {
    final fromStats = (_stats?['total_active'] as num?)?.toInt();
    if (fromStats != null) return fromStats;
    final fromPagination = (_pagination?['total_items'] as num?)?.toInt();
    if (fromPagination != null) return fromPagination;
    return _alerts.length;
  }

  void _onDepsChanged() {
    final lat = _locations.activeLat;
    final lon = _locations.activeLon;
    if (lat == null || lon == null) return;
    if (lat != _lastLat || lon != _lastLon) {
      _lastLat = lat;
      _lastLon = lon;
      _resetPagination();
      unawaited(refresh());
    }
  }

  void _resetPagination() {
    _page = 1;
    _alerts = [];
    _pagination = null;
    _stats = null;
  }

  Future<void> setRadius(double value) async {
    if (value == _radiusKm) return;
    _radiusKm = value;
    _resetPagination();
    notifyListeners();
    await refresh();
  }

  Future<void> setPage(int value) async {
    if (value < 1 || value == _page) return;
    _page = value;
    notifyListeners();
    await refresh();
  }

  Future<void> refresh() async {
    final lat = _locations.activeLat;
    final lon = _locations.activeLon;
    if (lat == null || lon == null) return;
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        weatherApi.alerts(
          lat,
          lon,
          radiusKm: _radiusKm,
          page: _page,
          size: _size,
        ),
        weatherApi.alertStats(lat, lon, radiusKm: _radiusKm),
      ]);
      final data = results[0];
      final list = data['alerts'];
      final fetched = list is List
          ? list
              .whereType<Map>()
              .map((e) => e.cast<String, dynamic>())
              .toList()
          : <Map<String, dynamic>>[];

      if (_page <= 1) {
        _alerts = fetched;
      } else {
        final known = <String>{};
        for (final alert in _alerts) {
          final id = alert['id'];
          if (id != null) known.add(id.toString());
        }
        final appended = <Map<String, dynamic>>[];
        for (final alert in fetched) {
          final id = alert['id'];
          if (id != null && known.contains(id.toString())) continue;
          appended.add(alert);
        }
        _alerts = [..._alerts, ...appended];
      }

      final pag = data['pagination'];
      _pagination = pag is Map ? pag.cast<String, dynamic>() : null;
      _stats = results[1];
    } catch (err) {
      _error = err;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Map<String, dynamic>? get criticalAlert {
    for (final a in _alerts) {
      final sev = (a['severity'] ?? '').toString().toLowerCase();
      if (sev == 'extreme' || sev == 'severe') return a;
    }
    return null;
  }

  @override
  void dispose() {
    _locations.removeListener(_onDepsChanged);
    super.dispose();
  }
}