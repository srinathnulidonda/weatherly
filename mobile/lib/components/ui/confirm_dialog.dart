// lib/components/ui/confirm_dialog.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'app_button.dart';

Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  String? description,
  String confirmLabel = 'Confirm',
  String cancelLabel = 'Cancel',
  IconData icon = Icons.warning_amber_rounded,
  bool danger = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) {
      final dark = Theme.of(context).brightness == Brightness.dark;
      return Dialog(
        backgroundColor: dark ? AppColors.stone900 : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: (danger ? const Color(0xFFEF4444) : AppColors.brand500)
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      icon,
                      size: 20,
                      color: danger ? const Color(0xFFEF4444) : AppColors.brand500,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: dark ? AppColors.stone100 : AppColors.stone900,
                      ),
                    ),
                  ),
                ],
              ),
              if (description != null) ...[
                const SizedBox(height: 12),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.45,
                    color: dark ? AppColors.stone400 : AppColors.stone500,
                  ),
                ),
              ],
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: AppButton(
                      variant: AppButtonVariant.outline,
                      size: AppButtonSize.sm,
                      label: cancelLabel,
                      fullWidth: true,
                      onPressed: () => Navigator.of(context).pop(false),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: AppButton(
                      variant: danger ? AppButtonVariant.danger : AppButtonVariant.primary,
                      size: AppButtonSize.sm,
                      label: confirmLabel,
                      fullWidth: true,
                      onPressed: () => Navigator.of(context).pop(true),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
  return result ?? false;
}