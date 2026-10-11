// lib/splash/splash_assets.dart
import 'dart:ui' as ui;
import 'package:flutter/services.dart';

class SplashAssets {
  SplashAssets._(
    this.sun,
    this.cloud,
    this.halo,
    this.word,
    this.rev,
    this.writeOn,
  );

  final ui.Image sun;
  final ui.Image cloud;
  final ui.Image halo;
  final ui.Image word;
  final ui.Image rev;
  final ui.FragmentShader? writeOn;

  static Future<ui.Image> _image(String path) async {
    final data = await rootBundle.load(path);
    final codec = await ui.instantiateImageCodec(data.buffer.asUint8List());
    return (await codec.getNextFrame()).image;
  }

  static Future<SplashAssets> load() async {
    final images = await Future.wait([
      _image('assets/splash/sun.webp'),
      _image('assets/splash/cloud.webp'),
      _image('assets/splash/halo.webp'),
      _image('assets/splash/wordmark.webp'),
      _image('assets/splash/wordmark_rev.webp'),
    ]);

    ui.FragmentShader? shader;
    try {
      final program =
          await ui.FragmentProgram.fromAsset('shaders/write_on.frag');
      shader = program.fragmentShader();
    } catch (_) {
      shader = null;
    }

    return SplashAssets._(
      images[0],
      images[1],
      images[2],
      images[3],
      images[4],
      shader,
    );
  }

  void dispose() {
    for (final image in [sun, cloud, halo, word, rev]) {
      image.dispose();
    }
    writeOn?.dispose();
  }
}