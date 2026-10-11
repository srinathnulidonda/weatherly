// lib/theme/app_theme.dart
import 'package:flutter/material.dart';

class AppColors {
  static const brand400 = Color(0xFFFB923C);
  static const brand500 = Color(0xFFF97316);
  static const brand600 = Color(0xFFEA580C);

  static const stone50 = Color(0xFFFAFAF9);
  static const stone100 = Color(0xFFF5F5F4);
  static const stone200 = Color(0xFFE7E5E4);
  static const stone300 = Color(0xFFD6D3D1);
  static const stone400 = Color(0xFFA8A29E);
  static const stone500 = Color(0xFF78716C);
  static const stone600 = Color(0xFF57534E);
  static const stone700 = Color(0xFF44403C);
  static const stone800 = Color(0xFF292524);
  static const stone900 = Color(0xFF1C1917);
  static const stone950 = Color(0xFF0C0A09);

  static const textPrimaryLight = stone900;
  static const textSecondaryLight = stone600;
  static const textTertiaryLight = stone500;

  static const textPrimaryDark = stone50;
  static const textSecondaryDark = stone300;
  static const textTertiaryDark = stone400;
}

class AppRadius {
  static const card = 24.0;
  static const hero = 32.0;
  static const pill = 999.0;
  static const tile = 16.0;
  static const metricInset = 8.0;
}

class AppSpacing {
  static const pageX = 16.0;
  static const pageY = 16.0;
  static const card = 16.0;
  static const stack = 12.0;
  static const topbarH = 56.0;
  static const bottombarH = 64.0;
}

class AppTapTarget {
  static const min = 48.0;
}

BoxDecoration glassSurface({required bool dark, double radius = AppRadius.card}) {
  return BoxDecoration(
    color: dark ? const Color(0x0AFFFFFF) : const Color(0xCCFFFFFF),
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(
      color: dark ? const Color(0x12FFFFFF) : const Color(0xCCE7E5E4),
    ),
    boxShadow: dark
        ? null
        : const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 16,
              offset: Offset(0, 4),
            ),
          ],
  );
}

BoxDecoration glassPill({required bool dark}) {
  return BoxDecoration(
    color: dark ? const Color(0x0FFFFFFF) : const Color(0xB3FFFFFF),
    borderRadius: BorderRadius.circular(AppRadius.pill),
    border: Border.all(
      color: dark ? const Color(0x14FFFFFF) : const Color(0xB3E7E5E4),
    ),
  );
}

class AppTheme {
  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.stone50,
      visualDensity: VisualDensity.standard,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.brand500,
        brightness: Brightness.light,
      ).copyWith(primary: AppColors.brand500, surface: AppColors.stone50),
    );
    return base.copyWith(
      textTheme: base.textTheme.apply(
        bodyColor: AppColors.stone900,
        displayColor: AppColors.stone900,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      splashFactory: InkSparkle.splashFactory,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      // Enhanced visual feedback for pressed states
      highlightColor: Colors.transparent,
      hoverColor: Colors.transparent,
      focusColor: Colors.transparent,
    );
  }

  static ThemeData dark() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.stone950,
      visualDensity: VisualDensity.standard,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.brand500,
        brightness: Brightness.dark,
      ).copyWith(primary: AppColors.brand500, surface: AppColors.stone950),
    );
    return base.copyWith(
      textTheme: base.textTheme.apply(
        bodyColor: AppColors.stone50,
        displayColor: AppColors.stone50,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      splashFactory: InkSparkle.splashFactory,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      // Enhanced visual feedback for pressed states
      highlightColor: Colors.transparent,
      hoverColor: Colors.transparent,
      focusColor: Colors.transparent,
    );
  }
}