// shaders/write_on.frag
#version 460 core
#include <flutter/runtime_effect.glsl>

uniform vec2 uSize;
uniform float uProgress;
uniform float uFeather;
uniform float uAlpha;
uniform sampler2D uWord;
uniform sampler2D uRev;

out vec4 fragColor;

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;
  vec4 word = texture(uWord, uv);
  vec3 r = texture(uRev, uv).rgb;
  float rev = (r.r * 255.0 * 256.0 + r.g * 255.0) / 65535.0;
  float t = clamp((uProgress - rev) / uFeather, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  fragColor = word * (t * uAlpha);
}