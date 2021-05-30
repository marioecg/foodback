varying vec2 vUv;
uniform sampler2D prevFrame;
	
vec2 rotate(vec2 v, float a) {
	return mat2(cos(a), -sin(a), sin(a), cos(a))*v;
}

void main() {
	vec4 inText = texture2D(prevFrame, vUv);
  // vec4 inText2 = texture2D(prevFrame, vUv * 0.9);
	inText.rgb += vec3(0.1, 0.0, 0.0);
	
	gl_FragColor = inText;
}