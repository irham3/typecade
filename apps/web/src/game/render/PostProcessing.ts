import { DepthTexture, NearestFilter, Vector2, WebGLRenderTarget, type Camera, type Scene, type WebGLRenderer } from "three"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { environmentGrade } from "./environmentGrade"

/** Depth-edge ink outline, colour grade (saturation + split tone), hurt pulse and vignette in one pass. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    depth: { value: null },
    texel: { value: new Vector2(1, 1) },
    outline: { value: 1 },
    hurt: { value: 0 },
    saturation: { value: environmentGrade.post.saturation },
    vignetteStrength: { value: environmentGrade.post.vignette },
    focus: { value: 0 },
  },
  vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
  fragmentShader: `varying vec2 vUv;uniform sampler2D tDiffuse;uniform sampler2D depth;uniform vec2 texel;uniform float outline;uniform float hurt;uniform float saturation;uniform float focus;uniform float vignetteStrength;
  void main(){
    vec3 c=texture2D(tDiffuse,vUv).rgb;float d=texture2D(depth,vUv).r;
    float edge=step(.0012,abs(d-texture2D(depth,vUv+vec2(texel.x,0.)).r)+abs(d-texture2D(depth,vUv+vec2(0.,texel.y)).r));
    c=mix(c,c*.25,edge*outline);
    float luma=dot(c,vec3(.299,.587,.114));
    c=mix(vec3(luma),c,saturation);
    float vignette=1.-vignetteStrength*pow(length((vUv-.5)*1.3),2.);
    c+=vec3(.6,.06,.025)*hurt*smoothstep(.18,.65,length(vUv-.5));
    // Impact focus: dim the surroundings (edges most) so the action at screen centre reads clearly.
    c*=vignette*(1.-focus*(.15+.55*smoothstep(.08,.55,length(vUv-.5))));
    gl_FragColor=vec4(c,1.);
  }`,
}

export interface PostSettings { bloom: boolean; outline: boolean }

/**
 * Owns the post-processing chain: scene → outline/grade → bloom → output (sRGB).
 * Rendered at the low pixel-art resolution so the whole chain stays cheap.
 */
export class PostProcessing {
  private readonly target: WebGLRenderTarget
  private readonly composer: EffectComposer
  private readonly grade: ShaderPass
  private readonly bloom: UnrealBloomPass

  constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera) {
    this.target = new WebGLRenderTarget(1, 1, { minFilter: NearestFilter, magFilter: NearestFilter })
    this.target.depthTexture = new DepthTexture(1, 1)
    this.composer = new EffectComposer(renderer, this.target)
    this.composer.addPass(new RenderPass(scene, camera))
    this.grade = new ShaderPass(GradeShader)
    this.composer.addPass(this.grade)
    this.bloom = new UnrealBloomPass(new Vector2(1, 1), environmentGrade.post.bloomStrength, environmentGrade.post.bloomRadius, environmentGrade.post.bloomThreshold)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
  }

  setSize(width: number, height: number) {
    this.composer.setPixelRatio(1)
    this.composer.setSize(width, height)
    this.grade.uniforms.texel!.value.set(1 / width, 1 / height)
    this.grade.uniforms.depth!.value = this.composer.renderTarget1.depthTexture
  }

  configure({ bloom, outline }: PostSettings) {
    this.bloom.enabled = bloom
    this.grade.uniforms.outline!.value = outline ? environmentGrade.post.outline : 0
  }

  /** Transient full-screen feedback (0..1): red hurt edge and impact focus (darkened surroundings). */
  setFeedback(hurt: number, focus: number) {
    this.grade.uniforms.hurt!.value = hurt
    this.grade.uniforms.focus!.value = focus
  }

  render(delta: number) {
    this.grade.uniforms.depth!.value = this.composer.readBuffer.depthTexture ?? this.composer.renderTarget1.depthTexture
    this.composer.render(delta)
  }

  dispose() {
    this.composer.dispose()
    this.target.dispose()
    this.bloom.dispose()
  }
}
