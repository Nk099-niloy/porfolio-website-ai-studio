import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface DeviceMockup3DProps {
  device: 'phone' | 'laptop';
  imageUrl: string | null;
  title: string;
  accentColor: string;
}

function buildFallbackScreenTexture(title: string, accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111116';
  ctx.fillRect(0, 0, 720, 480);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 672, 432);

  ctx.fillStyle = accentHex;
  ctx.fillRect(52, 56, 84, 6);

  ctx.fillStyle = '#f5f3ee';
  ctx.font = '700 32px sans-serif';
  ctx.fillText(title.slice(0, 32), 52, 118);

  // Decorative architectural blocks representing system nodes
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#1b1b24';
    ctx.fillRect(52 + i * 212, 175, 190, 210);
    ctx.strokeStyle = 'rgba(200, 162, 83, 0.35)';
    ctx.strokeRect(52 + i * 212, 175, 190, 210);
    ctx.fillStyle = accentHex;
    ctx.fillRect(72 + i * 212, 204, 48, 48);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function MockupModel({ device, imageUrl, title, accentColor }: DeviceMockup3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const fallbackTex = useMemo(() => buildFallbackScreenTexture(title, accentColor), [title, accentColor]);
  const [screenTex, setScreenTex] = useState<THREE.Texture>(fallbackTex);

  useEffect(() => {
    if (!imageUrl) {
      setScreenTex(fallbackTex);
      return;
    }
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loaded) => {
        if (!active) {
          loaded.dispose();
          return;
        }
        loaded.colorSpace = THREE.SRGBColorSpace;
        setScreenTex(loaded);
      },
      undefined,
      () => {
        if (active) setScreenTex(fallbackTex);
      },
    );
    return () => {
      active = false;
    };
  }, [imageUrl, fallbackTex]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();
    const targetY = Math.sin(t * 0.5) * 0.25 + pointerRef.current.x * 0.35;
    const targetX = 0.08 + pointerRef.current.y * 0.16;
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetY, 4, dt);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetX, 4, dt);
  });

  if (device === 'phone') {
    return (
      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[1.42, 2.78, 0.14]} />
          <meshPhysicalMaterial color={accentColor} metalness={0.9} roughness={0.18} clearcoat={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[1.34, 2.68, 0.14]} />
          <meshStandardMaterial color="#141418" metalness={0.8} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, 0.085]}>
          <planeGeometry args={[1.22, 2.52]} />
          <meshBasicMaterial map={screenTex} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>
      {/* Laptop Screen Lid */}
      <group position={[0, 0.65, -0.45]} rotation={[-0.12, 0, 0]}>
        <mesh>
          <boxGeometry args={[3.15, 2.02, 0.08]} />
          <meshPhysicalMaterial color={accentColor} metalness={0.9} roughness={0.2} clearcoat={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[3.06, 1.94, 0.08]} />
          <meshStandardMaterial color="#15151a" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.055]}>
          <planeGeometry args={[2.9, 1.78]} />
          <meshBasicMaterial map={screenTex} />
        </mesh>
      </group>
      {/* Laptop Keyboard Base */}
      <mesh position={[0, -0.38, 0.5]} rotation={[0.04, 0, 0]}>
        <boxGeometry args={[3.15, 0.08, 1.92]} />
        <meshStandardMaterial color="#1c1c22" metalness={0.85} roughness={0.26} />
      </mesh>
    </group>
  );
}

export default function DeviceMockup3D(props: DeviceMockup3DProps) {
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) setFallback(true);
  }, []);

  if (fallback) {
    return (
      <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
        {props.imageUrl ? (
          <img
            src={props.imageUrl}
            alt={props.title}
            referrerPolicy="no-referrer"
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/10] w-full bg-[var(--surface-elevated)] flex items-center justify-center text-sm text-[var(--ink-muted)]">
            {props.title}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[360px] sm:h-[430px] w-full border border-[var(--border)] bg-[#0f0f13]">
      <Canvas
        camera={{ position: [0, 0.25, 4.4], fov: 40 }}
        dpr={[1, 2]}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          const pmrem = new THREE.PMREMGenerator(gl);
          scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
          pmrem.dispose();
        }}
      >
        <color attach="background" args={['#0f0f13']} />
        <hemisphereLight args={['#ffffff', '#1b1b22', 0.9]} />
        <directionalLight position={[4, 6, 5]} intensity={1.9} color="#fff3d6" />
        <MockupModel {...props} />
      </Canvas>
    </div>
  );
}
