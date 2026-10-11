// lib/theme/color_tokens.dart
import 'package:flutter/material.dart';

class SeverityToken {
  const SeverityToken({required this.color, required this.label});
  final Color color;
  final String label;
}

const Map<String, SeverityToken> severityTokens = {
  'extreme': SeverityToken(color: Color(0xFFDC2626), label: 'Extreme'),
  'severe': SeverityToken(color: Color(0xFFEA580C), label: 'Severe'),
  'moderate': SeverityToken(color: Color(0xFFD97706), label: 'Moderate'),
  'minor': SeverityToken(color: Color(0xFF6B7280), label: 'Minor'),
  'unknown': SeverityToken(color: Color(0xFF9CA3AF), label: 'Unknown'),
};

const Set<String> criticalSeverities = {'extreme', 'severe'};

class AqiToken {
  const AqiToken({required this.max, required this.color, required this.label});
  final num max;
  final Color color;
  final String label;
}

const List<AqiToken> aqiTokens = [
  AqiToken(max: 50, color: Color(0xFF10B981), label: 'Good'),
  AqiToken(max: 100, color: Color(0xFF84CC16), label: 'Moderate'),
  AqiToken(max: 150, color: Color(0xFFD97706), label: 'Unhealthy for Sensitive Groups'),
  AqiToken(max: 200, color: Color(0xFFDC2626), label: 'Unhealthy'),
  AqiToken(max: 300, color: Color(0xFF991B1B), label: 'Very Unhealthy'),
  AqiToken(max: double.infinity, color: Color(0xFF7F1D1D), label: 'Hazardous'),
];

class UvToken {
  const UvToken({
    required this.max,
    required this.color,
    required this.label,
    required this.category,
  });
  final num max;
  final Color color;
  final String label;
  final String category;
}

const List<UvToken> uvTokens = [
  UvToken(max: 2, color: Color(0xFF10B981), label: 'Low', category: 'low'),
  UvToken(max: 5, color: Color(0xFF84CC16), label: 'Moderate', category: 'moderate'),
  UvToken(max: 7, color: Color(0xFFD97706), label: 'High', category: 'high'),
  UvToken(max: 10, color: Color(0xFFDC2626), label: 'Very High', category: 'very_high'),
  UvToken(max: double.infinity, color: Color(0xFF991B1B), label: 'Extreme', category: 'extreme'),
];

class GaugeToken {
  const GaugeToken({required this.min, required this.color, required this.label});
  final num min;
  final Color color;
  final String label;
}

const List<GaugeToken> gaugeTokens = [
  GaugeToken(min: 80, color: Color(0xFF10B981), label: 'Excellent'),
  GaugeToken(min: 60, color: Color(0xFF84CC16), label: 'Good'),
  GaugeToken(min: 40, color: Color(0xFFD97706), label: 'Fair'),
  GaugeToken(min: 20, color: Color(0xFFDC2626), label: 'Poor'),
  GaugeToken(min: double.negativeInfinity, color: Color(0xFF991B1B), label: 'Bad'),
];

class PollutantInfo {
  const PollutantInfo({
    required this.label,
    required this.unit,
    required this.safe,
  });
  final String label;
  final String unit;
  final double safe;
}

const Map<String, PollutantInfo> pollutantTokens = {
  'pm2_5': PollutantInfo(label: 'PM2.5', unit: 'μg/m³', safe: 12),
  'pm10': PollutantInfo(label: 'PM10', unit: 'μg/m³', safe: 54),
  'o3': PollutantInfo(label: 'O₃', unit: 'ppb', safe: 54),
  'no2': PollutantInfo(label: 'NO₂', unit: 'ppb', safe: 53),
  'so2': PollutantInfo(label: 'SO₂', unit: 'ppb', safe: 35),
  'co': PollutantInfo(label: 'CO', unit: 'ppm', safe: 4.4),
};

class TempScaleStop {
  const TempScaleStop({required this.temp, required this.color});
  final double temp;
  final Color color;
}

const List<TempScaleStop> tempScaleTokens = [
  TempScaleStop(temp: -10, color: Color(0xFF2563EB)),
  TempScaleStop(temp: 0, color: Color(0xFF3B82F6)),
  TempScaleStop(temp: 10, color: Color(0xFF06B6D4)),
  TempScaleStop(temp: 20, color: Color(0xFF10B981)),
  TempScaleStop(temp: 30, color: Color(0xFFD97706)),
  TempScaleStop(temp: 40, color: Color(0xFFEA580C)),
  TempScaleStop(temp: 50, color: Color(0xFFDC2626)),
];

const Color chartLine = Color(0xFFF97316);
const Color chartFillFrom = Color(0xFFF97316);
const Color chartFillTo = Color(0xFFF97316);
const Color gridLight = Color(0xFFE5E7EB);
const Color gridDark = Color(0xFF9CA3AF);

SeverityToken getSeverityToken(String? severity) {
  final key = (severity ?? '').toLowerCase();
  return severityTokens[key] ?? severityTokens['unknown']!;
}

AqiToken getAqiToken(num? aqi) {
  if (aqi == null) {
    return const AqiToken(max: 0, color: Color(0xFF9CA3AF), label: 'Unknown');
  }
  for (final t in aqiTokens) {
    if (aqi <= t.max) return t;
  }
  return aqiTokens.last;
}

UvToken getUvToken(num? uv) {
  if (uv == null) {
    return const UvToken(
      max: 0,
      color: Color(0xFF9CA3AF),
      label: 'Unknown',
      category: 'unknown',
    );
  }
  for (final t in uvTokens) {
    if (uv <= t.max) return t;
  }
  return uvTokens.last;
}

GaugeToken getGaugeToken(num? value) {
  if (value == null) {
    return const GaugeToken(min: 0, color: Color(0xFF9CA3AF), label: 'N/A');
  }
  for (final t in gaugeTokens) {
    if (value >= t.min) return t;
  }
  return gaugeTokens.last;
}

Color colorAtTemp(double temp) {
  const stops = tempScaleTokens;
  if (temp <= stops.first.temp) return stops.first.color;
  if (temp >= stops.last.temp) return stops.last.color;
  for (var i = 0; i < stops.length - 1; i++) {
    final a = stops[i];
    final b = stops[i + 1];
    if (temp >= a.temp && temp <= b.temp) {
      final ratio = (temp - a.temp) / (b.temp - a.temp);
      return Color.lerp(a.color, b.color, ratio)!;
    }
  }
  return stops.last.color;
}