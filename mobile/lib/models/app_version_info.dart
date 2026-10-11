// lib/models/app_version_info.dart
class AppVersionInfo {
  const AppVersionInfo({
    required this.latestVersion,
    required this.latestBuildNumber,
    required this.minVersion,
    required this.forceUpdate,
    required this.apkUrl,
    required this.sha256,
    required this.fileSizeBytes,
    required this.changelog,
    required this.releasedAt,
  });

  final String latestVersion;
  final int latestBuildNumber;
  final String minVersion;
  final bool forceUpdate;
  final Uri apkUrl;
  final String sha256;
  final int fileSizeBytes;
  final List<String> changelog;
  final DateTime? releasedAt;

  String get releaseLabel => '$latestVersion+$latestBuildNumber';

  static final RegExp _sha256Pattern = RegExp(r'^[0-9a-f]{64}$');

  static AppVersionInfo? fromJson(Map<String, dynamic> json) {
    final version = json['latest_version'];
    final buildNumber = json['latest_build_number'];
    final minVersion = json['min_version'];
    final forceUpdate = json['force_update'];
    final apkUrl = json['apk_url'];
    final sha256 = json['sha256'];
    final fileSize = json['file_size_bytes'];

    if (version is! String || version.trim().isEmpty) return null;
    if (buildNumber is! int || buildNumber < 0) return null;
    if (forceUpdate is! bool) return null;
    if (apkUrl is! String) return null;
    final uri = Uri.tryParse(apkUrl);
    if (uri == null || uri.scheme.toLowerCase() != 'https' || uri.host.isEmpty) return null;
    if (sha256 is! String || !_sha256Pattern.hasMatch(sha256)) return null;
    if (fileSize is! int || fileSize <= 0) return null;

    final rawChangelog = json['changelog'];
    final changelog = rawChangelog is List
        ? rawChangelog
            .whereType<String>()
            .map((entry) => entry.trim())
            .where((entry) => entry.isNotEmpty)
            .toList(growable: false)
        : const <String>[];

    final rawReleasedAt = json['released_at'];
    final releasedAt = rawReleasedAt is String ? DateTime.tryParse(rawReleasedAt) : null;

    return AppVersionInfo(
      latestVersion: version.trim(),
      latestBuildNumber: buildNumber,
      minVersion: minVersion is String ? minVersion.trim() : '',
      forceUpdate: forceUpdate,
      apkUrl: uri,
      sha256: sha256,
      fileSizeBytes: fileSize,
      changelog: changelog,
      releasedAt: releasedAt,
    );
  }
}