// lib/splash/splash_motion.dart
import 'package:flutter/animation.dart';

const double kSunPivotX = 0.3054156171284635;
const double kSunPivotY = 0.35086206896551725;

const double kIconAspect = 0.7304785894206549;
const double kWordmarkAspect = 0.41829268292682925;

const double kHandoffStartMs = 3000;

const double kTotalMs = 4700;

const Curve kDecelerate = Cubic(.05, .7, .1, 1);
const Curve kEmphasized = Cubic(.2, 0, 0, 1);
const Curve kStandard = Cubic(.4, 0, .2, 1);
const Curve kSlow = Cubic(.25, .1, .25, 1);

double tw(double e, double startMs, double durationMs, Curve curve) =>
    curve.transform(((e - startMs) / durationMs).clamp(0.0, 1.0).toDouble());