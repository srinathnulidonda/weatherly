// lib/utils/datetime_utils.dart
import 'package:intl/intl.dart';

DateTime? _safeParse(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is int) {
    return DateTime.fromMillisecondsSinceEpoch(value * 1000, isUtc: true).toLocal();
  }
  if (value is String) {
    if (value.isEmpty) return null;
    final iso = DateTime.tryParse(value);
    if (iso != null) return iso;
    final bare = RegExp(r'^(\d{1,2}):(\d{2})\s*(am|pm)?$', caseSensitive: false)
        .firstMatch(value);
    if (bare != null) {
      var h = int.parse(bare.group(1)!);
      final m = int.parse(bare.group(2)!);
      final ampm = bare.group(3)?.toLowerCase();
      if (ampm == 'pm' && h != 12) h += 12;
      if (ampm == 'am' && h == 12) h = 0;
      final now = DateTime.now();
      return DateTime(now.year, now.month, now.day, h, m);
    }
    return null;
  }
  return null;
}

String formatDate(dynamic value, {String fmt = 'MMM d'}) {
  final d = _safeParse(value);
  if (d == null) return '--';
  return DateFormat(fmt).format(d.toLocal());
}

String formatTime(dynamic value, {String fmt = 'h:mm a'}) {
  final d = _safeParse(value);
  if (d == null) return '--';
  return DateFormat(fmt).format(d.toLocal());
}

String formatHour(dynamic value) {
  final d = _safeParse(value);
  if (d == null) return '--';
  return DateFormat('h a').format(d.toLocal()).replaceAll(' ', '').toLowerCase();
}

String formatDay(dynamic value, {DateTime? now}) {
  final d = _safeParse(value);
  if (d == null) return '--';
  final local = d.toLocal();
  final reference = now ?? DateTime.now();
  final today = DateTime(reference.year, reference.month, reference.day);
  final target = DateTime(local.year, local.month, local.day);
  final diff = target.difference(today).inDays;
  if (diff == 0) return 'Today';
  if (diff == 1) return 'Tomorrow';
  return DateFormat('EEE').format(local);
}

String formatRelative(dynamic value) {
  final d = _safeParse(value);
  if (d == null) return '--';
  final diff = DateTime.now().difference(d);
  final secs = diff.inSeconds.abs();
  if (secs < 60) return 'just now';
  final mins = diff.inMinutes.abs();
  if (mins < 60) return diff.isNegative ? 'in ${mins}m' : '${mins}m ago';
  final hours = diff.inHours.abs();
  if (hours < 24) return diff.isNegative ? 'in ${hours}h' : '${hours}h ago';
  final days = diff.inDays.abs();
  return diff.isNegative ? 'in ${days}d' : '${days}d ago';
}