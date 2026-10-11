// lib/pages/update_page.dart
import 'package:flutter/material.dart';

import '../components/ui/app_button.dart';
import '../components/ui/card.dart';
import '../services/update_service.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

class UpdatePage extends StatefulWidget {
  const UpdatePage({super.key, required this.check});

  final UpdateCheck check;

  @override
  State<UpdatePage> createState() => _UpdatePageState();
}

class _UpdatePageState extends State<UpdatePage> {
  final UpdateDownloadController _controller = UpdateDownloadController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _controller.download(widget.check.info);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final info = widget.check.info;
    final mandatory = widget.check.mandatory;

    return PopScope(
      canPop: !mandatory,
      child: Scaffold(
        backgroundColor: dark ? AppColors.stone950 : AppColors.stone50,
        body: SafeArea(
          child: ListenableBuilder(
            listenable: _controller,
            builder: (context, _) => ListView(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
              children: [
                _UpdateHeader(mandatory: mandatory),
                const SizedBox(height: 20),
                AppCard(
                  padding: CardPadding.lg,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Weatherly ${info.latestVersion}',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.3,
                          color: dark ? AppColors.stone50 : AppColors.stone900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        mandatory
                            ? 'You are on ${widget.check.installedLabel} and this update is required.'
                            : 'You are on ${widget.check.installedLabel}. Update for the latest fixes and improvements.',
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          color: dark ? AppColors.stone400 : AppColors.stone600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(
                            Icons.download_rounded,
                            size: 14,
                            color: AppColors.stone500,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            formatFileSize(info.fileSizeBytes),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.stone500,
                            ),
                          ),
                          if (info.releasedAt != null) ...[
                            const SizedBox(width: 12),
                            const Icon(
                              Icons.schedule_rounded,
                              size: 14,
                              color: AppColors.stone500,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              formatDate(info.releasedAt, fmt: 'MMM d, yyyy'),
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.stone500,
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (info.changelog.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const CardTitle("What's new"),
                        const SizedBox(height: 8),
                        ...info.changelog.map(
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
                                      height: 1.45,
                                      color: dark
                                          ? AppColors.stone300
                                          : AppColors.stone700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      _buildActions(context),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    final info = widget.check.info;
    final dark = Theme.of(context).brightness == Brightness.dark;
    switch (_controller.stage) {
      case UpdateStage.idle:
        return AppButton(
          icon: Icons.system_update_rounded,
          label: 'Start download',
          fullWidth: true,
          onPressed: () => _controller.download(info),
        );
      case UpdateStage.downloading:
        return _ProgressBlock(
          label:
              'Downloading ${formatFileSize((_controller.progress * info.fileSizeBytes).round())} of ${formatFileSize(info.fileSizeBytes)}',
          value: _controller.progress,
        );
      case UpdateStage.verifying:
        return const _ProgressBlock(label: 'Verifying download…', value: null);
      case UpdateStage.ready:
        return AppButton(
          icon: Icons.install_mobile_rounded,
          label: 'Install update',
          fullWidth: true,
          onPressed: _controller.install,
        );
      case UpdateStage.installing:
        return const _ProgressBlock(label: 'Opening installer…', value: null);
      case UpdateStage.installPrompted:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Finish the install in the system dialog. If it was dismissed, reopen the installer below.',
              style: TextStyle(
                fontSize: 13,
                height: 1.45,
                color: dark ? AppColors.stone300 : AppColors.stone700,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    variant: AppButtonVariant.outline,
                    label: 'App settings',
                    fullWidth: true,
                    onPressed: () => _controller.openInstallSettings(),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: AppButton(
                    icon: Icons.install_mobile_rounded,
                    label: 'Reopen installer',
                    fullWidth: true,
                    onPressed: _controller.install,
                  ),
                ),
              ],
            ),
          ],
        );
      case UpdateStage.failed:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_controller.errorMessage != null) ...[
              _ErrorNotice(
                message: _controller.errorMessage!,
                showSettings: _controller.errorKind == UpdateErrorKind.install,
                onOpenSettings: _controller.openInstallSettings,
              ),
              const SizedBox(height: 12),
            ],
            AppButton(
              icon: Icons.refresh_rounded,
              label: 'Try again',
              fullWidth: true,
              onPressed: () => _controller.download(info),
            ),
          ],
        );
    }
  }
}

class _UpdateHeader extends StatelessWidget {
  const _UpdateHeader({required this.mandatory});

  final bool mandatory;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: const Color(0x1AF97316),
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Icon(
            Icons.system_update_rounded,
            size: 30,
            color: AppColors.brand500,
          ),
        ),
        const SizedBox(height: 14),
        Text(
          mandatory ? 'Update required' : 'Update available',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.4,
            color: dark ? AppColors.stone50 : AppColors.stone900,
          ),
        ),
      ],
    );
  }
}

class _ProgressBlock extends StatelessWidget {
  const _ProgressBlock({required this.label, required this.value});

  final String label;
  final double? value;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: value,
            minHeight: 6,
            color: AppColors.brand500,
            backgroundColor: dark ? const Color(0x14FFFFFF) : AppColors.stone200,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.stone500),
        ),
      ],
    );
  }
}

class _ErrorNotice extends StatelessWidget {
  const _ErrorNotice({
    required this.message,
    required this.showSettings,
    required this.onOpenSettings,
  });

  final String message;
  final bool showSettings;
  final Future<void> Function() onOpenSettings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0x1AEF4444),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x33EF4444)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 16,
                color: Color(0xFFEF4444),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    color: Color(0xFFDC2626),
                  ),
                ),
              ),
            ],
          ),
          if (showSettings) ...[
            const SizedBox(height: 4),
            TextButton(
              onPressed: () {
                onOpenSettings();
              },
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: const Size(48, 48),
                alignment: Alignment.centerLeft,
              ),
              child: const Text('Open install settings'),
            ),
          ],
        ],
      ),
    );
  }
}