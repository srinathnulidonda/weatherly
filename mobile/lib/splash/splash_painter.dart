// lib/splash/splash_painter.dart
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'splash_assets.dart';
import 'splash_motion.dart';

class SplashPainter extends CustomPainter {
  SplashPainter(this.controller, this.assets) : super(repaint: controller);

  final AnimationController controller;
  final SplashAssets assets;

  static void _image(
    Canvas canvas,
    ui.Image image,
    Rect dst, {
    double alpha = 1,
    BlendMode blend = BlendMode.srcOver,
  }) {
    if (alpha <= 0) return;
    canvas.drawImageRect(
      image,
      Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble()),
      dst,
      Paint()
        ..isAntiAlias = true
        ..filterQuality = FilterQuality.high
        ..blendMode = blend
        ..color = Color.fromRGBO(255, 255, 255, alpha),
    );
  }

  @override
  void paint(Canvas canvas, Size size) {
    final e = controller.value * kTotalMs;
    final w = size.width;
    final h = size.height;
    canvas.drawRect(Offset.zero & size, Paint()..color = Colors.white);
    if (e > kHandoffStartMs + 950) return;

    final iw = math.min(w * .54, 250.0);
    final ih = iw * kIconAspect;
    final ww = math.min(w * .58, 265.0);
    final wh = ww * kWordmarkAspect;
    final gap = iw * .06;
    final top = h / 2 - (ih + gap + wh) / 2 - h * .015;
    final x0 = w / 2 - iw / 2;
    final pad = iw * .2;
    final bw = iw + 2 * pad;
    final bh = ih + 2 * pad;
    final cx = x0 + kSunPivotX * iw;
    final cy = top + kSunPivotY * ih;

    const x = kHandoffStartMs;
    final drift = tw(e, 100, 2400, kSlow);
    final settle = .97 + .03 * tw(e, 0, 2400, kEmphasized);
    final nameOut = tw(e, x, 260, kStandard);
    final markOut = tw(e, x + 200, 450, kStandard);
    final markUp = tw(e, x + 80, 700, kEmphasized);

    canvas.save();
    canvas.translate(w / 2, h / 2);
    canvas.scale(settle);
    canvas.translate(-w / 2, -h / 2);

    _paintBloom(canvas, size, e, cx, cy, iw);
    _paintSunrise(canvas, size, e, cx, cy, iw, markOut);

    final mx = x0 + iw / 2;
    final my = top + ih / 2;
    canvas.save();
    canvas.translate(mx, my - 10 * markUp);
    canvas.scale(1 + .1 * markUp);
    canvas.translate(-mx, -my);
    canvas.translate(x0 - pad, top - pad);
    canvas.saveLayer(
      Rect.fromLTWH(0, 0, bw, bh),
      Paint()..color = Color.fromRGBO(255, 255, 255, 1 - markOut),
    );

    final sp = tw(e, 300, 1100, kDecelerate);
    canvas.save();
    canvas.clipRect(Rect.fromLTWH(0, 0, bw, pad + ih * .74));
    canvas.translate(
      pad + kSunPivotX * iw + 8 * (1 - drift),
      pad + kSunPivotY * ih + ih * .36 * (1 - sp),
    );
    canvas.rotate(-(1 - sp) * 9 * math.pi / 180);
    canvas.scale(.94 + .06 * sp);
    _image(
      canvas,
      assets.sun,
      Rect.fromLTWH(-kSunPivotX * iw, -kSunPivotY * ih, iw, ih),
      alpha: tw(e, 300, 300, kStandard),
    );
    canvas.restore();

    final ca = tw(e, 100, 450, kStandard);
    final cp = tw(e, 100, 800, kEmphasized);
    final cr = Rect.fromLTWH(
      pad - 10 * (1 - drift),
      pad + 14 * (1 - cp),
      iw,
      ih,
    );
    _image(canvas, assets.halo, cr, alpha: ca, blend: BlendMode.dstOut);
    _image(canvas, assets.cloud, cr, alpha: ca);

    canvas.restore();
    canvas.restore();

    _paintName(canvas, e, w, top + ih + gap, ww, wh, nameOut);

    canvas.restore();
  }

  void _paintBloom(
    Canvas canvas,
    Size size,
    double e,
    double cx,
    double cy,
    double iw,
  ) {
    final bt = tw(e, kHandoffStartMs + 50, 850, kStandard);
    if (bt <= 0 || bt >= 1) return;
    final r0 = iw * 1.2;
    final r1 = math.max(size.width, size.height) * 1.15;
    canvas.drawRect(
      (Offset.zero & size).inflate(60),
      Paint()
        ..shader = ui.Gradient.radial(
          Offset(cx, cy),
          r0 + (r1 - r0) * bt,
          [
            Color.fromRGBO(255, 170, 120, .16 * math.sin(math.pi * bt)),
            const Color.fromRGBO(255, 170, 120, 0),
          ],
        ),
    );
  }

  void _paintSunrise(
    Canvas canvas,
    Size size,
    double e,
    double cx,
    double cy,
    double iw,
    double markOut,
  ) {
    final a = .07 *
        tw(e, 300, 900, kStandard) *
        (1 - .55 * tw(e, 1500, 900, kStandard)) *
        (1 - markOut);
    if (a <= 0) return;
    canvas.drawRect(
      (Offset.zero & size).inflate(60),
      Paint()
        ..shader = ui.Gradient.radial(Offset(cx, cy), iw * 1.25, [
          Color.fromRGBO(255, 150, 100, a),
          const Color.fromRGBO(255, 150, 100, 0),
        ]),
    );
  }

  void _paintName(
    Canvas canvas,
    double e,
    double w,
    double y,
    double ww,
    double wh,
    double nameOut,
  ) {
    final wp = tw(e, 900, 1250, kStandard);
    if (wp <= 0 || nameOut >= 1) return;
    canvas.save();
    canvas.translate(w / 2 - ww / 2, y + 4 * (1 - wp) + 6 * nameOut);

    final shader = assets.writeOn;
    if (shader == null) {
      _image(canvas, assets.word, Rect.fromLTWH(0, 0, ww, wh), alpha: wp);
      canvas.restore();
      return;
    }

    const feather = .06;
    shader
      ..setFloat(0, ww)
      ..setFloat(1, wh)
      ..setFloat(2, wp * (1 + feather))
      ..setFloat(3, feather)
      ..setFloat(4, 1 - nameOut)
      ..setImageSampler(0, assets.word)
      ..setImageSampler(1, assets.rev);
    canvas.drawRect(Rect.fromLTWH(0, 0, ww, wh), Paint()..shader = shader);
    canvas.restore();
  }

  @override
  bool shouldRepaint(SplashPainter old) => old.assets != assets;
}