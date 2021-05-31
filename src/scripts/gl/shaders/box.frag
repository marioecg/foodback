uniform float time;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  uv = fract(uv * 1.0 + vec2(time));

  float strip = step(0.5, uv.y);

  gl_FragColor = vec4(vUv, 1.0, 1.0);
}