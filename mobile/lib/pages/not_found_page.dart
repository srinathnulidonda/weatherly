// lib/pages/not_found_page.dart
import 'package:flutter/material.dart';
import '../components/nav/app_shell.dart';
import '../components/ui/app_button.dart';
import '../theme/app_theme.dart';

class NotFoundPage extends StatelessWidget {
  const NotFoundPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0x0DFFFFFF)
                      : AppColors.stone100,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.cloud_off_rounded,
                  size: 40,
                  color: AppColors.stone400,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                '404',
                style: TextStyle(
                  fontSize: 56,
                  fontWeight: FontWeight.w200,
                  color: AppColors.stone300,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Page not found',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              const Text(
                "The page you're looking for doesn't exist or has been moved.",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppColors.stone500),
              ),
              const SizedBox(height: 20),
              AppButton(
                icon: Icons.home_rounded,
                label: 'Back to Weather',
                onPressed: () =>
                    Navigator.of(context).pushReplacementNamed('/'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}