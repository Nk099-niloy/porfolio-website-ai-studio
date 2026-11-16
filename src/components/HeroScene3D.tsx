import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { WorkflowFallback2D } from './WorkflowFallback2D';

export interface ScrollChoreographyState {
  progress: number;
  sectionIndex: number;
  mouseX: number;
  mouseY: number;
}

interface HeroScene3DProps {
  scrollStateRef: React.RefObject<ScrollChoreographyState>;
  accentColor: string;
  display3DName: string;
}

const NoiseFilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uIntensity: { value: 0.032 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      float grain = (rand(vUv + fract(uTime)) - 0.5) * uIntensity;
      gl_FragColor = vec4(col.rgb + grain, col.a);
    }
  `,
};

// Procedural geometric beveled shapes for extruded 3D letters "Niloy" (plus common glyphs)
function buildLetterShapes(ch: string): { shapes: THREE.Shape[]; width: number } {
  const c = ch.toLowerCase();

  if (ch === 'N') {
    const s = new THREE.Shape();
    s.moveTo(0.0, 0.0);
    s.lineTo(0.17, 0.0);
    s.lineTo(0.17, 0.56);
    s.lineTo(0.49, 0.0);
    s.lineTo(0.66, 0.0);
    s.lineTo(0.66, 0.9);
    s.lineTo(0.49, 0.9);
    s.lineTo(0.49, 0.34);
    s.lineTo(0.17, 0.9);
    s.lineTo(0.0, 0.9);
    s.closePath();
    return { shapes: [s], width: 0.66 };
  }

  if (c === 'n') {
    const s = new THREE.Shape();
    s.moveTo(0.0, 0.0);
    s.lineTo(0.16, 0.0);
    s.lineTo(0.16, 0.46);
    s.lineTo(0.44, 0.0);
    s.lineTo(0.58, 0.0);
    s.lineTo(0.58, 0.68);
    s.lineTo(0.42, 0.68);
    s.lineTo(0.42, 0.24);
    s.lineTo(0.14, 0.68);
    s.lineTo(0.0, 0.68);
    s.closePath();
    return { shapes: [s], width: 0.58 };
  }

  if (c === 'i') {
    const stem = new THREE.Shape();
    stem.moveTo(0.0, 0.0);
    stem.lineTo(0.17, 0.0);
    stem.lineTo(0.17, 0.62);
    stem.lineTo(0.0, 0.62);
    stem.closePath();

    const dot = new THREE.Shape();
    dot.moveTo(0.0, 0.74);
    dot.lineTo(0.17, 0.74);
    dot.lineTo(0.17, 0.9);
    dot.lineTo(0.0, 0.9);
    dot.closePath();
    return { shapes: [stem, dot], width: 0.18 };
  }

  if (c === 'l') {
    const s = new THREE.Shape();
    s.moveTo(0.0, 0.0);
    s.lineTo(0.18, 0.0);
    s.lineTo(0.18, 0.9);
    s.lineTo(0.0, 0.9);
    s.closePath();
    return { shapes: [s], width: 0.18 };
  }

  if (c === 'o') {
    const outer = new THREE.Shape();
    outer.absellipse(0.32, 0.34, 0.32, 0.34, 0, Math.PI * 2, false, 0);
    const inner = new THREE.Path();
    inner.absellipse(0.32, 0.34, 0.16, 0.18, 0, Math.PI * 2, true, 0);
    outer.holes.push(inner);
    return { shapes: [outer], width: 0.64 };
  }

  if (ch === 'Y' || c === 'y') {
    const s = new THREE.Shape();
    s.moveTo(0.0, 0.72);
    s.lineTo(0.17, 0.72);
    s.lineTo(0.34, 0.36);
    s.lineTo(0.51, 0.72);
    s.lineTo(0.68, 0.72);
    s.lineTo(0.41, 0.18);
    s.lineTo(0.32, -0.14);
    s.lineTo(0.15, -0.14);
    s.lineTo(0.25, 0.18);
    s.closePath();
    return { shapes: [s], width: 0.68 };
  }

  if (c === 'e') {
    const s = new THREE.Shape();
    s.moveTo(0.0, 0.0);
    s.lineTo(0.56, 0.0);
    s.lineTo(0.56, 0.14);
    s.lineTo(0.16, 0.14);
    s.lineTo(0.16, 0.31);
    s.lineTo(0.48, 0.31);
    s.lineTo(0.48, 0.44);
    s.lineTo(0.16, 0.44);
    s.lineTo(0.16, 0.58);
    s.lineTo(0.56, 0.58);
    s.lineTo(0.56, 0.72);
    s.lineTo(0.0, 0.72);
    s.closePath();
    return { shapes: [s], width: 0.56 };
  }

  if (c === 'a') {
    const s = new THREE.Shape();
    s.moveTo(0.0, 0.0);
    s.lineTo(0.16, 0.0);
    s.lineTo(0.22, 0.2);
    s.lineTo(0.44, 0.2);
    s.lineTo(0.5, 0.0);
    s.lineTo(0.66, 0.0);
    s.lineTo(0.41, 0.72);
    s.lineTo(0.25, 0.72);
    s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(0.26, 0.33);
    hole.lineTo(0.4, 0.33);
    hole.lineTo(0.33, 0.54);
    hole.closePath();
    s.holes.push(hole);
    return { shapes: [s], width: 0.66 };
  }

  if (c === 's') {
    const s = new THREE.Shape();
    s.moveTo(0.02, 0.0);
    s.lineTo(0.54, 0.0);
    s.lineTo(0.54, 0.41);
    s.lineTo(0.16, 0.41);
    s.lineTo(0.16, 0.58);
    s.lineTo(0.54, 0.58);
    s.lineTo(0.54, 0.72);
    s.lineTo(0.02, 0.72);
    s.lineTo(0.02, 0.29);
    s.lineTo(0.4, 0.29);
    s.lineTo(0.4, 0.14);
    s.lineTo(0.02, 0.14);
    s.closePath();
    return { shapes: [s], width: 0.54 };
  }

  const s = new THREE.Shape();
  s.moveTo(0.0, 0.0);
  s.lineTo(0.46, 0.0);
  s.lineTo(0.46, 0.72);
  s.lineTo(0.0, 0.72);
  s.closePath();
  return { shapes: [s], width: 0.46 };
}

function createExtrudedWordGeometries(text: string): Array<{ geo: THREE.ExtrudeGeometry; x: number }> {
  const chars = Array.from(text || 'Niloy').slice(0, 14);
  const items: Array<{ geos: THREE.ExtrudeGeometry[]; width: number }> = [];
  let totalWidth = 0;
  const gap = 0.12;

  for (const ch of chars) {
    const { shapes, width } = buildLetterShapes(ch);
    const geos = shapes.map(
      (shape) =>
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.2,
          bevelEnabled: true,
          bevelThickness: 0.026,
          bevelSize: 0.018,
          bevelSegments: 3,
          curveSegments: 20,
        }),
    );
    items.push({ geos, width });
    totalWidth += width + gap;
  }
  totalWidth -= gap;

  const placed: Array<{ geo: THREE.ExtrudeGeometry; x: number }> = [];
  let cursor = -totalWidth / 2;
  for (const item of items) {
    for (const geo of item.geos) {
      placed.push({ geo, x: cursor });
    }
    cursor += item.width + gap;
  }
  return placed;
}

function createSocialCardTexture(title: string, metric: string, accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#15151a';
  ctx.fillRect(0, 0, 512, 320);

  ctx.strokeStyle = 'rgba(200, 162, 83, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 488, 296);

  ctx.fillStyle = accentHex;
  ctx.fillRect(36, 40, 68, 6);

  ctx.fillStyle = '#f5f3ee';
  ctx.font = '600 26px sans-serif';
  ctx.fillText(title, 36, 98);

  ctx.fillStyle = accentHex;
  ctx.font = '700 62px monospace';
  ctx.fillText(metric, 36, 192);

  // Mini bar chart
  const bars = [44, 72, 58, 96, 84, 118];
  bars.forEach((h, idx) => {
    ctx.fillStyle = idx === bars.length - 1 ? accentHex : 'rgba(245,243,238,0.22)';
    ctx.fillRect(36 + idx * 34, 278 - h * 0.55, 22, h * 0.55);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPhoneFeedCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  draw: (scrollOffset: number, accentHex: string, labelName?: string) => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const posts = [
    { tag: 'CAMPAIGN ROI', val: '+184% Reach', sub: 'Automated n8n Distribution' },
    { tag: 'AI AGENT', val: '2.4s Reply', sub: 'Gemini Support Routing' },
    { tag: 'WEB ANALYTICS', val: '4.9% CVR', sub: 'Attribution Funnel Live' },
    { tag: 'GROWTH SPRINT', val: '120K Views', sub: 'Organic Content Architecture' },
  ];

  const draw = (scrollOffset: number, accentHex: string, labelName = 'Niloy') => {
    ctx.fillStyle = '#0e0e12';
    ctx.fillRect(0, 0, 360, 720);

    // Top bar
    ctx.fillStyle = '#17171d';
    ctx.fillRect(0, 0, 360, 76);
    ctx.fillStyle = accentHex;
    ctx.font = '700 18px sans-serif';
    ctx.fillText(`${labelName.toUpperCase()} FEED`, 24, 48);

    const cardH = 175;
    const gap = 18;
    const cycle = posts.length * (cardH + gap);

    for (let i = 0; i < posts.length * 2; i++) {
      const p = posts[i % posts.length];
      const y = 96 + ((i * (cardH + gap) - (scrollOffset % cycle) + cycle) % cycle) - cardH;
      if (y > 720 || y + cardH < 70) continue;

      ctx.fillStyle = '#181820';
      ctx.fillRect(20, y, 320, cardH);
      ctx.strokeStyle = 'rgba(200, 162, 83, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, y, 320, cardH);

      ctx.fillStyle = accentHex;
      ctx.font = '600 13px monospace';
      ctx.fillText(p.tag, 38, y + 36);

      ctx.fillStyle = '#f5f3ee';
      ctx.font = '700 32px sans-serif';
      ctx.fillText(p.val, 38, y + 90);

      ctx.fillStyle = '#a19e96';
      ctx.font = '400 16px sans-serif';
      ctx.fillText(p.sub, 38, y + 132);
    }

    texture.needsUpdate = true;
  };

  draw(0, '#c8a253', 'Niloy');
  return { canvas, ctx, texture, draw };
}

function createDustSprite(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(235, 205, 130, 1)');
  grad.addColorStop(0.45, 'rgba(200, 162, 83, 0.55)');
  grad.addColorStop(1, 'rgba(200, 162, 83, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const CAMERA_KEYFRAMES = [
  { pos: new THREE.Vector3(-0.3, 0.4, 8.2), look: new THREE.Vector3(1.5, 0.0, 0.0) },
  { pos: new THREE.Vector3(1.6, 0.8, 7.6), look: new THREE.Vector3(1.1, 0.1, -0.3) },
  { pos: new THREE.Vector3(-1.4, 1.1, 7.2), look: new THREE.Vector3(0.8, 0.2, 0.0) },
  { pos: new THREE.Vector3(0.6, -0.4, 7.9), look: new THREE.Vector3(1.2, 0.0, 0.0) },
  { pos: new THREE.Vector3(2.2, 0.4, 8.5), look: new THREE.Vector3(0.7, 0.1, 0.0) },
];

const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _curLook = new THREE.Vector3(1.5, 0, 0);

function HeroSculpture({
  scrollStateRef,
  accentColor,
  display3DName,
  isSoftwareGl,
}: HeroScene3DProps & { isSoftwareGl: boolean }) {
  const { gl, scene, camera, size } = useThree();
  const rootGroupRef = useRef<THREE.Group>(null);
  const nameGroupRef = useRef<THREE.Group>(null);
  const phoneGroupRef = useRef<THREE.Group>(null);
  const cardsGroupRef = useRef<THREE.Group>(null);
  const barsGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const letterItems = useMemo(() => createExtrudedWordGeometries(display3DName), [display3DName]);

  const goldMetalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: accentColor,
        metalness: 0.94,
        roughness: 0.15,
        clearcoat: 0.65,
        clearcoatRoughness: 0.12,
      }),
    [accentColor],
  );

  const obsidianMetalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#17171c',
        metalness: 0.85,
        roughness: 0.25,
        clearcoat: 0.4,
      }),
    [],
  );

  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.05,
        roughness: 0.08,
        transmission: isSoftwareGl ? 0 : 0.72,
        transparent: true,
        opacity: isSoftwareGl ? 0.34 : 0.92,
        ior: 1.48,
        thickness: 0.35,
        clearcoat: 1.0,
      }),
    [isSoftwareGl],
  );

  const cardTextures = useMemo(
    () => [
      createSocialCardTexture('ENGAGEMENT', '+184%', accentColor),
      createSocialCardTexture('AUTOMATION', '42 FLOWS', accentColor),
      createSocialCardTexture('CONVERSION', '4.9% CVR', accentColor),
    ],
    [accentColor],
  );

  const phoneFeed = useMemo(() => createPhoneFeedCanvas(), []);
  const dustTexture = useMemo(() => createDustSprite(), []);

  // Sparse gold-dust particle geometry (68 particles)
  const particleGeo = useMemo(() => {
    const count = 68;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  // Subtle post-processing composer on GPU devices
  const composerRef = useRef<{
    composer: EffectComposer;
    noisePass: ShaderPass;
  } | null>(null);

  useEffect(() => {
    if (isSoftwareGl) {
      composerRef.current = null;
      return;
    }

    const composer = new EffectComposer(gl);
    composer.setSize(size.width, size.height);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.26,
      0.38,
      0.86,
    );
    composer.addPass(bloomPass);

    const bokehPass = new BokehPass(scene, camera, {
      focus: 8.2,
      aperture: 0.00018,
      maxblur: 0.0045,
    });
    composer.addPass(bokehPass);

    const noisePass = new ShaderPass(NoiseFilmShader);
    composer.addPass(noisePass);

    composerRef.current = { composer, noisePass };

    return () => {
      composer.dispose();
      composerRef.current = null;
    };
  }, [gl, scene, camera, size.width, size.height, isSoftwareGl]);

  // Clean up disposable resources
  useEffect(() => {
    return () => {
      letterItems.forEach((l) => l.geo.dispose());
      goldMetalMat.dispose();
      obsidianMetalMat.dispose();
      glassMat.dispose();
      cardTextures.forEach((t) => t.dispose());
      phoneFeed.texture.dispose();
      dustTexture.dispose();
      particleGeo.dispose();
    };
  }, [letterItems, goldMetalMat, obsidianMetalMat, glassMat, cardTextures, phoneFeed, dustTexture, particleGeo]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const elapsed = state.clock.getElapsedTime();
    const scroll = scrollStateRef.current ?? { progress: 0, sectionIndex: 0, mouseX: 0, mouseY: 0 };

    // Scroll-driven camera path + parallax
    const totalStages = CAMERA_KEYFRAMES.length - 1;
    const scaled = THREE.MathUtils.clamp(scroll.progress, 0, 1) * totalStages;
    const idxA = Math.min(Math.floor(scaled), totalStages);
    const idxB = Math.min(idxA + 1, totalStages);
    const t = scaled - idxA;

    _camGoal.copy(CAMERA_KEYFRAMES[idxA].pos).lerp(CAMERA_KEYFRAMES[idxB].pos, t);
    _camGoal.x += scroll.mouseX * 0.55;
    _camGoal.y -= scroll.mouseY * 0.35;

    _lookGoal.copy(CAMERA_KEYFRAMES[idxA].look).lerp(CAMERA_KEYFRAMES[idxB].look, t);

    camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, 4.2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, 4.2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, 4.2, dt);

    _curLook.x = THREE.MathUtils.damp(_curLook.x, _lookGoal.x, 4.5, dt);
    _curLook.y = THREE.MathUtils.damp(_curLook.y, _lookGoal.y, 4.5, dt);
    _curLook.z = THREE.MathUtils.damp(_curLook.z, _lookGoal.z, 4.5, dt);
    camera.lookAt(_curLook);

    // 1. Extruded champagne-gold name gentle float + scroll rotation
    if (nameGroupRef.current) {
      nameGroupRef.current.rotation.y = THREE.MathUtils.damp(
        nameGroupRef.current.rotation.y,
        -0.18 + scroll.mouseX * 0.16 + scroll.progress * 0.75,
        4,
        dt,
      );
      nameGroupRef.current.position.y = 1.25 + Math.sin(elapsed * 0.9) * 0.08;
    }

    // 2. Rotating 3D phone + scrolling live feed canvas texture
    if (phoneGroupRef.current) {
      phoneGroupRef.current.rotation.y = -0.35 + Math.sin(elapsed * 0.65) * 0.24 + scroll.progress * 1.4;
      phoneGroupRef.current.rotation.x = 0.08 + scroll.mouseY * 0.12;
      phoneGroupRef.current.position.y = -0.18 + Math.cos(elapsed * 0.85) * 0.09;
      phoneFeed.draw(elapsed * 42 + scroll.progress * 320, accentColor, display3DName);
    }

    // 3. Floating glass post cards depth parallax
    if (cardsGroupRef.current) {
      cardsGroupRef.current.children.forEach((child, idx) => {
        const speed = 0.7 + idx * 0.25;
        child.position.y += Math.sin(elapsed * speed + idx * 2.1) * 0.0014;
        child.rotation.y = THREE.MathUtils.damp(
          child.rotation.y,
          (idx - 1) * 0.22 + scroll.mouseX * (0.14 + idx * 0.06) + scroll.progress * 0.45,
          3.8,
          dt,
        );
      });
    }

    // 4. 3D Analytics bars that grow with scroll
    if (barsGroupRef.current) {
      const growthFactor = 0.38 + THREE.MathUtils.clamp(scroll.progress * 1.35, 0, 1.1);
      barsGroupRef.current.children.forEach((bar, idx) => {
        if (idx === 0) return; // Base plinth
        const targetHeight = (0.35 + idx * 0.19) * growthFactor;
        bar.scale.y = THREE.MathUtils.damp(bar.scale.y, targetHeight, 5.0, dt);
        bar.position.y = (bar.scale.y * 0.5) - 0.8;
      });
    }

    // 5. Sparse gold dust particle drift
    if (particlesRef.current) {
      particlesRef.current.rotation.y = elapsed * 0.025 + scroll.progress * 0.3;
    }

    // Render with post-processing on GPU when active
    if (composerRef.current) {
      composerRef.current.noisePass.uniforms.uTime.value = elapsed;
      composerRef.current.composer.render();
    }
  }, composerRef.current ? 1 : 0);

  const barHeights = [0.6, 0.85, 0.72, 1.08, 0.94, 1.32];

  return (
    <group ref={rootGroupRef}>
      <color attach="background" args={['#0b0b0e']} />
      <fog attach="fog" args={['#0b0b0e', 8.5, 18]} />

      <hemisphereLight args={['#fff5dc', '#181822', 0.9]} />
      <directionalLight position={[6, 8, 6]} intensity={2.2} color="#fff2d6" />
      <directionalLight position={[-5, 2, -4]} intensity={0.85} color="#a5b4fc" />
      <pointLight position={[2.2, 1.6, 3.5]} intensity={1.4} color={accentColor} distance={9} />

      {/* Extruded 3D Name "Niloy" in polished champagne-gold metal */}
      <group ref={nameGroupRef} position={[2.25, 1.25, 0.25]} scale={0.76}>
        {letterItems.map((item, idx) => (
          <mesh key={idx} geometry={item.geo} material={goldMetalMat} position={[item.x, 0, 0]} />
        ))}
      </group>

      {/* Composite Rotating 3D Phone showing live social feed */}
      <group ref={phoneGroupRef} position={[1.45, -0.18, 0.75]}>
        {/* Outer gold chamfered chassis */}
        <mesh material={goldMetalMat}>
          <boxGeometry args={[1.08, 2.12, 0.11]} />
        </mesh>
        {/* Obsidian inner body */}
        <mesh material={obsidianMetalMat} position={[0, 0, 0.008]}>
          <boxGeometry args={[1.02, 2.04, 0.11]} />
        </mesh>
        {/* Camera island on back */}
        <mesh material={goldMetalMat} position={[-0.24, 0.72, -0.075]}>
          <boxGeometry args={[0.34, 0.34, 0.04]} />
        </mesh>
        {/* Live feed screen */}
        <mesh position={[0, 0, 0.068]}>
          <planeGeometry args={[0.92, 1.92]} />
          <meshBasicMaterial map={phoneFeed.texture} />
        </mesh>
      </group>

      {/* Floating Glass Post Cards with depth parallax */}
      <group ref={cardsGroupRef}>
        {[
          { pos: [3.2, 0.25, -0.8] as [number, number, number], tex: cardTextures[0] },
          { pos: [0.05, 0.9, -1.35] as [number, number, number], tex: cardTextures[1] },
          { pos: [3.05, -1.05, -0.35] as [number, number, number], tex: cardTextures[2] },
        ].map((card, idx) => (
          <group key={idx} position={card.pos}>
            {/* Frosted Glass Backing */}
            <mesh material={glassMat}>
              <boxGeometry args={[1.38, 0.88, 0.045]} />
            </mesh>
            {/* Card Graphics Face */}
            <mesh position={[0, 0, 0.026]}>
              <planeGeometry args={[1.28, 0.79]} />
              <meshBasicMaterial map={card.tex} transparent opacity={0.94} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3D Analytics Bars growing with scroll */}
      <group ref={barsGroupRef} position={[1.45, -1.05, -0.25]}>
        {/* Base plinth */}
        <mesh material={obsidianMetalMat} position={[0, -0.84, 0]}>
          <boxGeometry args={[2.1, 0.08, 0.6]} />
        </mesh>
        {barHeights.map((_h, idx) => (
          <mesh
            key={idx}
            position={[-0.75 + idx * 0.3, -0.5, 0]}
            material={idx % 2 === 0 ? goldMetalMat : obsidianMetalMat}
          >
            <boxGeometry args={[0.18, 1.0, 0.18]} />
          </mesh>
        ))}
      </group>

      {/* Sparse Gold Dust Particle Field */}
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial
          map={dustTexture}
          size={0.14}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function HeroScene3D({
  scrollStateRef,
  accentColor,
  display3DName,
}: HeroScene3DProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [isSoftwareGl, setIsSoftwareGl] = useState(false);

  useEffect(() => {
    const evaluateDevice = () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const smallViewport = window.innerWidth < 768;
      const lowPower =
        typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2;

      let webglSupported = false;
      let software = false;
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        webglSupported = Boolean(gl);
        if (gl) {
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
          const gpu = String(gl.getParameter(param) || '');
          software = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
      } catch {
        webglSupported = false;
      }

      setIsSoftwareGl(software);
      setUseFallback(reducedMotion || smallViewport || lowPower || !webglSupported);
    };

    evaluateDevice();
    window.addEventListener('resize', evaluateDevice);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', evaluateDevice);

    return () => {
      window.removeEventListener('resize', evaluateDevice);
      mq.removeEventListener('change', evaluateDevice);
    };
  }, []);

  if (useFallback) {
    return <WorkflowFallback2D accentColor={accentColor} />;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: [-0.3, 0.4, 8.2], fov: 40, near: 0.1, far: 40 }}
        dpr={isSoftwareGl ? 1 : [1, 2]}
        gl={{ powerPreference: 'high-performance', antialias: !isSoftwareGl }}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

          const pmremGenerator = new THREE.PMREMGenerator(gl);
          const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
          scene.environment = envTex;
          pmremGenerator.dispose();

          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setUseFallback(true);
          });
        }}
      >
        <HeroSculpture
          scrollStateRef={scrollStateRef}
          accentColor={accentColor}
          display3DName={display3DName}
          isSoftwareGl={isSoftwareGl}
        />
      </Canvas>
    </div>
  );
}
