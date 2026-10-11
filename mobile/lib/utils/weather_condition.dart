// lib/utils/weather_condition.dart
class ConditionCategory {
  static const clear = 'clear';
  static const partlyCloudy = 'partly_cloudy';
  static const cloudy = 'cloudy';
  static const fog = 'fog';
  static const drizzle = 'drizzle';
  static const thunderstorm = 'thunderstorm';
  static const heavyRain = 'heavy_rain';
  static const rain = 'rain';
  static const snow = 'snow';
  static const wind = 'wind';
  static const haze = 'haze';
}

class _KeywordRule {
  const _KeywordRule(this.keywords, this.category);
  final List<String> keywords;
  final String category;
}

const List<_KeywordRule> _keywordOrder = [
  _KeywordRule(['thunder', 'lightning'], ConditionCategory.thunderstorm),
  _KeywordRule(['blizzard', 'sleet', 'ice_pellet', 'hail', 'snow'], ConditionCategory.snow),
  _KeywordRule(['torrential', 'heavy_rain', 'heavy_shower'], ConditionCategory.heavyRain),
  _KeywordRule(['drizzle'], ConditionCategory.drizzle),
  _KeywordRule(['freezing_rain', 'rain', 'shower'], ConditionCategory.rain),
  _KeywordRule(['dust', 'smoke', 'haze', 'sand', 'ash'], ConditionCategory.haze),
  _KeywordRule(['mist', 'fog'], ConditionCategory.fog),
  _KeywordRule(['gale', 'tornado', 'squall', 'wind'], ConditionCategory.wind),
  _KeywordRule(['partly', 'partial'], ConditionCategory.partlyCloudy),
  _KeywordRule(['overcast', 'cloud'], ConditionCategory.cloudy),
  _KeywordRule(['clear', 'sunny'], ConditionCategory.clear),
];

final RegExp _nightIconPattern = RegExp(r'^\d{2}n$');

String normalizeConditionKey(dynamic condition) {
  if (condition == null) return 'clear';
  String raw;
  if (condition is String) {
    raw = condition;
  } else if (condition is Map) {
    raw = (condition['main'] ?? condition['description'] ?? '').toString();
  } else {
    raw = condition.toString();
  }
  return raw
      .toLowerCase()
      .trim()
      .replaceAll(RegExp(r'[\s\-]+'), '_')
      .replaceAll(RegExp(r'_+'), '_');
}

List<String> _tokenize(String key) =>
    key.split('_').where((t) => t.isNotEmpty).toList();

String resolveConditionCategory(dynamic condition) {
  final key = normalizeConditionKey(condition);
  final tokens = _tokenize(key);
  for (final rule in _keywordOrder) {
    for (final word in rule.keywords) {
      if (word.contains('_')) {
        if (key.contains(word)) return rule.category;
      } else {
        if (tokens.any((t) => t.contains(word))) return rule.category;
      }
    }
  }
  return ConditionCategory.cloudy;
}

bool isNightCondition(dynamic condition) {
  final key = normalizeConditionKey(condition);
  if (_tokenize(key).contains('night')) return true;
  return _nightIconPattern.hasMatch(key);
}

String? getConditionKey(dynamic condition) {
  if (condition == null) return null;
  if (condition is String) return condition;
  if (condition is Map) {
    final main = condition['main'];
    if (main != null) return main.toString();
    final description = condition['description'];
    if (description != null) return description.toString();
  }
  return null;
}

DateTime? _parseTime(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String && value.isNotEmpty) return DateTime.tryParse(value);
  return null;
}

bool resolveIsDay(Map<String, dynamic>? data) {
  if (data == null) return true;
  final flag = data['is_day'];
  if (flag is bool) return flag;
  if (data['condition'] != null && isNightCondition(data['condition'])) {
    return false;
  }

  final astro = data['astronomy'];
  if (astro is Map) {
    final sunrise = _parseTime(astro['sunrise']);
    final sunset = _parseTime(astro['sunset']);
    if (sunrise != null && sunset != null && sunset.isAfter(sunrise)) {
      final now = DateTime.now();
      return !now.isBefore(sunrise) && !now.isAfter(sunset);
    }
  }

  final now = DateTime.now();
  return now.hour >= 6 && now.hour < 19;
}