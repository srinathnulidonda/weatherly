// lib/components/ui/error_state.dart
import 'package:flutter/material.dart';
import '../../api/api_client.dart';
import '../../theme/app_theme.dart';
import 'app_button.dart';

class ErrorState extends StatelessWidget {
  const ErrorState({
    super.key,
    this.error,
    this.onRetry,
    this.compact = false,
  });

  final Object? error;
  final VoidCallback? onRetry;
  final bool compact;

  ApiException? get _api => error is ApiException ? error as ApiException : null;
  bool get _isNetwork => _api?.isNetwork ?? false;
  bool get _isRateLimit => _api?.isRateLimited ?? false;
  bool get _isUnauthorized => _api?.isUnauthorized ?? false;

  String get _message {
    final api = _api;
    if (api != null) return api.message;
    if (error is String) return error as String;
    return 'An unexpected error occurred.';
  }

  String get _title {
    if (_isRateLimit) return 'Too Many Requests';
    if (_isNetwork) return 'Connection Error';
    if (_isUnauthorized) return 'Access Denied';
    return 'Something went wrong';
  }

  IconData get _icon {
    if (_isNetwork) return Icons.wifi_off_rounded;
    if (_isUnauthorized) return Icons.lock_outline_rounded;
    return Icons.warning_amber_rounded;
  }

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0x1AEF4444),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0x33EF4444)),
        ),
        child: Row(
          children: [
            Icon(_icon, size: 16, color: const Color(0xFFEF4444)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _message,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14, color: Color(0xFFDC2626)),
              ),
            ),
            if (onRetry != null)
              AppButton(
                variant: AppButtonVariant.icon,
                icon: Icons.refresh_rounded,
                onPressed: onRetry,
              ),
          ],
        ),
      );
    }

    final dark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 44),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0x1AEF4444),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(_icon, size: 28, color: const Color(0xFFEF4444)),
          ),
          const SizedBox(height: 16),
          Text(
            _title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: dark ? AppColors.stone300 : AppColors.stone700,
            ),
          ),
          const SizedBox(height: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 320),
            child: Text(
              _isRateLimit
                  ? '$_message Please wait before trying again.'
                  : _message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: AppColors.stone500),
            ),
          ),
          if (onRetry != null && !_isRateLimit) ...[
            const SizedBox(height: 16),
            AppButton(
              variant: AppButtonVariant.outline,
              size: AppButtonSize.sm,
              icon: Icons.refresh_rounded,
              label: 'Try again',
              onPressed: onRetry,
            ),
          ],
        ],
      ),
    );
  }
}