// lib/components/common/location_search_controller.dart
import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../api/locations_api.dart';

class LocationSearchController extends ChangeNotifier {
  LocationSearchController({this.limit = 8, Duration? debounce})
      : _debounce = debounce ?? const Duration(milliseconds: 320);

  final int limit;
  final Duration _debounce;

  Timer? _timer;
  int _requestId = 0;
  String _query = '';
  List<Map<String, dynamic>> _results = const <Map<String, dynamic>>[];
  bool _loading = false;

  String get query => _query;
  List<Map<String, dynamic>> get results => _results;
  bool get loading => _loading;

  void onChanged(String raw) {
    _query = raw;
    _timer?.cancel();
    final trimmed = raw.trim();
    if (trimmed.length < 2) {
      _requestId++;
      _results = const <Map<String, dynamic>>[];
      _loading = false;
      notifyListeners();
      return;
    }
    _timer = Timer(_debounce, () => _dispatch(trimmed));
  }

  Future<void> _dispatch(String q) async {
    final id = ++_requestId;
    _loading = true;
    notifyListeners();
    try {
      final res = await locationsApi.search(q, limit: limit);
      if (id != _requestId) return;
      _results = res;
    } catch (_) {
      if (id != _requestId) return;
      _results = const <Map<String, dynamic>>[];
    } finally {
      if (id == _requestId) {
        _loading = false;
        notifyListeners();
      }
    }
  }

  void clear() {
    _timer?.cancel();
    _requestId++;
    _query = '';
    _results = const <Map<String, dynamic>>[];
    _loading = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}