precision highp float;
	
uniform sampler2D backbuffer;
uniform vec2 resolution;
uniform float time;

varying vec2 vUv;

void main() {
	vec3 lastFrame = texture2D(backbuffer, vUv).rgb;
	
	gl_FragColor = vec4(lastFrame, 1.0);
}