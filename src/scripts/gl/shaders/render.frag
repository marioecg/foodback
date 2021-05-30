precision highp float;
	
uniform sampler2D backbuffer;
uniform vec2 resolution;
uniform float time;

varying vec2 vUv;

void main() {
	vec3 renderToScreen = texture2D(backbuffer, vUv).rgb;
	
	gl_FragColor = vec4(renderToScreen, 1.0);
}