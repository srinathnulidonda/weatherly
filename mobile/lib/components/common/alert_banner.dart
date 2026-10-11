// lib/components/common/alert_banner.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/alerts_provider.dart';
import '../../theme/color_tokens.dart';
import '../../utils/constants.dart';

class AlertBanner extends StatelessWidget {
  const AlertBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AlertsProvider>();
    final alert = provider.criticalAlert;
    if (alert == null) return const SizedBox.shrink();
    final severity = (alert['severity'] ?? 'unknown').toString().toLowerCase();
    if (!criticalSeverities.contains(severity)) return const SizedBox.shrink();
    final token = getSeverityToken(severity);
    final headline = (alert['headline'] ?? 'Weather Alert').toString();
    final eventType = (alert['event_type'] ?? '').toString();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Semantics(
        container: true,
        label: '$eventType alert: $headline',
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: token.color,
            borderRadius: BorderRadius.circular(24),
            // Removed boxShadow (prohibited effect)
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  color: Color(0x33FFFFFF),
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  size: 18,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      headline,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$eventType · $severity',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xD9FFFFFF),
                      ),
                    ),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: () => Navigator.of(context)
                          .pushReplacementNamed(AppRoutes.alerts),
                      borderRadius: BorderRadius.circular(8),
                      child: const Padding(
                        padding:
                            EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'View details',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                                decoration: TextDecoration.underline,
                                decorationColor: Colors.white,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(
                              Icons.arrow_forward_rounded,
                              size: 12,
                              color: Colors.white,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}