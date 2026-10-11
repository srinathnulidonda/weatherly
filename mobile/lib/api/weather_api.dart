// lib/api/weather_api.dart
import 'api_client.dart';

class WeatherApi {
  WeatherApi(this._client);

  final ApiClient _client;
  static const _w = '/api/v1/weather';
  static const _a = '/api/v1/analytics';

  Future<Map<String, dynamic>> current(
    double lat,
    double lon, {
    String units = 'metric',
    String source = 'manual',
    String precision = 'medium',
  }) {
    return _getMap('$_w/current', {
      'lat': lat,
      'lon': lon,
      'units': units,
      'source': source,
      'precision': precision,
    });
  }

  Future<Map<String, dynamic>> forecast(
    double lat,
    double lon, {
    int days = 7,
    String units = 'metric',
    bool hourly = false,
  }) {
    return _getMap('$_w/forecast', {
      'lat': lat,
      'lon': lon,
      'days': days,
      'units': units,
      'hourly': hourly,
    });
  }

  Future<Map<String, dynamic>> history(
    double lat,
    double lon,
    String startDate,
    String endDate, {
    String units = 'metric',
  }) {
    return _getMap('$_w/history', {
      'lat': lat,
      'lon': lon,
      'start_date': startDate,
      'end_date': endDate,
      'units': units,
    });
  }

  Future<Map<String, dynamic>> alerts(
    double lat,
    double lon, {
    double radiusKm = 50,
    List<String>? severity,
    bool activeOnly = true,
    int page = 1,
    int size = 20,
  }) {
    return _getMap('$_w/alerts', {
      'lat': lat,
      'lon': lon,
      'radius_km': radiusKm,
      'active_only': activeOnly,
      'page': page,
      'size': size,
      if (severity != null && severity.isNotEmpty) 'severity': severity.join(','),
    });
  }

  Future<Map<String, dynamic>> airQuality(double lat, double lon) {
    return _getMap('$_w/air-quality', {'lat': lat, 'lon': lon});
  }

  Future<Map<String, dynamic>> trends(double lat, double lon, {int hours = 24}) {
    return _getMap('$_a/trends', {'lat': lat, 'lon': lon, 'hours': hours});
  }

  Future<Map<String, dynamic>> compare(
    List<Map<String, dynamic>> locations, {
    String units = 'metric',
  }) async {
    final res = await _client.post(
      '$_a/compare',
      body: {
        'locations': locations
            .map((location) => {
                  'latitude': location['latitude'],
                  'longitude': location['longitude'],
                })
            .toList(),
        'units': units,
      },
    );
    return _extractMap(res);
  }

  Future<Map<String, dynamic>> indices(double lat, double lon) {
    return _getMap('$_a/indices', {'lat': lat, 'lon': lon});
  }

  Future<Map<String, dynamic>> insights(double lat, double lon) {
    return _getMap('$_a/insights', {'lat': lat, 'lon': lon});
  }

  Future<Map<String, dynamic>> alertStats(
    double lat,
    double lon, {
    double radiusKm = 50,
  }) {
    return _getMap('$_a/alert-stats', {
      'lat': lat,
      'lon': lon,
      'radius_km': radiusKm,
    });
  }

  Future<Map<String, dynamic>> _getMap(String path, Map<String, dynamic> params) async {
    final res = await _client.get(path, params: params);
    return _extractMap(res);
  }

  Map<String, dynamic> _extractMap(dynamic res) {
    if (res is Map) {
      final body = res.cast<String, dynamic>();
      final data = body['data'];
      if (data is Map) return data.cast<String, dynamic>();
      return body;
    }
    return const <String, dynamic>{};
  }
}

final weatherApi = WeatherApi(apiClient);