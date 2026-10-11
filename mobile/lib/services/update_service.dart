// lib/services/update_service.dart
import 'dart:async';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/app_version_api.dart';
import '../models/app_version_info.dart';
import '../utils/constants.dart';

class UpdateCheck {
  const UpdateCheck({
    required this.info,
    required this.installedVersion,
    required this.installedBuildNumber,
    required this.mandatory,
  });

  final AppVersionInfo info;
  final String installedVersion;
  final int installedBuildNumber;
  final bool mandatory;

  String get installedLabel => installedBuildNumber > 0
      ? '$installedVersion+$installedBuildNumber'
      : installedVersion;
}

enum UpdateErrorKind { network, server, storage, checksum, install, unknown }

enum UpdateStage {
  idle,
  downloading,
  verifying,
  ready,
  installing,
  installPrompted,
  failed,
}

class UpdateException implements Exception {
  const UpdateException(this.kind, this.message);

  final UpdateErrorKind kind;
  final String message;

  @override
  String toString() => message;
}

class UpdateService {
  UpdateService({AppVersionApi? api}) : _api = api ?? appVersionApi;

  final AppVersionApi _api;

  Future<UpdateCheck?> check({bool ignoreSkip = false}) async {
    final info = await _fetchSafely();
    if (info == null) return null;

    final PackageInfo package;
    try {
      package = await PackageInfo.fromPlatform();
    } catch (_) {
      return null;
    }

    final installedBuildNumber = int.tryParse(package.buildNumber.trim()) ?? 0;
    if (!_isOutdated(package.version, installedBuildNumber, info)) return null;

    final mandatory = _isMandatory(info, package.version);
    if (!mandatory && !ignoreSkip) {
      String? skipped;
      try {
        final prefs = await SharedPreferences.getInstance();
        skipped = prefs.getString(StorageKeys.updateSkippedRelease);
      } catch (_) {
        skipped = null;
      }
      if (skipped == info.releaseLabel) return null;
    }

    return UpdateCheck(
      info: info,
      installedVersion: package.version,
      installedBuildNumber: installedBuildNumber,
      mandatory: mandatory,
    );
  }

  Future<bool> skip(UpdateCheck check) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        StorageKeys.updateSkippedRelease,
        check.info.releaseLabel,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<AppVersionInfo?> _fetchSafely() async {
    try {
      return await _api.fetchLatest();
    } catch (_) {
      return null;
    }
  }
}

class UpdateDownloadController extends ChangeNotifier {
  UpdateDownloadController({http.Client? client})
      : _client = client ?? http.Client();

  static const MethodChannel _channel = MethodChannel('weatherly/install');

  /// Max wait for the server to start responding, and max gap between chunks.
  static const Duration _networkTimeout = Duration(seconds: 30);

  final http.Client _client;

  bool _disposed = false;
  UpdateStage _stage = UpdateStage.idle;
  double _progress = 0;
  UpdateErrorKind? _errorKind;
  String? _errorMessage;
  File? _file;

  UpdateStage get stage => _stage;
  double get progress => _progress;
  UpdateErrorKind? get errorKind => _errorKind;
  String? get errorMessage => _errorMessage;
  File? get file => _file;
  bool get busy =>
      _stage == UpdateStage.downloading || _stage == UpdateStage.verifying;

  Future<void> download(AppVersionInfo info) async {
    if (busy || _disposed) return;

    _stage = UpdateStage.downloading;
    _progress = 0;
    _errorKind = null;
    _errorMessage = null;
    _file = null;
    _notify();

    File? target;
    IOSink? sink;
    try {
      final directory = await getTemporaryDirectory();
      target = File('${directory.path}/${_fileNameFor(info.apkUrl)}');
      if (target.existsSync()) {
        await target.delete();
      }

      final request = http.Request('GET', info.apkUrl);
      final response = await _client.send(request).timeout(_networkTimeout);
      if (response.statusCode != HttpStatus.ok) {
        throw UpdateException(
          UpdateErrorKind.server,
          'The update server returned ${response.statusCode}. Please try again later.',
        );
      }

      final declared = response.contentLength;
      final expectedTotal =
          (declared != null && declared > 0) ? declared : info.fileSizeBytes;
      final digestSink = _DigestSink();
      final converter = sha256.startChunkedConversion(digestSink);
      sink = target.openWrite();

      var received = 0;
      var lastNotified = 0.0;
      await for (final chunk in response.stream.timeout(_networkTimeout)) {
        received += chunk.length;
        sink.add(chunk);
        converter.add(chunk);
        if (expectedTotal > 0) {
          final next = (received / expectedTotal).clamp(0.0, 1.0).toDouble();
          if (next - lastNotified >= 0.01) {
            lastNotified = next;
            _progress = next;
            _notify();
          }
        }
      }

      await sink.flush();
      await sink.close();
      sink = null;
      converter.close();

      _stage = UpdateStage.verifying;
      _notify();

      final actual = digestSink.digest?.toString().toLowerCase();
      if (actual == null || actual != info.sha256.toLowerCase()) {
        await target.delete();
        target = null;
        throw const UpdateException(
          UpdateErrorKind.checksum,
          'The downloaded file failed its integrity check and was removed.',
        );
      }

      _file = target;
      _progress = 1;
      _stage = UpdateStage.ready;
      _notify();
    } on UpdateException catch (error) {
      _fail(error.kind, error.message);
    } on SocketException {
      _fail(
        UpdateErrorKind.network,
        'The download was interrupted. Check your connection and try again.',
      );
    } on http.ClientException {
      _fail(
        UpdateErrorKind.network,
        'The download was interrupted. Check your connection and try again.',
      );
    } on TimeoutException {
      _fail(
        UpdateErrorKind.network,
        'The download timed out. Please try again.',
      );
    } on FileSystemException catch (error) {
      final noSpace = error.osError?.errorCode == 28 ||
          error.message.toLowerCase().contains('no space') ||
          error.message.toLowerCase().contains('enospc');
      _fail(
        UpdateErrorKind.storage,
        noSpace
            ? 'There is not enough free storage to download the update.'
            : 'The update file could not be saved on this device.',
      );
    } catch (_) {
      _fail(
        UpdateErrorKind.unknown,
        'The update could not be downloaded. Please try again.',
      );
    } finally {
      final pendingSink = sink;
      if (pendingSink != null) {
        await _attempt(pendingSink.close);
      }
      final pendingFile = target;
      if (_file == null && pendingFile != null) {
        await _attempt(() async {
          if (pendingFile.existsSync()) {
            await pendingFile.delete();
          }
        });
      }
    }
  }

  Future<void> install() async {
    final file = _file;
    if (file == null) return;
    if (!Platform.isAndroid) {
      _fail(
        UpdateErrorKind.install,
        'In-app installation is available on Android devices only.',
      );
      return;
    }

    _stage = UpdateStage.installing;
    _notify();

    try {
      await _channel.invokeMethod<void>(
        'installApk',
        <String, Object?>{'path': file.path},
      );
      _stage = UpdateStage.installPrompted;
      _notify();
    } catch (_) {
      _fail(
        UpdateErrorKind.install,
        'The system installer could not be opened. Allow this app to install unknown apps in Settings, then try again.',
      );
    }
  }

  Future<void> openInstallSettings() async {
    if (!Platform.isAndroid) return;
    await _attempt(
      () => _channel.invokeMethod<void>('openUnknownSourcesSettings'),
    );
  }

  void _notify() {
    if (_disposed) return;
    notifyListeners();
  }

  void _fail(UpdateErrorKind kind, String message) {
    _stage = UpdateStage.failed;
    _errorKind = kind;
    _errorMessage = message;
    _notify();
  }

  String _fileNameFor(Uri uri) {
    final last = uri.pathSegments.isNotEmpty ? uri.pathSegments.last : '';
    final cleaned = last.replaceAll(RegExp(r'[^A-Za-z0-9._-]'), '');
    if (cleaned.toLowerCase().endsWith('.apk')) return cleaned;
    return 'weatherly-update.apk';
  }

  @override
  void dispose() {
    _disposed = true;
    _client.close();
    super.dispose();
  }
}

class _DigestSink implements Sink<Digest> {
  Digest? digest;

  @override
  void add(Digest data) => digest = data;

  @override
  void close() {}
}

Future<bool> _attempt(Future<void> Function() action) async {
  try {
    await action();
    return true;
  } catch (_) {
    return false;
  }
}

List<int>? _parseVersion(String raw) {
  var cleaned = raw.trim();
  if (cleaned.isEmpty) return null;
  if (cleaned.startsWith('v') || cleaned.startsWith('V')) {
    cleaned = cleaned.substring(1);
  }
  cleaned = cleaned.split('-').first.split('+').first;
  if (cleaned.isEmpty) return null;
  final numbers = <int>[];
  for (final part in cleaned.split('.')) {
    final value = int.tryParse(part.trim());
    if (value == null || value < 0) return null;
    numbers.add(value);
  }
  return numbers.isEmpty ? null : numbers;
}

int _compareVersions(List<int> a, List<int> b) {
  final length = a.length > b.length ? a.length : b.length;
  for (var i = 0; i < length; i++) {
    final left = i < a.length ? a[i] : 0;
    final right = i < b.length ? b[i] : 0;
    if (left != right) return left < right ? -1 : 1;
  }
  return 0;
}

bool _isOutdated(
  String installedVersion,
  int installedBuildNumber,
  AppVersionInfo info,
) {
  final installed = _parseVersion(installedVersion);
  final latest = _parseVersion(info.latestVersion);
  if (installed != null && latest != null) {
    final comparison = _compareVersions(installed, latest);
    if (comparison < 0) return true;
    if (comparison > 0) return false;
  } else if (installedVersion.trim() != info.latestVersion.trim()) {
    return true;
  }
  return info.latestBuildNumber > installedBuildNumber;
}

bool _isMandatory(AppVersionInfo info, String installedVersion) {
  if (info.forceUpdate) return true;
  final installed = _parseVersion(installedVersion);
  final minimum = _parseVersion(info.minVersion);
  if (installed == null || minimum == null) return false;
  return _compareVersions(installed, minimum) < 0;
}