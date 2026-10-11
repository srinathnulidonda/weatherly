// lib/providers/location_provider.dart
import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../api/locations_api.dart';
import '../stores/location_store.dart';

class LocationProvider extends ChangeNotifier {
  LocationProvider(this._store) {
    _store.addListener(_onStoreChanged);
  }

  final LocationStore _store;
  StreamSubscription<Position>? _watchSub;
  Position? _lastKnown;
  DateTime? _cacheTimestamp;
  double? _cacheLat;
  double? _cacheLon;
  double? _cacheAccuracy;
  bool _initialized = false;

  LocationStore get store => _store;
  double? get lat => _store.activeLat;
  double? get lon => _store.activeLon;

  void _onStoreChanged() => notifyListeners();

  String _precisionLabel(double? accuracy) {
    if (accuracy == null) return 'low';
    if (accuracy <= 10) return 'exact';
    if (accuracy <= 100) return 'high';
    if (accuracy <= 1000) return 'medium';
    return 'low';
  }

  double _confidenceForAccuracy(double? accuracy) {
    if (accuracy == null) return 0.4;
    if (accuracy <= 10) return 0.99;
    if (accuracy <= 25) return 0.95;
    if (accuracy <= 50) return 0.90;
    if (accuracy <= 100) return 0.80;
    if (accuracy <= 200) return 0.60;
    return 0.40;
  }

  bool _isCacheValid({Duration maxAge = const Duration(minutes: 15)}) {
    if (_cacheTimestamp == null || _cacheLat == null || _cacheLon == null) {
      return false;
    }
    return DateTime.now().difference(_cacheTimestamp!) <= maxAge;
  }

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    if (_store.location != null) return;
    if (!await _hasPermission()) return;
    unawaited(detectLocation(highAccuracy: true));
  }

  Future<bool> _hasPermission() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return false;
      final permission = await Geolocator.checkPermission();
      return permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _ensurePermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  Future<Position?> _getPosition({required bool highAccuracy}) async {
    final granted = await _ensurePermission();
    if (!granted) return null;
    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy:
            highAccuracy ? LocationAccuracy.best : LocationAccuracy.high,
        timeLimit: Duration(seconds: highAccuracy ? 15 : 10),
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> detectLocation({
    bool force = false,
    bool highAccuracy = false,
  }) async {
    if (_store.loading) return;

    if (!force &&
        !highAccuracy &&
        _isCacheValid() &&
        _cacheLat != null &&
        _cacheLon != null) {
      await _store.setLocation({
        'latitude': _cacheLat,
        'longitude': _cacheLon,
        'accuracy_m': _cacheAccuracy,
        'source': 'cached',
        'precision': _precisionLabel(_cacheAccuracy),
        'confidence': 0.9,
        'detection_method': 'cache',
        'is_precise': (_cacheAccuracy ?? double.infinity) <= 100,
      });
      return;
    }

    _store.setLoading(true);
    _store.setError(null);

    try {
      final position = await _getPosition(highAccuracy: highAccuracy);
      if (position != null) {
        final detected = await locationsApi.detect(<String, dynamic>{
          'browser_latitude': position.latitude,
          'browser_longitude': position.longitude,
          'browser_accuracy_m': position.accuracy,
          'timezone_hint': DateTime.now().timeZoneName,
        });
        final accuracy = position.accuracy;
        await _store.setLocation({
          ...detected,
          'accuracy_m': accuracy,
          'precision': _precisionLabel(accuracy),
          'confidence': _confidenceForAccuracy(accuracy),
        });
        _cacheTimestamp = DateTime.now();
        _cacheLat = position.latitude;
        _cacheLon = position.longitude;
        _cacheAccuracy = accuracy;
        _lastKnown = position;
        unawaited(startWatching());
        return;
      }

      final ipResult = await locationsApi.detect(<String, dynamic>{
        'timezone_hint': DateTime.now().timeZoneName,
      });
      final accuracyKm = (ipResult['accuracy_km'] as num?)?.toDouble() ?? 50;
      await _store.setLocation({
        ...ipResult,
        'accuracy_m': accuracyKm * 1000,
        'precision': 'approximate',
        'confidence': ipResult['confidence'] ?? 0.3,
        'detection_method': 'ip_geolocation',
        'is_precise': false,
      });
    } catch (_) {
      _store.setError(
        'Could not detect your location. Please search for your city manually or enable device location services.',
      );
    } finally {
      _store.setLoading(false);
    }
  }

  Future<void> submitFallbackCity(String cityName, {String? countryCode}) async {
    final trimmed = cityName.trim();
    if (trimmed.length < 2) return;
    _store.setLoading(true);
    try {
      final payload = <String, dynamic>{
        'fallback_city': trimmed,
        'timezone_hint': DateTime.now().timeZoneName,
      };
      if (countryCode != null) payload['fallback_country_code'] = countryCode;
      final response = await locationsApi.detect(payload);
      await _store.setLocation(response);
      await stopWatching();
    } catch (_) {
      _store.setError('Could not find "$trimmed". Please check the spelling.');
    } finally {
      _store.setLoading(false);
    }
  }

  Future<void> refreshLocation() async {
    await _store.clearLocation();
    await stopWatching();
    await detectLocation(force: true, highAccuracy: true);
  }

  Future<void> setManualLocation(
    double lat,
    double lon, {
    Map<String, dynamic>? meta,
  }) async {
    await stopWatching();
    await _store.setLocation({
      'latitude': lat,
      'longitude': lon,
      'is_precise': true,
      'confidence': 0.95,
      'detection_method': 'manual_city',
      'source': 'manual',
      'accuracy_m': 5,
      'precision': 'exact',
      if (meta != null) ...meta,
    });
  }

  Future<void> startWatching() async {
    final current = _store.location;
    if (current == null) return;
    final method = current['detection_method'];
    final source = current['source'];
    if (method == 'manual_city' ||
        source == 'manual' ||
        method == 'ip_geolocation') {
      return;
    }

    final granted = await _ensurePermission();
    if (!granted) return;

    await _watchSub?.cancel();
    _watchSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: 100,
      ),
    ).listen((position) {
      final prev = _lastKnown;
      final moved = prev == null ||
          Geolocator.distanceBetween(
                prev.latitude,
                prev.longitude,
                position.latitude,
                position.longitude,
              ) >
              100;
      if (!moved) return;
      final base = _store.location ?? const <String, dynamic>{};
      _store.setLocation({
        ...base,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'accuracy_m': position.accuracy,
        'detection_method': 'gps_watch',
        'lastUpdated': DateTime.now().toIso8601String(),
      });
      _lastKnown = position;
      _cacheLat = position.latitude;
      _cacheLon = position.longitude;
      _cacheAccuracy = position.accuracy;
      _cacheTimestamp = DateTime.now();
    }, onError: (_) {});
  }

  Future<void> stopWatching() async {
    await _watchSub?.cancel();
    _watchSub = null;
  }

  @override
  void dispose() {
    _store.removeListener(_onStoreChanged);
    _watchSub?.cancel();
    super.dispose();
  }
}