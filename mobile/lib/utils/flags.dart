// lib/utils/flags.dart
String? getFlagEmoji(String? countryCode) {
  if (countryCode == null || countryCode.length != 2) return null;
  final code = countryCode.toUpperCase();
  return String.fromCharCodes(code.runes.map((c) => 127397 + c));
}