// lib/utils/units.dart
double convertTemp(double? tempC, String units) {
  if (tempC == null) return 0;
  if (units == 'imperial') return tempC * 9 / 5 + 32;
  if (units == 'standard') return tempC + 273.15;
  return tempC;
}

String formatTemp(double? tempC, String units, {bool showUnit = true}) {
  if (tempC == null) return '--';
  final val = convertTemp(tempC, units).round();
  return showUnit ? '$val°' : '$val';
}

String getTempUnitSymbol(String units) {
  if (units == 'imperial') return '°F';
  if (units == 'standard') return 'K';
  return '°C';
}

String formatWind(double? speedMs, String units) {
  if (speedMs == null) return '--';
  if (units == 'imperial') return '${(speedMs * 2.237).toStringAsFixed(1)} mph';
  return '${speedMs.toStringAsFixed(1)} m/s';
}

String formatPressure(double? hpa, String units) {
  if (hpa == null) return '--';
  if (units == 'imperial') return '${(hpa * 0.02953).toStringAsFixed(2)} inHg';
  return '${hpa.round()} hPa';
}

String formatVisibility(double? meters, String units) {
  if (meters == null) return '--';
  if (units == 'imperial') {
    final miles = meters / 1609.34;
    if (miles >= 0.1) return '${miles.toStringAsFixed(1)} mi';
    return '${(meters * 3.28084).round()} ft';
  }
  if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(1)} km';
  return '${meters.round()} m';
}

String formatPercent(num? value) {
  if (value == null) return '--';
  return '${value.round()}%';
}

String formatPrecipitation(double? mm, String units) {
  if (mm == null) return units == 'imperial' ? '0 in' : '0 mm';
  if (units == 'imperial') {
    final inches = mm / 25.4;
    if (inches < 0.01) return '<0.01 in';
    return '${inches.toStringAsFixed(2)} in';
  }
  if (mm == 0) return '0 mm';
  if (mm < 0.1) return '<0.1 mm';
  return '${mm.toStringAsFixed(1)} mm';
}

String formatFileSize(int bytes) {
  if (bytes <= 0) return '0 B';
  if (bytes >= 1024 * 1024 * 1024) {
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
  if (bytes >= 1024 * 1024) {
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
  if (bytes >= 1024) {
    return '${(bytes / 1024).toStringAsFixed(0)} KB';
  }
  return '$bytes B';
}