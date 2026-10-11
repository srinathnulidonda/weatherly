// lib/stores/location_store.dart
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../utils/constants.dart';

class LocationStore extends ChangeNotifier {
  Map<String, dynamic>? _location;
  bool _locationConfirmed = false;
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _savedLocations = [];
  String _activeLocationId = 'current';

  Map<String, dynamic>? get location => _location;
  bool get locationConfirmed => _locationConfirmed;
  bool get loading => _loading;
  String? get error => _error;
  List<Map<String, dynamic>> get savedLocations =>
      List.unmodifiable(_savedLocations);
  String get activeLocationId => _activeLocationId;

  double? get activeLat {
    if (_activeLocationId != 'current') {
      final found = _findSaved(_activeLocationId);
      if (found != null) return (found['latitude'] as num?)?.toDouble();
    }
    if (_location != null && _locationConfirmed) {
      return (_location!['latitude'] as num?)?.toDouble();
    }
    return null;
  }

  double? get activeLon {
    if (_activeLocationId != 'current') {
      final found = _findSaved(_activeLocationId);
      if (found != null) return (found['longitude'] as num?)?.toDouble();
    }
    if (_location != null && _locationConfirmed) {
      return (_location!['longitude'] as num?)?.toDouble();
    }
    return null;
  }

  bool get ready => activeLat != null && activeLon != null;

  bool get isCurrentActive => _activeLocationId == 'current';

  String get activeLabel {
    if (_activeLocationId != 'current') {
      final found = _findSaved(_activeLocationId);
      if (found != null) {
        return (found['city'] ?? found['name'] ?? 'Unknown').toString();
      }
    }
    if (_location != null && _locationConfirmed) {
      final city = _location!['city'];
      if (city != null && city.toString().isNotEmpty) return city.toString();
      final name = _location!['name'];
      if (name != null && name.toString().isNotEmpty) return name.toString();
      final address = _location!['formatted_address'];
      if (address != null && address.toString().isNotEmpty) {
        return address.toString();
      }
      final lat = (_location!['latitude'] as num?)?.toDouble();
      final lon = (_location!['longitude'] as num?)?.toDouble();
      if (lat != null && lon != null) {
        return '${lat.toStringAsFixed(1)}, ${lon.toStringAsFixed(1)}';
      }
    }
    return 'Set location';
  }

  Map<String, dynamic>? _findSaved(String id) {
    for (final l in _savedLocations) {
      if (l['id'] == id) return l;
    }
    return null;
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final rawLocation = prefs.getString(StorageKeys.confirmedLocation);
    if (rawLocation != null && rawLocation.isNotEmpty) {
      try {
        final parsed = jsonDecode(rawLocation);
        if (parsed is Map &&
            parsed['latitude'] is num &&
            parsed['longitude'] is num) {
          _location = parsed.cast<String, dynamic>();
        }
      } catch (_) {
        await prefs.remove(StorageKeys.confirmedLocation);
      }
    }
    final userConfirmed =
        prefs.getBool(StorageKeys.locationUserConfirmed) ?? false;
    final isPrecise = _location?['is_precise'] == true;
    final isManual = _location?['detection_method'] == 'manual_city';
    _locationConfirmed =
        _location != null && (userConfirmed || isPrecise || isManual);

    final rawSaved = prefs.getString(StorageKeys.savedLocations);
    if (rawSaved != null && rawSaved.isNotEmpty) {
      try {
        final parsed = jsonDecode(rawSaved);
        if (parsed is List) {
          _savedLocations = parsed
              .whereType<Map>()
              .map((e) => e.cast<String, dynamic>())
              .toList();
        }
      } catch (_) {}
    }
    _activeLocationId = prefs.getString(StorageKeys.activeLocation) ?? 'current';
    notifyListeners();
  }

  Future<void> setLocation(Map<String, dynamic>? location) async {
    if (location == null) {
      await clearLocation();
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    final isPrecise = location['is_precise'] == true;
    final isManual = location['detection_method'] == 'manual_city';
    final userPreviouslyConfirmed =
        prefs.getBool(StorageKeys.locationUserConfirmed) ?? false;
    final confirmed =
        isPrecise || isManual || _locationConfirmed || userPreviouslyConfirmed;
    final next = <String, dynamic>{
      'latitude': (location['latitude'] as num).toDouble(),
      'longitude': (location['longitude'] as num).toDouble(),
      'city': location['city'],
      'state': location['state'],
      'country': location['country'],
      'country_code': location['country_code'],
      'timezone': location['timezone'],
      'is_precise': isPrecise,
      'confidence': location['confidence'] ?? 0,
      'detection_method': location['detection_method'] ?? 'unknown',
      'source': location['source'] ?? 'manual',
      'formatted_address': location['formatted_address'],
      'accuracy_m': location['accuracy_m'],
    };
    _location = next;
    _loading = false;
    _error = null;
    _locationConfirmed = confirmed;
    notifyListeners();

    if (confirmed) {
      await prefs.setString(StorageKeys.confirmedLocation, jsonEncode(next));
      await prefs.setBool(StorageKeys.locationUserConfirmed, true);
    }
  }

  void setLoading(bool value) {
    _loading = value;
    if (value) _error = null;
    notifyListeners();
  }

  void setError(String? message) {
    _error = message;
    _loading = false;
    notifyListeners();
  }

  Future<void> clearLocation() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(StorageKeys.confirmedLocation);
    await prefs.remove(StorageKeys.locationUserConfirmed);
    _location = null;
    _locationConfirmed = false;
    _error = null;
    _loading = false;
    notifyListeners();
  }

  Future<String> addSavedLocation(Map<String, dynamic> loc) async {
    final lat = (loc['latitude'] as num).toDouble();
    final lon = (loc['longitude'] as num).toDouble();
    final id = '${lat.toStringAsFixed(4)},${lon.toStringAsFixed(4)}';
    if (!_savedLocations.any((l) => l['id'] == id)) {
      final entry = <String, dynamic>{
        'id': id,
        'latitude': lat,
        'longitude': lon,
        'city': loc['city'] ?? loc['name'],
        'state': loc['state'],
        'country': loc['country'],
        'country_code': loc['country_code'],
        'timezone': loc['timezone'],
      };
      _savedLocations = [..._savedLocations, entry];
      notifyListeners();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        StorageKeys.savedLocations,
        jsonEncode(_savedLocations),
      );
    }
    return id;
  }

  Future<void> removeSavedLocation(String id) async {
    _savedLocations = _savedLocations.where((l) => l['id'] != id).toList();
    if (_activeLocationId == id) _activeLocationId = 'current';
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      StorageKeys.savedLocations,
      jsonEncode(_savedLocations),
    );
    await prefs.setString(StorageKeys.activeLocation, _activeLocationId);
  }

  Future<void> setActiveLocationId(String id) async {
    _activeLocationId = id;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.activeLocation, id);
  }
}