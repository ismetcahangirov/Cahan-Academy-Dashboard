import { useEffect, useRef } from 'react';
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Shape,
  ShapeGeometry,
  ShaderMaterial,
  InstancedMesh,
  InstancedBufferAttribute,
  Object3D,
  DoubleSide,
} from 'three';

/*
 * Edelweiss petals drifting in 3D. Lazy chunk (see PetalField.jsx).
 * Colour law: every fragment is a tone on the white -> #5C000E -> black polyline, computed in the
 * shader from a tone coordinate s (0 white, 1 #5C000E, 2 black); petals are opaque, no lighting.
 * Performance: one instanced draw call, 30 fps cap, DPR <= 1.5, paused when hidden/off-screen.
 */
const VERT = /* glsl */ `
  attribute float aTone;
  varying float vT;
  varying float vTone;
  void main() {
    vT = clamp(position.y / 1.1, 0.0, 1.0);
    vTone = aTone;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;
const FRAG = /* glsl */ `
  varying float vT;
  varying float vTone;
  vec3 tone(float s) {
    vec3 white = vec3(1.0);
    vec3 wine = vec3(92.0, 0.0, 14.0) / 255.0;
    if (s <= 1.0) return mix(white, wine, s);
    return mix(wine, vec3(0.0), s - 1.0);
  }
  void main() {
    // front: wine at the base -> rose tint at the tip; back: wine -> deeper wine
    float s = gl_FrontFacing ? mix(1.0, vTone, vT) : mix(1.05, 1.3, vT);
    gl_FragColor = vec4(tone(s), 1.0);
  }
`;

const petalShape = () => {
  const s = new Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.34, 0.22, 0.3, 0.78, 0, 1.1);
  s.bezierCurveTo(-0.3, 0.78, -0.34, 0.22, 0, 0);
  return s;
};

const rand = (a, b) => a + Math.random() * (b - a);

const EdelweissPetals = ({ className, count = 26 }) => {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.z = 8;

    const geometry = new ShapeGeometry(petalShape(), 10);
    const tones = new Float32Array(count);
    for (let i = 0; i < count; i += 1) tones[i] = rand(0.28, 0.62);
    geometry.setAttribute('aTone', new InstancedBufferAttribute(tones, 1));
    const material = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, side: DoubleSide });
    const mesh = new InstancedMesh(geometry, material, count);
    scene.add(mesh);

    const dummy = new Object3D();
    let halfW = 3;
    let halfH = 4;
    const petals = Array.from({ length: count }, () => ({
      x: 0,
      y: 0,
      z: rand(-3, 1.5),
      vy: rand(0.12, 0.28),
      sway: rand(0.2, 0.6),
      phase: rand(0, Math.PI * 2),
      rx: rand(0, Math.PI * 2),
      ry: rand(0, Math.PI * 2),
      rz: rand(0, Math.PI * 2),
      sx: rand(-0.5, 0.5),
      sy: rand(-0.7, 0.7),
      sz: rand(-0.4, 0.4),
      scale: rand(0.16, 0.3),
      seeded: false,
    }));

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      halfW = halfH * camera.aspect;
    };
    resize();
    petals.forEach((p) => {
      p.x = rand(-halfW, halfW);
      p.y = rand(-halfH, halfH);
      p.seeded = true;
    });

    let raf = 0;
    let last = 0;
    let visible = true;
    let onScreen = true;
    const FRAME = 1000 / 30;

    const step = (now) => {
      raf = requestAnimationFrame(step);
      if (now - last < FRAME) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const t = now / 1000;
      for (let i = 0; i < count; i += 1) {
        const p = petals[i];
        p.y -= p.vy * dt;
        if (p.y < -halfH - 0.5) {
          p.y = halfH + 0.5;
          p.x = rand(-halfW, halfW);
        }
        p.rx += p.sx * dt;
        p.ry += p.sy * dt;
        p.rz += p.sz * dt;
        dummy.position.set(p.x + Math.sin(t * 0.5 + p.phase) * p.sway, p.y, p.z);
        dummy.rotation.set(p.rx, p.ry, p.rz);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    };

    const start = () => {
      if (!raf && visible && onScreen) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
      if (visible) start();
      else stop();
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    io.observe(host);
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [count]);

  return <div ref={hostRef} aria-hidden="true" className={className} style={{ pointerEvents: 'none' }} />;
};

export default EdelweissPetals;
