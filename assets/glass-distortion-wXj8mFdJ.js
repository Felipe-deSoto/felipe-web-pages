var e=`
float liquidEdgeMask(float inside, float width) {
  if (width <= 0.001) return 0.0;
  float t = clamp(inside / width, 0.0, 1.0);
  // Quintic falloff has zero first and second derivatives at both ends.
  float eased = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  return clamp(1.0 - eased, 0.0, 1.0);
}

vec3 liquidSquircleNormal(vec2 inwardNormal, float inside, float width) {
  if (width <= 0.001) return vec3(0.0, 0.0, 1.0);
  float radial = 1.0 - clamp(inside / width, 0.0, 1.0);
  float radial2 = radial * radial;
  // The cross-section is x^4 + z^4 = 1. Its surface normal follows the
  // implicit gradient (x^3, z^3), rather than the position on the curve.
  float height = sqrt(sqrt(max(1.0 - radial2 * radial2, 0.0)));
  vec2 gradient = normalize(vec2(radial2 * radial, height * height * height));
  return vec3(-inwardNormal * gradient.x, gradient.y);
}

vec2 liquidLensOffset(vec3 normal, float thickness, float edge, float strength, float ior) {
  vec3 ray = refract(vec3(0.0, 0.0, -1.0), normal, 1.0 / max(ior, 1.001));
  return ray.xy / max(-ray.z, 0.001) * thickness * 0.7 * edge * max(strength, 0.0);
}

// x: outward displacement; y: reflection blend. Both shader backends use
// the same bounded mirror profile, measured in their backdrop pixel space.
vec2 liquidReflectionProfile(float inside, float width, float thickness, float padding) {
  float band = min(width, min(thickness, padding * 0.3));
  if (band <= 0.001 || inside >= band) return vec2(0.0);
  float reach = min(thickness * 0.6, padding * 0.2);
  // Boundary = pixel + outward * inside. Mirroring across it adds another
  // inside, reversing only the normal axis while preserving the tangent.
  return vec2(2.0 * inside + reach, liquidEdgeMask(inside, band));
}

// Rougher at the outer rim, fading to zero at the flat face. Bound the
// footprint to both the bevel and the captured backdrop's safe margin.
float liquidReflectionBlurRadius(float edgeBlend, float radius, float width, float padding) {
  float limit = min(max(width, 0.0) * 0.5, max(padding, 0.0) * 0.1);
  return min(max(radius, 0.0), limit) * clamp(edgeBlend, 0.0, 1.0);
}
`,t=`
fn liquidReflectionProfile(inside: f32, width: f32, thickness: f32, padding: f32) -> vec2f {
  let band = min(width, min(thickness, padding * 0.3));
  if (band <= 0.001 || inside >= band) { return vec2f(0.0); }
  let reach = min(thickness * 0.6, padding * 0.2);
  let t = clamp(inside / band, 0.0, 1.0);
  let eased = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  return vec2f(2.0 * inside + reach, clamp(1.0 - eased, 0.0, 1.0));
}

fn liquidReflectionBlurRadius(edgeBlend: f32, radius: f32, width: f32, padding: f32) -> f32 {
  let limit = min(max(width, 0.0) * 0.5, max(padding, 0.0) * 0.1);
  return min(max(radius, 0.0), limit) * clamp(edgeBlend, 0.0, 1.0);
}
`;export{t as n,e as t};