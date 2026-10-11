// lib/api/app_version_api.dart
import '../models/app_version_info.dart';
import 'api_client.dart';

class AppVersionApi {
  AppVersionApi(this._client);

  final ApiClient _client;

  Future<AppVersionInfo?> fetchLatest() async {
    final response = await _client.get('/api/v1/app/version');
    if (response is! Map) return null;
    final body = response.cast<String, dynamic>();
    final data = body['data'];
    if (data is! Map) return null;
    return AppVersionInfo.fromJson(data.cast<String, dynamic>());
  }
}

final appVersionApi = AppVersionApi(apiClient);