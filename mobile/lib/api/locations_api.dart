// lib/api/locations_api.dart
import 'api_client.dart';

class LocationsApi {
  LocationsApi(this._client);

  final ApiClient _client;
  static const _base = '/api/v1/locations';
  static const _maxQueryLength = 100;

  Future<Map<String, dynamic>> detect(Map<String, dynamic> data) async {
    final res = await _client.post('$_base/detect', body: data);
    return _asMap(res);
  }

  Future<List<Map<String, dynamic>>> search(
    String q, {
    int limit = 5,
    String? countryCode,
  }) async {
    final sanitized = _sanitize(q);
    if (sanitized.length < 2) return const <Map<String, dynamic>>[];
    final res = await _client.get('$_base/search', params: {
      'q': sanitized,
      'limit': limit,
      if (countryCode != null && countryCode.length == 2)
        'country_code': countryCode.toUpperCase(),
    });
    final data = _asMap(res)['data'];
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => e.cast<String, dynamic>())
          .toList();
    }
    return const <Map<String, dynamic>>[];
  }

  String _sanitize(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return '';
    final cleaned = trimmed.replaceAll(RegExp(r'[\x00-\x1F\x7F]'), '');
    if (cleaned.length > _maxQueryLength) {
      return cleaned.substring(0, _maxQueryLength);
    }
    return cleaned;
  }

  Map<String, dynamic> _asMap(dynamic res) {
    if (res is Map) {
      final body = res.cast<String, dynamic>();
      final data = body['data'];
      if (data is Map) return data.cast<String, dynamic>();
      return body;
    }
    return const <String, dynamic>{};
  }
}

final locationsApi = LocationsApi(apiClient);