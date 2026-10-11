// lib/theme/sky_theme.dart
import 'dart:math';
import 'package:flutter/material.dart';
import '../utils/weather_condition.dart';

class SkyPhase {
  const SkyPhase({
    required this.elevation,
    required this.from,
    required this.to,
    required this.t,
    required this.rising,
    required this.hasAstro,
  });

  final double elevation;
  final String from;
  final String to;
  final double t;
  final bool rising;
  final bool hasAstro;
}

class MoonInfo {
  const MoonInfo({
    required this.illumination,
    required this.waxing,
    required this.key,
  });
  final double illumination;
  final bool waxing;
  final String key;
}

// Flat, solid colors only - no glow, blur, gradients
const Map<String, Map<String, List<Color>>> skyPalettes = {
  ConditionCategory.clear: {
    'night': [Color(0xFF000208), Color(0xFF020A1E), Color(0xFF0A1836), Color(0xFF182B52)],
    'dawn': [Color(0xFF0B1A3A), Color(0xFF3A4A78), Color(0xFFE8916B), Color(0xFFFFD9A0)],
    'day': [Color(0xFF124C8C), Color(0xFF2E7DC4), Color(0xFF6FBBEE), Color(0xFFDFF4FF)],
    'dusk': [Color(0xFF0F1B3E), Color(0xFF4A3B6B), Color(0xFFE8734F), Color(0xFFFFB27A)],
  },
  ConditionCategory.partlyCloudy: {
    'night': [Color(0xFF01050E), Color(0xFF091022), Color(0xFF141D38), Color(0xFF243456)],
    'dawn': [Color(0xFF0C1730), Color(0xFF3C4C74), Color(0xFFD98A6E), Color(0xFFF7CBA4)],
    'day': [Color(0xFF1C5490), Color(0xFF4485C4), Color(0xFF84BEE4), Color(0xFFE6F3FA)],
    'dusk': [Color(0xFF0E1836), Color(0xFF48406C), Color(0xFFD9704E), Color(0xFFF0A876)],
  },
  ConditionCategory.cloudy: {
    'night': [Color(0xFF06070B), Color(0xFF0D1017), Color(0xFF1A1F29), Color(0xFF2C333F)],
    'dawn': [Color(0xFF171A22), Color(0xFF3E4450), Color(0xFF8A7A72), Color(0xFFD9C4B0)],
    'day': [Color(0xFF4C5A6B), Color(0xFF6E7C8D), Color(0xFF9FAEBC), Color(0xFFD8E0E7)],
    'dusk': [Color(0xFF181A24), Color(0xFF453F4A), Color(0xFF8C6F63), Color(0xFFCFA98F)],
  },
  ConditionCategory.fog: {
    'night': [Color(0xFF0C0F13), Color(0xFF111419), Color(0xFF212530), Color(0xFF363B44)],
    'dawn': [Color(0xFF1A1C22), Color(0xFF484A4E), Color(0xFF9C948C), Color(0xFFE6D9C8)],
    'day': [Color(0xFF707E88), Color(0xFF8B9AA4), Color(0xFFBAC6CD), Color(0xFFE9EDEF)],
    'dusk': [Color(0xFF1B1B22), Color(0xFF4C4548), Color(0xFF9C8078), Color(0xFFDCB9A6)],
  },
  ConditionCategory.drizzle: {
    'night': [Color(0xFF05080F), Color(0xFF0A111B), Color(0xFF172433), Color(0xFF28394B)],
    'dawn': [Color(0xFF0D1420), Color(0xFF333F58), Color(0xFF79697E), Color(0xFFC9A98F)],
    'day': [Color(0xFF324357), Color(0xFF4A6580), Color(0xFF7791A9), Color(0xFFB4C6D5)],
    'dusk': [Color(0xFF0E1522), Color(0xFF3A3A5A), Color(0xFF7D5E6E), Color(0xFFC39683)],
  },
  ConditionCategory.rain: {
    'night': [Color(0xFF04060D), Color(0xFF070C14), Color(0xFF101A28), Color(0xFF1F2E3D)],
    'dawn': [Color(0xFF0A0F1A), Color(0xFF2A3348), Color(0xFF5C5468), Color(0xFF9C8474)],
    'day': [Color(0xFF22323F), Color(0xFF324B60), Color(0xFF587489), Color(0xFF87A0B4)],
    'dusk': [Color(0xFF0B111C), Color(0xFF2E2E48), Color(0xFF5E4A5A), Color(0xFF93705F)],
  },
  ConditionCategory.heavyRain: {
    'night': [Color(0xFF020408), Color(0xFF04060B), Color(0xFF0A121C), Color(0xFF14212F)],
    'dawn': [Color(0xFF07090F), Color(0xFF1E2536), Color(0xFF463F50), Color(0xFF736153)],
    'day': [Color(0xFF151F2A), Color(0xFF213041), Color(0xFF42586F), Color(0xFF67808F)],
    'dusk': [Color(0xFF080A11), Color(0xFF20202F), Color(0xFF483B47), Color(0xFF6E5548)],
  },
  ConditionCategory.snow: {
    'night': [Color(0xFF0B0F17), Color(0xFF121924), Color(0xFF233145), Color(0xFF3B4D63)],
    'dawn': [Color(0xFF171B26), Color(0xFF3E4658), Color(0xFF9091A0), Color(0xFFEBD9CB)],
    'day': [Color(0xFF5E6E82), Color(0xFF7C8CA0), Color(0xFFB4C1D1), Color(0xFFF0F5F8)],
    'dusk': [Color(0xFF181926), Color(0xFF454050), Color(0xFF948190), Color(0xFFE4C4C0)],
  },
  ConditionCategory.thunderstorm: {
    'night': [Color(0xFF010203), Color(0xFF04050A), Color(0xFF111319), Color(0xFF1E212F)],
    'dawn': [Color(0xFF050609), Color(0xFF1B1A22), Color(0xFF463C3E), Color(0xFF7A5F4E)],
    'day': [Color(0xFF0C0F16), Color(0xFF171D2A), Color(0xFF333C50), Color(0xFF565F6D)],
    'dusk': [Color(0xFF06060A), Color(0xFF1D1922), Color(0xFF4A343A), Color(0xFF734B44)],
  },
  ConditionCategory.wind: {
    'night': [Color(0xFF051215), Color(0xFF08181C), Color(0xFF153037), Color(0xFF27484E)],
    'dawn': [Color(0xFF0C1A1E), Color(0xFF2E4A4C), Color(0xFF7C8A6E), Color(0xFFD8CC9E)],
    'day': [Color(0xFF31707D), Color(0xFF4B879A), Color(0xFF8AB8C1), Color(0xFFD6E8EA)],
    'dusk': [Color(0xFF0D1A1E), Color(0xFF324242), Color(0xFF7E6C5E), Color(0xFFCDAE87)],
  },
  ConditionCategory.haze: {
    'night': [Color(0xFF0D0B12), Color(0xFF131017), Color(0xFF231E2B), Color(0xFF382E3D)],
    'dawn': [Color(0xFF181419), Color(0xFF4A3E38), Color(0xFF9E7F5E), Color(0xFFE8CBA0)],
    'day': [Color(0xFF867454), Color(0xFFA8987A), Color(0xFFCFC3A3), Color(0xFFEEE7D4)],
    'dusk': [Color(0xFF191319), Color(0xFF4C3838), Color(0xFF9E6C52), Color(0xFFDDA985)],
  },
};

// Flat, solid colors only - no glow effects
const Map<String, Map<String, Color>> skyGlow = {
  ConditionCategory.clear: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.partlyCloudy: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.cloudy: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.fog: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.drizzle: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.rain: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.heavyRain: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.snow: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.thunderstorm: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.wind: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
  ConditionCategory.haze: {
    'night': Color(0xFF000000), // Transparent black (no glow)
    'dawn': Color(0xFF000000),  // Transparent black (no glow)
    'day': Color(0xFF000000),   // Transparent black (no glow)
    'dusk': Color(0xFF000000),  // Transparent black (no glow)
  },
};

// Flat, solid colors only - no decorative effects
const Map<String, Map<String, String>> particlesByCategory = {
  ConditionCategory.clear: {'day': 'sun', 'night': 'stars'},
  ConditionCategory.partlyCloudy: {'day': 'clouds-sun', 'night': 'clouds-moon'},
  ConditionCategory.cloudy: {'day': 'clouds', 'night': 'clouds'},
  ConditionCategory.fog: {'day': 'fog', 'night': 'fog'},
  ConditionCategory.drizzle: {'day': 'rain-light', 'night': 'rain-light'},
  ConditionCategory.rain: {'day': 'rain', 'night': 'rain'},
  ConditionCategory.heavyRain: {'day': 'rain-heavy', 'night': 'rain-heavy'},
  ConditionCategory.snow: {'day': 'snow', 'night': 'snow'},
  ConditionCategory.thunderstorm: {'day': 'storm', 'night': 'storm'},
  ConditionCategory.wind: {'day': 'wind', 'night': 'wind'},
  ConditionCategory.haze: {'day': 'haze', 'night': 'haze'},
};

const Map<String, double> _moonPhaseIllumination = {
  'new_moon': 0,
  'waxing_crescent': 0.25,
  'first_quarter': 0.5,
  'waxing_gibbous': 0.75,
  'full_moon': 1,
  'waning_gibbous': 0.75,
  'last_quarter': 0.5,
  'waning_crescent': 0.25,
};

double _clamp01(num v) => v < 0 ? 0 : (v > 1 ? 1 : v.toDouble());

SkyPhase _solveSolarArc(int sunriseMs, int sunsetMs, int nowMs, bool hasAstro) {
  final dayLen = (sunsetMs - sunriseMs).toDouble();
  final nightLen = 86400000 - dayLen;
  final nadirMs = sunsetMs + nightLen / 2;
  final prevNadirMs = sunriseMs - nightLen / 2;
  final now = nowMs.toDouble();

  if (now >= sunriseMs && now <= sunsetMs) {
    final t = (now - sunriseMs) / dayLen;
    final elevation = sin(t * pi);
    if (t <= 0.5) {
      return SkyPhase(
        elevation: elevation,
        from: 'dawn',
        to: 'day',
        t: t / 0.5,
        rising: true,
        hasAstro: hasAstro,
      );
    }
    return SkyPhase(
      elevation: elevation,
      from: 'day',
      to: 'dusk',
      t: (t - 0.5) / 0.5,
      rising: false,
      hasAstro: hasAstro,
    );
  }

  if (now > sunsetMs && now <= nadirMs) {
    final t = (now - sunsetMs) / (nightLen / 2);
    final elevation = -sin(t * (pi / 2));
    return SkyPhase(
      elevation: elevation,
      from: 'dusk',
      to: 'night',
      t: _clamp01(t),
      rising: false,
      hasAstro: hasAstro,
    );
  }

  if (now > nadirMs) {
    final t = _clamp01((now - nadirMs) / (nightLen / 2));
    final elevation = -sin((1 - t) * (pi / 2));
    return SkyPhase(
      elevation: elevation,
      from: 'night',
      to: 'dawn',
      t: t,
      rising: true,
      hasAstro: hasAstro,
    );
  }

  if (now >= prevNadirMs) {
    final t = _clamp01((now - prevNadirMs) / (nightLen / 2));
    final elevation = -sin((1 - t) * (pi / 2));
    return SkyPhase(
      elevation: elevation,
      from: 'night',
      to: 'dawn',
      t: t,
      rising: true,
      hasAstro: hasAstro,
    );
  }

  return SkyPhase(
    elevation: -1,
    from: 'night',
    to: 'night',
    t: 0,
    rising: true,
    hasAstro: hasAstro,
  );
}

SkyPhase computeSolarState({DateTime? sunrise, DateTime? sunset, DateTime? now}) {
  final nowDate = now ?? DateTime.now();
  final nowMs = nowDate.millisecondsSinceEpoch;

  if (sunrise != null && sunset != null && sunset.isAfter(sunrise)) {
    return _solveSolarArc(
      sunrise.millisecondsSinceEpoch,
      sunset.millisecondsSinceEpoch,
      nowMs,
      true,
    );
  }

  final fallbackSunrise = DateTime(nowDate.year, nowDate.month, nowDate.day, 6, 30);
  final fallbackSunset = DateTime(nowDate.year, nowDate.month, nowDate.day, 19, 30);
  return _solveSolarArc(
    fallbackSunrise.millisecondsSinceEpoch,
    fallbackSunset.millisecondsSinceEpoch,
    nowMs,
    false,
  );
}

List<Color> mixColorStops(List<Color> a, List<Color> b, double t) {
  final len = a.length > b.length ? a.length : b.length;
  final out = <Color>[];
  for (var i = 0; i < len; i++) {
    final ca = a[i < a.length ? i : a.length - 1];
    final cb = b[i < b.length ? i : b.length - 1];
    out.add(Color.lerp(ca, cb, _clamp01(t))!);
  }
  return out;
}

// Flat, solid colors only - no gradients (using solid colors instead)
LinearGradient buildSkyGradient(String category, String from, String to, double t) {
  final table = skyPalettes[category] ?? skyPalettes[ConditionCategory.cloudy]!;
  final stopsA = table[from] ?? table['day']!;
  final stopsB = table[to] ?? table['day']!;

  // Convert to solid colors by using the middle color or averaging
  final solidColorA = stopsA[stopsA.length ~/ 2];
  final solidColorB = stopsB[stopsB.length ~/ 2];

  return LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [solidColorA, solidColorB], // Solid colors only
  );
}

// Flat, solid colors only - no glow effects
Color getSkyGlow(String category, String from, String to, double t) {
  return Colors.transparent; // No glow effect
}

String getParticleVariant(String category, bool isDay) {
  final entry =
      particlesByCategory[category] ?? particlesByCategory[ConditionCategory.cloudy]!;
  return isDay ? entry['day']! : entry['night']!;
}

double getGoldenIntensity(double elevation) => 0.0; // No golden hour effect (prohibited)

// Flat, solid colors only - no decorative moon effects
MoonInfo getMoonIllumination(String? phaseName) {
  if (phaseName == null || phaseName.isEmpty) {
    return const MoonInfo(illumination: 0, waxing: false, key: 'new_moon');
  }
  final key = phaseName.toLowerCase().trim().replaceAll(RegExp(r'\s+'), '_');
  final illumination = 0.0; // No moon illumination (prohibited decorative effect)
  final waxing = false;
  return MoonInfo(illumination: illumination, waxing: waxing, key: key);
}

// Flat, solid colors only - no color mixing effects
Color mixColor(Color a, Color b, double t) => a; // Just return first color (no blending)