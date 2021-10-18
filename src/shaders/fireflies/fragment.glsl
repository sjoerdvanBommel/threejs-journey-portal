precision mediump float;

void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    gl_FragColor = vec4(1.0, 0.5, 1.0, 0.05 / distanceToCenter - 0.1);
}