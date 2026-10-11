// lib/components/update/update_prompt_dialog.dart
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../services/update_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../ui/app_button.dart';

class UpdatePromptDialog extends StatelessWidget {
  const UpdatePromptDialog({super.key, required this.check});

  final UpdateCheck check;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final info = check.info;
    final mandatory = check.mandatory;
    final visibleChangelog = info.changelog.take(4).toList();
    final hiddenCount = info.changelog.length - visibleChangelog.length;

    return PopScope(
      canPop: !mandatory,
      child: Dialog(
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
                      color: const Color(0x1AF97316),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.system_update_rounded,
                      size: 20,
                      color: AppColors.brand500,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          mandatory ? 'Update required' : 'Update available',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: dark ? AppColors.stone100 : AppColors.stone900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Weatherly ${info.latestVersion} · ${formatFileSize(info.fileSizeBytes)}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.stone500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                mandatory
                    ? 'You are on ${check.installedLabel} and this update is required. Everything keeps working normally after updating.'
                    : 'You are on ${check.installedLabel}. Update to get the latest improvements.',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.45,
                  color: dark ? AppColors.stone400 : AppColors.stone600,
                ),
              ),
              if (visibleChangelog.isNotEmpty) ...[
                const SizedBox(height: 12),
                ...visibleChangelog.map(
                  (line) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 7, right: 8),
                          child: SizedBox(
                            width: 4,
                            height: 4,
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                color: AppColors.brand500,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            line,
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.4,
                              color: dark ? AppColors.stone300 : AppColors.stone700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (hiddenCount > 0)
                  Text(
                    '+ $hiddenCount more changes',
                    style: const TextStyle(fontSize: 12, color: AppColors.stone500),
                  ),
              ],
              const SizedBox(height: 20),
              Row(
                children: [
                  if (!mandatory) ...[
                    Expanded(
                      child: AppButton(
                        variant: AppButtonVariant.outline,
                        size: AppButtonSize.sm,
                        label: 'Later',
                        fullWidth: true,
                        onPressed: () async {
                          if (Platform.isAndroid || Platform.isIOS) {
                            HapticFeedback.lightImpact();
                          }
                          Navigator.of(context).pop(false);
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: AppButton(
                      size: AppButtonSize.sm,
                      icon: Icons.system_update_rounded,
                      label: 'Update now',
                      fullWidth: true,
                      onPressed: () async {
                        if (Platform.isAndroid || Platform.isIOS) {
                          HapticFeedback.lightImpact();
                        }
                        Navigator.of(context).pop(true);
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}