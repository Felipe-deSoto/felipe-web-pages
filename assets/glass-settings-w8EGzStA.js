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
`,t=`
fn liquidReflectionProfile(inside: f32, width: f32, thickness: f32, padding: f32) -> vec2f {
  let band = min(width, min(thickness, padding * 0.3));
  if (band <= 0.001 || inside >= band) { return vec2f(0.0); }
  let reach = min(thickness * 0.6, padding * 0.2);
  let t = clamp(inside / band, 0.0, 1.0);
  let eased = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  return vec2f(2.0 * inside + reach, clamp(1.0 - eased, 0.0, 1.0));
}
`,n=[{key:`colorAmount`,cssVariable:`--glass-color-amount`,label:`Color amount`,min:0,max:1,step:.001,initial:.188,percent:!0},{key:`frostColor`,cssVariable:`--glass-frost-rgb`,label:`Glass color`,type:`color`,initial:`#4f4f4f`},{key:`blurAmount`,cssVariable:`--glass-blur-amount`,label:`Blur`,min:0,max:5,step:.1,initial:0},{key:`refraction`,cssVariable:`--glass-distortion`,label:`Distortion`,min:0,max:4,step:.01,initial:4},{key:`chromAberration`,cssVariable:`--glass-chromatic-aberration`,label:`Chromatic aberration`,min:0,max:1,step:.01,initial:.4},{key:`zRadius`,cssVariable:`--glass-depth`,label:`Z-axis radius`,min:0,max:60,step:1,initial:60,unit:`px`}],r=Object.freeze(Object.fromEntries(n.map(({key:e,initial:t})=>[e,t])));function i(e){if(typeof e!=`string`)return null;let t=e.trim().toLowerCase();return/^#[0-9a-f]{6}$/.test(t)?t:/^#[0-9a-f]{3}$/.test(t)?`#${[...t.slice(1)].map(e=>e+e).join(``)}`:null}function a(e){return[1,3,5].map(t=>Number.parseInt(e.slice(t,t+2),16))}function o(e){if(!e.trim())return null;let t=e.split(`,`).map(e=>Number(e.trim()));return t.length!==3||t.some(e=>!Number.isFinite(e)||e<0||e>255)?null:`#${t.map(e=>Math.round(e).toString(16).padStart(2,`0`)).join(``)}`}function s(e,t=r){let a=e&&typeof e==`object`&&!Array.isArray(e)?e:{};return Object.fromEntries(n.map(({key:e,type:n,min:r,max:o,step:s,initial:c})=>{let l=a[e];if(e===`colorAmount`&&(typeof l!=`number`||!Number.isFinite(l))){let e=e=>typeof e==`number`&&Number.isFinite(e);(e(a.frostOpacity)||e(a.opacity))&&(l=(e(a.frostOpacity)?Math.max(0,Math.min(.3,a.frostOpacity)):t.colorAmount??c)*(e(a.opacity)?Math.max(0,Math.min(1,a.opacity)):1))}if(n===`color`)return[e,i(l)??i(t[e])??c];if(typeof l!=`number`||!Number.isFinite(l))return[e,t[e]??c];let u=r+Math.round((Math.max(r,Math.min(o,l))-r)/s)*s;return[e,Number(u.toFixed(4))]}))}function c(e){return e.ownerDocument.defaultView.getComputedStyle(e)}function l(e){return s(Object.fromEntries(n.map(({key:t,type:n,cssVariable:r})=>[t,n===`color`?o(e.getPropertyValue(r)):Number.parseFloat(e.getPropertyValue(r))])))}function u(e=document.documentElement){let t=c(e),n=l(t),r=(e,n=0)=>{let r=Number.parseFloat(t.getPropertyValue(e));return Number.isFinite(r)?Math.max(0,r):n};return{opacity:1,materialOpacity:1,frostOpacity:n.colorAmount,frostColor:a(n.frostColor).map(e=>e/255),refraction:n.refraction,blurAmount:n.blurAmount,tintStrength:0,chromAberration:n.chromAberration,edgeHighlight:r(`--glass-edge-highlight`),specular:r(`--glass-specular`),fresnel:r(`--glass-fresnel`),brightness:r(`--glass-brightness`),saturation:r(`--glass-saturation`),zRadius:n.zRadius,headerDepthScale:r(`--glass-header-depth-scale`,1),playgroundDepthScale:r(`--glass-playground-depth-scale`,1),glassThickness:r(`--glass-thickness`),refractionIndex:r(`--glass-refraction-index`),edgeReflection:r(`--glass-edge-reflection`),shadowOpacity:r(`--glass-shadow-opacity`),shadowSpread:r(`--glass-shadow-spread`),shadowOffsetY:r(`--glass-shadow-offset-y`),floating:!1,button:!1}}export{e as n,t as r,u as t};