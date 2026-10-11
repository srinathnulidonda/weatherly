// lib/components/ui/section_label.dart
import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.trailing});

  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final style = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.6,
      color: dark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
    );
    final label = Text(text.toUpperCase(), style: style);
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: trailing == null
          ? label
          : Row(
              children: [
                Expanded(child: label),
                trailing!,
              ],
            ),
    );
  }
}