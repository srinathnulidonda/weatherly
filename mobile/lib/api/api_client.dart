// lib/api/api_client.dart
import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  ApiException(
    this.message, {
    this.code = 'API_ERROR',
    this.status = 0,
    this.retryAfter,
    this.details = const {},
  });

  final String message;
  final String code;
  final int status;
  final int? retryAfter;
  final Map<String, dynamic> details;

  bool get isNetwork => code == 'NETWORK_ERROR' || code == 'TIMEOUT';
  bool get isRateLimited => code == 'RATE_LIMIT_EXCEEDED' || status == 429;
  bool get isUnauthorized =>
      code == 'UNAUTHORIZED' || status == 401 || status == 403;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({
    String? baseUrl,
    Duration? timeout,
    http.Client? client,
    Map<String, String> Function()? authHeaders,
    int maxRetries = 2,
  })  : baseUrl = baseUrl ??
            const String.fromEnvironment(
              'API_URL',
              defaultValue: 'https://getweatherly.onrender.com',
            ),
        timeout = timeout ?? const Duration(seconds: 30),
        _client = client ?? http.Client(),
        _authHeaders = authHeaders,
        _maxRetries = maxRetries;

  final String baseUrl;
  final Duration timeout;
  final int _maxRetries;
  final http.Client _client;
  final Map<String, String> Function()? _authHeaders;

  static const Map<String, String> _baseHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  Map<String, String> _headers() {
    final extra = _authHeaders?.call();
    if (extra == null || extra.isEmpty) {
      return _baseHeaders;
    }
    return <String, String>{..._baseHeaders, ...extra};
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? params}) {
    return _send(
      (uri) => _client.get(uri, headers: _headers()),
      path,
      params,
    );
  }

  Future<dynamic> post(String path, {Object? body, Map<String, dynamic>? params}) {
    final encoded = jsonEncode(body ?? const <String, dynamic>{});
    return _send(
      (uri) => _client.post(uri, headers: _headers(), body: encoded),
      path,
      params,
    );
  }

  Future<dynamic> _send(
    Future<http.Response> Function(Uri uri) call,
    String path,
    Map<String, dynamic>? params,
  ) async {
    final uri = _buildUri(path, params);
    Object? lastError;
    for (var attempt = 0; attempt <= _maxRetries; attempt++) {
      if (attempt > 0) {
        await Future<void>.delayed(_backoff(attempt));
      }
      try {
        final res = await call(uri).timeout(timeout);
        if (res.statusCode >= 500 &&
            res.statusCode < 600 &&
            attempt < _maxRetries) {
          lastError = ApiException(
            'Server error (${res.statusCode}). Please try again.',
            code: 'SERVER_ERROR',
            status: res.statusCode,
          );
          continue;
        }
        return _handle(res);
      } on TimeoutException {
        lastError = ApiException(
          'Request timed out. Please check your connection and try again.',
          code: 'TIMEOUT',
        );
        if (attempt < _maxRetries) continue;
        throw lastError;
      } on ApiException catch (e) {
        if (!e.isNetwork) rethrow;
        lastError = e;
        if (attempt < _maxRetries) continue;
        rethrow;
      } catch (_) {
        lastError = ApiException(
          'Network error. Please check your internet connection.',
          code: 'NETWORK_ERROR',
        );
        if (attempt < _maxRetries) continue;
        throw lastError;
      }
    }
    throw lastError ??
        ApiException(
          'Network error. Please check your internet connection.',
          code: 'NETWORK_ERROR',
        );
  }

  Duration _backoff(int attempt) {
    final base = 250 * pow(2, attempt - 1).toInt();
    final jitter = Random().nextInt(120);
    return Duration(milliseconds: base + jitter);
  }

  Uri _buildUri(String path, Map<String, dynamic>? params) {
    final clean = <String, String>{};
    if (params != null) {
      params.forEach((k, v) {
        if (v == null) return;
        clean[k] = _stringify(v as Object);
      });
    }
    final base = Uri.parse('$baseUrl$path');
    if (clean.isEmpty) return base;
    return base.replace(queryParameters: clean);
  }

  String _stringify(Object value) {
    if (value is double) {
      if (value == value.truncateToDouble()) {
        return value.toInt().toString();
      }
      return value.toString();
    }
    if (value is bool) return value ? 'true' : 'false';
    return value.toString();
  }

  dynamic _handle(http.Response res) {
    dynamic decoded;
    if (res.body.isNotEmpty) {
      try {
        decoded = jsonDecode(res.body);
      } catch (_) {
        decoded = null;
      }
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return decoded;
    }
    final map = decoded is Map
        ? decoded.cast<String, dynamic>()
        : const <String, dynamic>{};
    if (res.statusCode == 429) {
      final retryHeader = res.headers['retry-after'];
      final retry = retryHeader != null ? int.tryParse(retryHeader) : null;
      throw ApiException(
        map['message']?.toString() ??
            'Rate limit exceeded. Please wait before trying again.',
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429,
        retryAfter: retry ?? 60,
      );
    }
    if (res.statusCode == 401 || res.statusCode == 403) {
      throw ApiException(
        map['message']?.toString() ??
            'Access denied. Please refresh the page or contact support.',
        code: 'UNAUTHORIZED',
        status: res.statusCode,
      );
    }
    final rawDetails = map['details'];
    throw ApiException(
      map['message']?.toString() ??
          'Request failed with status ${res.statusCode}',
      code: map['error_code']?.toString() ?? 'API_ERROR',
      status: res.statusCode,
      details: rawDetails is Map
          ? rawDetails.cast<String, dynamic>()
          : const <String, dynamic>{},
    );
  }

  void dispose() {
    _client.close();
  }
}

final apiClient = ApiClient();