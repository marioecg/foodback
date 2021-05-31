varying vec2 vUv;

uniform sampler2D prevFrame;
uniform float time;

void main() {
	float scl = 0.97;

	vec2 uv = vUv;
	uv += -0.5;
	uv *= scl;
	uv += 0.5;

	vec4 inText = texture2D(prevFrame, uv);
  
	gl_FragColor = inText;
}