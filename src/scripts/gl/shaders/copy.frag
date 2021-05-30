varying vec2 vUv;
uniform sampler2D channel0;
	
vec2 rotate(vec2 v, float a) {
	return mat2(cos(a), -sin(a), sin(a), cos(a))*v;
}

void main() {
	vec4 inText = texture2D(channel0, vUv);
  // vec4 inText2 = texture2D(channel0, vUv * 0.9);
	
	gl_FragColor = inText;
}