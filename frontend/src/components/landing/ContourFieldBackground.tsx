import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './ContourFieldBackground.css';

interface ContourFieldBackgroundProps {
  className?: string;
  scale?: number;
  levels?: number;
  lineWidth?: number;
}

export const ContourFieldBackground: React.FC<ContourFieldBackgroundProps> = ({
  className = '',
  scale = 3.2,
  levels = 24.0,
  lineWidth = 1.25,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Three.js Scene & Orthographic Camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const uniforms = {
      u_resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      u_time: { value: 0.0 },
      u_scale: { value: scale },
      u_levels: { value: levels },
      u_lineWidth: { value: lineWidth },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_scale;
      uniform float u_levels;
      uniform float u_lineWidth;

      // Simplex 2D noise (McEwan / Gustavson)
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,
                            0.366025403784439,
                           -0.577350269189626,
                            0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
              + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x  = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(cos(0.45), sin(0.45), -sin(0.45), cos(0.45));
        for (int i = 0; i < 4; ++i) {
          v += a * snoise(p);
          p = rot * p * 2.02 + vec2(15.2, 43.7);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
        vec2 coord = (vUv - 0.5) * aspect;

        // Continuous slow organic drift, pivoted in place without scroll movement
        vec2 samplePos = coord * u_scale + vec2(u_time * 0.015, u_time * 0.008);

        // Normalized height from FBM [-1, 1] -> [0, 1]
        float rawH = fbm(samplePos);
        float h = clamp(0.5 + 0.5 * rawH, 0.0, 1.0);

        // Compute contour lines via anti-aliased derivative threshold
        float scaledH = h * u_levels;
        float fw = max(fwidth(scaledH), 0.0008);
        float lineDist = abs(fract(scaledH - 0.5) - 0.5) / fw;
        float line = 1.0 - smoothstep(0.0, u_lineWidth, lineDist);

        // Index contour line (every 5th line is bolder)
        float indexScaled = scaledH / 5.0;
        float ifw = max(fwidth(indexScaled), 0.0008);
        float indexDist = abs(fract(indexScaled - 0.5) - 0.5) / ifw;
        float indexLine = 1.0 - smoothstep(0.0, u_lineWidth * 1.6, indexDist);

        // Color palette for MINEGUARD's clean white + metallic amber-gold theme:
        // Base / low valleys: warm slate-tan
        vec3 lowColor = vec3(0.68, 0.65, 0.60);
        // Mid ridges: rich warm amber-gold
        vec3 midColor = vec3(0.85, 0.47, 0.04);
        // High crests / peaks: deep burnished bronze-gold
        vec3 highColor = vec3(0.71, 0.33, 0.04);

        vec3 lineColor = mix(lowColor, midColor, smoothstep(0.2, 0.6, h));
        lineColor = mix(lineColor, highColor, smoothstep(0.6, 0.9, h));

        // Blend line opacity
        float alpha = clamp(line * 0.28 + indexLine * 0.48, 0.0, 0.72);

        gl_FragColor = vec4(lineColor, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Resize handler
    const updateSize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      uniforms.u_resolution.value.set(width, height);
    };
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);



    // IntersectionObserver to pause when off-screen
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(container);

    // Animation loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisibleRef.current) return;

      const delta = clock.getDelta();
      if (!prefersReducedMotion) {
        uniforms.u_time.value += delta;
      }

      renderer.render(scene, camera);
    };

    if (prefersReducedMotion) {
      // Render single frame for accessibility
      renderer.render(scene, camera);
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [scale, levels, lineWidth]);

  return (
    <div
      className={`mg-contour-field ${className}`}
      ref={containerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="mg-contour-field__canvas" />
    </div>
  );
};
