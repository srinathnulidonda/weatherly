// lib/components/ui/app_input.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class AppInput extends StatelessWidget {
  const AppInput({
    super.key,
    this.controller,
    this.focusNode,
    this.label,
    this.hint,
    this.leadingIcon,
    this.trailing,
    this.onChanged,
    this.onSubmitted,
    this.autofocus = false,
    this.textInputAction = TextInputAction.search,
    this.keyboardType = TextInputType.text,
    this.enabled = true,
    this.height,
    this.borderRadius,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? label;
  final String? hint;
  final IconData? leadingIcon;
  final Widget? trailing;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool autofocus;
  final TextInputAction textInputAction;
  final TextInputType keyboardType;
  final bool enabled;
  final double? height;
  final double? borderRadius;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final radius = borderRadius ?? 16;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 6),
        ],
        Container(
          height: height,
          constraints: const BoxConstraints(minHeight: 48),
          decoration: BoxDecoration(
            color: dark ? const Color(0x08FFFFFF) : Colors.white,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(
              color: dark ? const Color(0x1AFFFFFF) : AppColors.stone300,
            ),
          ),
          child: Row(
            children: [
              if (leadingIcon != null)
                Padding(
                  padding: const EdgeInsets.only(left: 14, right: 10),
                  child: Icon(
                    leadingIcon,
                    size: 16,
                    color: dark ? AppColors.stone500 : AppColors.stone400,
                  ),
                )
              else
                const SizedBox(width: 14),
              Expanded(
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  onChanged: onChanged,
                  onSubmitted: onSubmitted,
                  autofocus: autofocus,
                  textInputAction: textInputAction,
                  keyboardType: keyboardType,
                  enabled: enabled,
                  style: TextStyle(
                    fontSize: 14,
                    color: dark ? AppColors.stone100 : AppColors.stone900,
                  ),
                  decoration: InputDecoration(
                    isCollapsed: true,
                    border: InputBorder.none,
                    hintText: hint,
                    hintStyle: TextStyle(
                      color: dark ? AppColors.stone600 : AppColors.stone500,
                    ),
                  ),
                ),
              ),
              if (trailing != null)
                Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: trailing,
                )
              else
                const SizedBox(width: 10),
            ],
          ),
        ),
      ],
    );
  }
}