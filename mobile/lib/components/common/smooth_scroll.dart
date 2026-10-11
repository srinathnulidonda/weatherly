// lib/components/common/smooth_scroll.dart
import 'package:flutter/material.dart';

class SmoothScrollView extends StatelessWidget {
  const SmoothScrollView({
    super.key,
    required this.children,
    this.padding = const EdgeInsets.fromLTRB(16, 12, 16, 24),
    this.controller,
    this.cacheExtent = 600,
  });

  final List<Widget> children;
  final EdgeInsetsGeometry padding;
  final ScrollController? controller;
  final double cacheExtent;

  @override
  Widget build(BuildContext context) {
    return ListView(
      controller: controller,
      padding: padding,
      // Platform-native physics (clamping on Android, bouncing on iOS).
      // Always scrollable so pull-to-refresh works on short content.
      physics: const AlwaysScrollableScrollPhysics(),
      cacheExtent: cacheExtent,
      addAutomaticKeepAlives: true,
      addRepaintBoundaries: true,
      addSemanticIndexes: false,
      children: children,
    );
  }
}