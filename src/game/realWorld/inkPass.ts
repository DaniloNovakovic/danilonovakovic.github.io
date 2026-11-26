import {
  Color,
  DepthTexture,
  Mesh,
  MeshNormalMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type Object3D,
  type PerspectiveCamera,
  type WebGLRenderer
} from 'three';

/** Ink line weight in CSS pixels (Danilo, #144: a little under the prototype's 2.2). */
const LINE_CSS_PX = 1.8;
const WOBBLE = 0.9;

const FRAGMENT = /* glsl */ `
  uniform sampler2D tColor, tDepth, tNormal;
  uniform vec2 res;
  uniform float thick, wobble, near, far;
  uniform vec3 ink;
  varying vec2 vUv;
  float lin(float d) { float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float d0; vec3 n0;
  float edgeAt(vec2 uv, vec2 o) {
    float d = lin(texture2D(tDepth, uv + o).x);
    vec3 n = texture2D(tNormal, uv + o).xyz * 2.0 - 1.0;
    float depthEdge = step(0.06 * d0 + 0.05, abs(d - d0));
    float normalEdge = step(0.35, 1.0 - dot(n, n0));
    return max(depthEdge, normalEdge);
  }
  void main() {
    vec2 px = 1.0 / res;
    vec2 w = (vec2(noise(vUv * res / 55.0), noise(vUv * res / 55.0 + 17.0)) - 0.5) * wobble * thick * px;
    vec2 uv = vUv + w;
    d0 = lin(texture2D(tDepth, uv).x);
    n0 = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
    vec2 o = thick * px;
    float e = 0.0;
    e = max(e, edgeAt(uv, vec2(o.x, 0.0))); e = max(e, edgeAt(uv, vec2(-o.x, 0.0)));
    e = max(e, edgeAt(uv, vec2(0.0, o.y))); e = max(e, edgeAt(uv, vec2(0.0, -o.y)));
    e = max(e, edgeAt(uv, o * 0.7)); e = max(e, edgeAt(uv, -o * 0.7));
    e = max(e, edgeAt(uv, vec2(o.x, -o.y) * 0.7)); e = max(e, edgeAt(uv, vec2(-o.x, o.y) * 0.7));
    // The ink thins out with distance, like a pen lifting.
    float fade = clamp(1.15 - d0 / 34.0, 0.35, 1.0);
    vec3 c = texture2D(tColor, vUv).rgb;
    gl_FragColor = vec4(mix(c, ink, e * fade), 1.0);
    #include <colorspace_fragment>
  }
`;

export interface InkPass {
  resize(): void;
  /** Draw `scene` with ink lines; objects tagged `userData.noInk` get no outline. */
  render(scene: Scene, camera: PerspectiveCamera): void;
  dispose(): void;
}

/**
 * Screen-space ink (ADR-0007): edges come from depth and normals, so the line
 * keeps one weight at any distance, with a slight hand-drawn wobble.
 */
export function createInkPass(renderer: WebGLRenderer, camera: PerspectiveCamera, ink: number): InkPass {
  const size = new Vector2();
  const colorTarget = new WebGLRenderTarget(1, 1, { depthTexture: new DepthTexture(1, 1) });
  const normalTarget = new WebGLRenderTarget(1, 1);
  const normalMaterial = new MeshNormalMaterial();
  const material = new ShaderMaterial({
    uniforms: {
      tColor: { value: colorTarget.texture },
      tDepth: { value: colorTarget.depthTexture },
      tNormal: { value: normalTarget.texture },
      res: { value: new Vector2() },
      thick: { value: LINE_CSS_PX },
      wobble: { value: WOBBLE },
      near: { value: camera.near },
      far: { value: camera.far },
      ink: { value: new Color(ink) }
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: FRAGMENT
  });
  const quadGeometry = new PlaneGeometry(2, 2);
  const quadScene = new Scene();
  quadScene.add(new Mesh(quadGeometry, material));
  const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const hidden: Object3D[] = [];

  return {
    resize() {
      renderer.getDrawingBufferSize(size);
      colorTarget.setSize(size.x, size.y);
      normalTarget.setSize(size.x, size.y);
      material.uniforms.res.value.copy(size);
    },
    render(scene, view) {
      material.uniforms.thick.value = LINE_CSS_PX * renderer.getPixelRatio();
      renderer.setRenderTarget(colorTarget);
      renderer.render(scene, view);

      hidden.length = 0;
      scene.traverseVisible((object) => {
        if (object.userData.noInk) hidden.push(object);
      });
      for (const object of hidden) object.visible = false;
      const background = scene.background;
      scene.background = null;
      scene.overrideMaterial = normalMaterial;
      renderer.setRenderTarget(normalTarget);
      renderer.setClearColor(0x8080ff, 1);
      renderer.render(scene, view);
      scene.overrideMaterial = null;
      scene.background = background;
      for (const object of hidden) object.visible = true;

      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCamera);
    },
    dispose() {
      colorTarget.depthTexture?.dispose();
      colorTarget.dispose();
      normalTarget.dispose();
      normalMaterial.dispose();
      material.dispose();
      quadGeometry.dispose();
    }
  };
}
