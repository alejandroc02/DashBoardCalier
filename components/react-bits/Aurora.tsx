import React, { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";

const VERTEX = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
`;

const FRAGMENT = `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  varying vec2 vUv;

  void main() {
    float t = uTime * 0.2;
    vec2 uv = vUv;
    
    float n = sin(uv.x * 10.0 + t) * sin(uv.y * 10.0 + t);
    vec3 color = mix(uColor1, uColor2, uv.x + n * 0.1);
    color = mix(color, uColor3, uv.y + n * 0.1);
    
    gl_FragColor = vec4(color, 0.15); // Subtle opacity
  }
`;

const Aurora: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const renderer = new Renderer({ alpha: true });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new Color("#F1F5F9") }, // Lightest slate
        uColor2: { value: new Color("#E2E8F0") }, // Soft grey
        uColor3: { value: new Color("#CBD5E1") }, // Muted blue-grey
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
    };
    window.addEventListener("resize", resize);
    resize();

    let request: number;
    const update = (t: number) => {
      request = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    };
    request = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(request);
      container.removeChild(gl.canvas);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 -z-10 bg-[#020617]" />;
};

export default Aurora;
