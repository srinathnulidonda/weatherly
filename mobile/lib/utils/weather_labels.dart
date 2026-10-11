// lib/utils/weather_labels.dart
import 'package:flutter/material.dart';

import '../theme/color_tokens.dart';

class AqiInfo {
  const AqiInfo({required this.label, required this.color});
  final String label;
  final Color color;
}

class UvInfo {
  const UvInfo({
    required this.label,
    required this.color,
    required this.category,
  });
  final String label;
  final Color color;
  final String category;
}

AqiInfo getAqiInfo(num? aqi) {
  final token = getAqiToken(aqi);
  return AqiInfo(label: token.label, color: token.color);
}

UvInfo getUvInfo(num? uv) {
  final token = getUvToken(uv);
  return UvInfo(label: token.label, color: token.color, category: token.category);
}

String getWindLabel(num? deg) {
  if (deg == null) return '--';
  const dirs = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  final idx = ((deg / 22.5).round() % 16 + 16) % 16;
  return dirs[idx];
}

String capitalize(String? value) {
  if (value == null || value.isEmpty) return '';
  return value[0].toUpperCase() + value.substring(1);
}

String formatCondition(dynamic condition) {
  if (condition == null) return 'Unknown';
  if (condition is String) return capitalize(condition);
  if (condition is Map) {
    final desc = condition['description'] ?? condition['main'];
    if (desc == null) return 'Unknown';
    return capitalize(desc.toString());
  }
  return 'Unknown';
}

double? normalizePrecipProbability(dynamic value) {
  if (value == null) return null;
  final n = value is num ? value.toDouble() : double.tryParse(value.toString());
  if (n == null || n.isNaN) return null;
  final pct = n >= 0 && n <= 1 ? n * 100 : n;
  return pct.clamp(0, 100).toDouble();
}

double? getPrecipChance(Map<String, dynamic>? entry) {
  if (entry == null) return null;
  final pop = entry['pop'];
  if (pop != null) return normalizePrecipProbability(pop);
  final precipitation = entry['precipitation'];
  if (precipitation is Map && precipitation['probability'] != null) {
    return normalizePrecipProbability(precipitation['probability']);
  }
  return null;
}