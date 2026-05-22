"use client";

/**
 * Animated Particle Globe
 *
 * Canvas-based 3D dotted globe that rotates continuously.
 * Inspired by Tria.so footer globe. Lightweight — no Three.js.
 */

import React, { useRef, useEffect, useCallback } from "react";

interface GlobeProps {
  size?: number;
  dotColor?: string;
  dotSize?: number;
  speed?: number;
  className?: string;
}

export default function Globe({
  size = 400,
  dotColor = "rgba(255,255,255,0.6)",
  dotSize = 1.2,
  speed = 0.003,
  className,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Set canvas resolution
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.42;
    const rotation = rotationRef.current;

    // Generate dots on sphere surface using fibonacci sphere
    const numDots = 800;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    // Collect dots with z-depth for back-to-front rendering
    const dots: { x: number; y: number; z: number; alpha: number }[] = [];

    for (let i = 0; i < numDots; i++) {
      const theta = Math.acos(1 - (2 * (i + 0.5)) / numDots);
      const phi = (2 * Math.PI * i) / goldenRatio + rotation;

      // 3D coordinates
      const x3d = Math.sin(theta) * Math.cos(phi);
      const y3d = Math.cos(theta);
      const z3d = Math.sin(theta) * Math.sin(phi);

      // Only render front-facing dots (z > threshold for slight wrap)
      if (z3d < -0.15) continue;

      // Project to 2D
      const scale = 1 + z3d * 0.3; // subtle depth
      const x = cx + x3d * radius;
      const y = cy + y3d * radius;
      const alpha = 0.1 + z3d * 0.6; // fade backside dots

      dots.push({ x, y, z: z3d, alpha: Math.max(0.05, alpha) });
    }

    // Sort by z (back to front)
    dots.sort((a, b) => a.z - b.z);

    // Draw dots
    for (const dot of dots) {
      const s = dotSize * (0.5 + dot.z * 0.8);
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, Math.max(0.3, s), 0, Math.PI * 2);
      ctx.fillStyle = dotColor.replace(/[\d.]+\)$/, `${dot.alpha.toFixed(2)})`);
      ctx.fill();
    }

    // Draw horizontal latitude lines (dotted arcs)
    const latLines = 8;
    for (let l = 1; l < latLines; l++) {
      const latAngle = (Math.PI * l) / latLines;
      const r = radius * Math.sin(latAngle);
      const yPos = cy + radius * Math.cos(latAngle);

      // Draw arc as dots
      const arcDots = Math.floor(r * 0.4);
      for (let a = 0; a < arcDots; a++) {
        const angle = (2 * Math.PI * a) / arcDots + rotation;
        const z = Math.sin(latAngle) * Math.sin(angle);

        if (z < -0.05) continue;

        const xPos = cx + r * Math.cos(angle);
        const alpha = 0.03 + z * 0.08;

        ctx.beginPath();
        ctx.arc(xPos, yPos, 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0.02, alpha).toFixed(2)})`;
        ctx.fill();
      }
    }

    // Glow effect at center
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 1.1);
    glow.addColorStop(0, "rgba(124,58,237,0.02)");
    glow.addColorStop(1, "rgba(124,58,237,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    rotationRef.current += speed;
    animRef.current = requestAnimationFrame(draw);
  }, [dotColor, dotSize, speed]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: size,
        height: size,
        display: "block",
      }}
    />
  );
}
