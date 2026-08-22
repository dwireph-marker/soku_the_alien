import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

interface RomanticLoadingIntroProps {
  onComplete: () => void;
  herName?: string;
  introName?: string;
}

interface PrecomputedParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  baseSize: number;
  colorIndex: number;
  targetAlpha: number;
  sparkleSpeed: number;
  sparklePhase: number;
  isStar: boolean;
  layer: number; // 0: background star, 1: heart contour, 2: heart fill
  fillThreshold: number; // 0 to 1 for progressive fill reveal
  idleAngle: number;
  idleSpeed: number;
  scatterDist: number;
}

const PALETTE = [
  '#e879f9', // Pink / Orchid
  '#c084fc', // Purple / Violet
  '#f43f5e', // Rose
  '#fb7185', // Soft Rose
  '#a855f7', // Neon Purple
  '#fef08a', // Warm Gold
  '#ffffff', // Crisp White
];

// Mathematical Parametric Heart coordinates generator
// x = 16 * sin^3(t)
// y = -(13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t))
function getHeartPoint(t: number, scale: number) {
  const sinT = Math.sin(t);
  const x = 16 * sinT * sinT * sinT;
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return {
    x: x * scale,
    y: y * scale,
  };
}

// Pre-create offscreen sprite textures for ultra-fast GPU blitting (no per-frame shadowBlur)
function createParticleSprites(): {
  circleSprites: HTMLCanvasElement[];
  starSprites: HTMLCanvasElement[];
} {
  const circleSprites: HTMLCanvasElement[] = [];
  const starSprites: HTMLCanvasElement[] = [];

  const spriteSize = 48; // crisp resolution for cached texture
  const center = spriteSize / 2;

  PALETTE.forEach((color) => {
    // 1. Glowing Circle Sprite
    const cCanvas = document.createElement('canvas');
    cCanvas.width = spriteSize;
    cCanvas.height = spriteSize;
    const cCtx = cCanvas.getContext('2d');
    if (cCtx) {
      const grad = cCtx.createRadialGradient(center, center, 0, center, center, center * 0.95);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, color);
      grad.addColorStop(0.65, color + '55'); // transparent tail
      grad.addColorStop(1, color + '00');

      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.arc(center, center, center * 0.95, 0, Math.PI * 2);
      cCtx.fill();
    }
    circleSprites.push(cCanvas);

    // 2. Glowing 4-point Diamond Star Sprite
    const sCanvas = document.createElement('canvas');
    sCanvas.width = spriteSize;
    sCanvas.height = spriteSize;
    const sCtx = sCanvas.getContext('2d');
    if (sCtx) {
      // Soft radial glow behind star
      const bgGrad = sCtx.createRadialGradient(center, center, 0, center, center, center * 0.9);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.3, color + '99');
      bgGrad.addColorStop(1, color + '00');
      sCtx.fillStyle = bgGrad;
      sCtx.beginPath();
      sCtx.arc(center, center, center * 0.85, 0, Math.PI * 2);
      sCtx.fill();

      // Sharp 4-point diamond star core
      sCtx.fillStyle = '#ffffff';
      sCtx.beginPath();
      const r = center * 0.75;
      sCtx.moveTo(center, center - r);
      sCtx.quadraticCurveTo(center, center, center + r, center);
      sCtx.quadraticCurveTo(center, center, center, center + r);
      sCtx.quadraticCurveTo(center, center, center - r, center);
      sCtx.quadraticCurveTo(center, center, center, center - r);
      sCtx.fill();
    }
    starSprites.push(sCanvas);
  });

  return { circleSprites, starSprites };
}

export const RomanticLoadingIntro: React.FC<RomanticLoadingIntroProps> = ({
  onComplete,
  herName = 'Special One',
  introName,
}) => {
  const displayIntroName = (introName || '').trim() || herName;
  const introBadge =
    displayIntroName.startsWith('For ') || displayIntroName.startsWith('for ')
      ? displayIntroName
      : `For ${displayIntroName}`;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showText, setShowText] = useState(false);
  const [isExpandingOut, setIsExpandingOut] = useState(false);
  const [isHeartFormed, setIsHeartFormed] = useState(false);

  const startTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spritesRef = useRef<{ circleSprites: HTMLCanvasElement[]; starSprites: HTMLCanvasElement[] } | null>(null);

  // Cached particles and contour points to prevent per-frame recreation
  const particlesRef = useRef<PrecomputedParticle[]>([]);
  const contourPathRef = useRef<{ x: number; y: number }[]>([]);

  // Prevent scroll during loading
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Pre-render particle offscreen sprite cache once
    if (!spritesRef.current && typeof document !== 'undefined') {
      spritesRef.current = createParticleSprites();
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const updateCanvasDimensions = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
    };

    updateCanvasDimensions();

    const isMobile = width < 768;
    const heartScale = Math.min(width, height) < 600 ? 9.5 : 14.5;
    const centerX = width / 2;
    const centerY = height / 2 - 20;

    // Precompute contour path coordinates (120 steps is visually silky and fast)
    const contourSteps = 140;
    const contourPoints: { x: number; y: number }[] = [];
    for (let s = 0; s <= contourSteps; s++) {
      const t = (s / contourSteps) * Math.PI * 2;
      const pt = getHeartPoint(t, heartScale);
      contourPoints.push({ x: pt.x, y: pt.y });
    }
    contourPathRef.current = contourPoints;

    // Precompute particles once (Intelligently sized for performance)
    // Desktop: ~280 heart particles + 45 bg stars = 325 total
    // Mobile: ~140 heart particles + 25 bg stars = 165 total
    const heartParticleCount = isMobile ? 140 : 280;
    const backgroundStarsCount = isMobile ? 25 : 45;
    const contourCount = Math.floor(heartParticleCount * 0.6); // 60% outline, 40% fill
    const fillCount = heartParticleCount - contourCount;

    const newParticles: PrecomputedParticle[] = [];

    // 1. Precompute Background Ambient Dust & Stars
    for (let i = 0; i < backgroundStarsCount; i++) {
      const rx = (Math.sin(i * 99.7) * 0.5 + 0.5) * width;
      const ry = (Math.cos(i * 33.3) * 0.5 + 0.5) * height;
      newParticles.push({
        x: rx,
        y: ry,
        originX: rx,
        originY: ry,
        targetX: rx,
        targetY: ry,
        baseSize: i % 4 === 0 ? 3.0 : i % 2 === 0 ? 2.0 : 1.2,
        colorIndex: i % PALETTE.length,
        targetAlpha: 0.35 + (i % 5) * 0.1,
        sparkleSpeed: 0.02 + (i % 4) * 0.015,
        sparklePhase: (i * 1.3) % (Math.PI * 2),
        isStar: i % 3 === 0,
        layer: 0,
        fillThreshold: 0,
        idleAngle: (i * 0.7) % (Math.PI * 2),
        idleSpeed: 0.15 + (i % 3) * 0.08,
        scatterDist: 0,
      });
    }

    // 2. Precompute Heart Outline Particles
    for (let i = 0; i < contourCount; i++) {
      const t = (i / contourCount) * Math.PI * 2;
      const pt = getHeartPoint(t, heartScale);
      const scatterAngle = (i * 2.39996) % (Math.PI * 2); // Golden ratio scatter distribution
      const scatterDist = 90 + ((i * 37) % Math.max(width * 0.45, 180));
      const startX = centerX + Math.cos(scatterAngle) * scatterDist;
      const startY = centerY + Math.sin(scatterAngle) * scatterDist;

      // Fill order: bottom of the heart fills first to top lobes
      const normalizedY = (pt.y + 16 * heartScale) / (32 * heartScale);
      const fillProgression = Math.max(0, Math.min(1, 1 - normalizedY + ((i % 7) - 3) * 0.04));

      newParticles.push({
        x: startX,
        y: startY,
        originX: startX,
        originY: startY,
        targetX: centerX + pt.x,
        targetY: centerY + pt.y,
        baseSize: i % 5 === 0 ? 3.4 : i % 2 === 0 ? 2.4 : 1.6,
        colorIndex: i % PALETTE.length,
        targetAlpha: 0.85 + (i % 3) * 0.05,
        sparkleSpeed: 0.04 + (i % 4) * 0.015,
        sparklePhase: (i * 1.7) % (Math.PI * 2),
        isStar: i % 4 === 0,
        layer: 1,
        fillThreshold: fillProgression,
        idleAngle: scatterAngle,
        idleSpeed: 0.02 + (i % 3) * 0.01,
        scatterDist: scatterDist,
      });
    }

    // 3. Precompute Heart Interior Stardust Volume
    for (let i = 0; i < fillCount; i++) {
      const t = (i / fillCount) * Math.PI * 2;
      const pt = getHeartPoint(t, heartScale);
      // Stratified inner radius
      const innerRatio = Math.sqrt((i + 1) / fillCount) * 0.82;
      const jitterX = Math.sin(i * 17.1) * 6;
      const jitterY = Math.cos(i * 13.7) * 6;

      const tx = centerX + pt.x * innerRatio + jitterX;
      const ty = centerY + pt.y * innerRatio + jitterY;

      const scatterAngle = (i * 3.14159 + 1.2) % (Math.PI * 2);
      const scatterDist = 80 + ((i * 29) % Math.max(width * 0.4, 160));
      const startX = centerX + Math.cos(scatterAngle) * scatterDist;
      const startY = centerY + Math.sin(scatterAngle) * scatterDist;

      const normalizedY = (ty - centerY + 16 * heartScale) / (32 * heartScale);
      const fillProgression = Math.max(0, Math.min(1, 1 - normalizedY + ((i % 5) - 2) * 0.05));

      newParticles.push({
        x: startX,
        y: startY,
        originX: startX,
        originY: startY,
        targetX: tx,
        targetY: ty,
        baseSize: i % 6 === 0 ? 3.0 : i % 2 === 0 ? 2.0 : 1.4,
        colorIndex: (i + 2) % PALETTE.length,
        targetAlpha: 0.8 + (i % 3) * 0.07,
        sparkleSpeed: 0.035 + (i % 3) * 0.02,
        sparklePhase: (i * 2.1) % (Math.PI * 2),
        isStar: i % 5 === 0,
        layer: 2,
        fillThreshold: fillProgression,
        idleAngle: scatterAngle,
        idleSpeed: 0.02 + (i % 3) * 0.01,
        scatterDist: scatterDist,
      });
    }

    particlesRef.current = newParticles;

    // Resize Handler with Debounce
    let resizeTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateCanvasDimensions();
      }, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Tab Visibility Handler (Pause animation when hidden, resume when visible)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = 0;
        }
      } else {
        if (!animationFrameIdRef.current && !isFinishedRef.current) {
          animationFrameIdRef.current = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    startTimeRef.current = performance.now();
    let textTriggered = false;
    let formedTriggered = false;
    let expandTriggered = false;

    // Ultra-smooth 60fps Animation Loop
    const render = (now: number) => {
      const elapsed = prefersReducedMotion ? 3.5 : (now - startTimeRef.current) / 1000;

      // Handle discrete React UI state changes exactly once without re-rendering every frame
      if (elapsed >= 2.8 && !formedTriggered) {
        formedTriggered = true;
        setIsHeartFormed(true);
      }
      if (elapsed >= 3.0 && !textTriggered) {
        textTriggered = true;
        setShowText(true);
      }
      if (elapsed >= 4.6 && textTriggered && !expandTriggered) {
        setShowText(false);
      }
      if (elapsed >= 5.0 && !expandTriggered) {
        expandTriggered = true;
        setIsExpandingOut(true);
      }
      if (elapsed >= 5.6) {
        if (!isFinishedRef.current) {
          isFinishedRef.current = true;
          onComplete();
        }
        return;
      }

      // Reset transform & clear canvas efficiently
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Heartbeat pulse physics calculation
      let beatScale = 1.0;
      let beatGlow = 1.0;

      if (elapsed >= 3.5 && elapsed < 4.5) {
        // 2 silky rhythmic heartbeats (sinusoidal pulse waves)
        const beatProgress = (elapsed - 3.5) / 1.0;
        const pulse = Math.sin(beatProgress * Math.PI * 4);
        if (pulse > 0) {
          beatScale = 1.0 + pulse * 0.08;
          beatGlow = 1.0 + pulse * 0.6;
        }
      } else if (elapsed >= 4.5 && elapsed < 5.0) {
        // Soft aura crescendo before transition
        const brighten = (elapsed - 4.5) / 0.5;
        beatScale = 1.0 + brighten * 0.1;
        beatGlow = 1.0 + brighten * 1.2;
      } else if (elapsed >= 5.0) {
        // Smooth outward expansion
        const expandFactor = (elapsed - 5.0) / 0.55;
        beatScale = 1.0 + expandFactor * expandFactor * 6.5;
        beatGlow = Math.max(0, 1.0 - expandFactor * 1.3);
      }

      // 1. Draw Neon Heart Tracing (Contour path)
      if (elapsed >= 0.8 && elapsed < 5.0) {
        const traceProgress = Math.min(1.0, Math.max(0, (elapsed - 0.8) / 1.8)); // 0.8s to 2.6s
        const pts = contourPathRef.current;
        if (pts && pts.length > 1) {
          const maxIdx = pts.length - 1;
          const ptsToDraw = Math.min(maxIdx, Math.floor(pts.length * traceProgress));

          if (ptsToDraw >= 1 && pts[0]) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(beatScale, beatScale);

            // Neon Layer 1: Soft Outer Violet Glow Line
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let s = 1; s <= ptsToDraw; s++) {
              if (pts[s]) {
                ctx.lineTo(pts[s].x, pts[s].y);
              }
            }
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = `rgba(192, 132, 252, ${0.45 * beatGlow})`;
            ctx.stroke();

            // Neon Layer 2: Crisp Bright Core
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let s = 1; s <= ptsToDraw; s++) {
              if (pts[s]) {
                ctx.lineTo(pts[s].x, pts[s].y);
              }
            }
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = `rgba(255, 235, 248, ${0.85 * beatGlow})`;
            ctx.stroke();

            // Glowing Comet Head Particle Tip (Smooth tracer)
            const headIdx = Math.min(maxIdx, ptsToDraw);
            if (traceProgress < 1.0 && pts[headIdx]) {
              const headPt = pts[headIdx];
              const headSize = 24 * beatScale;
              if (spritesRef.current && spritesRef.current.circleSprites.length > 0) {
                const headSprite = spritesRef.current.circleSprites[0]; // Pink/orchid glow sprite
                ctx.drawImage(
                  headSprite,
                  headPt.x - headSize / 2,
                  headPt.y - headSize / 2,
                  headSize,
                  headSize
                );
              }
            }

            ctx.restore();
          }
        }
      }

      // 2. Render Particles via GPU Sprites (High FPS Texture Blitting)
      const particles = particlesRef.current;
      const sprites = spritesRef.current;

      if (sprites) {
        const { circleSprites, starSprites } = sprites;
        const numCircleSprites = circleSprites.length;
        const numStarSprites = starSprites.length;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // 2a. Background Ambient Stardust (Layer 0)
          if (p.layer === 0) {
            p.sparklePhase += p.sparkleSpeed;
            p.x += Math.sin(p.idleAngle) * p.idleSpeed;
            p.y += Math.cos(p.idleAngle) * p.idleSpeed;

            // Wrap screen boundary smoothly
            if (p.x < 0) p.x = width;
            else if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            else if (p.y > height) p.y = 0;

            const alpha = 0.2 + Math.abs(Math.sin(p.sparklePhase)) * p.targetAlpha;
            const size = p.baseSize * (1 + Math.sin(p.sparklePhase) * 0.25);
            const sprite = p.isStar
              ? starSprites[p.colorIndex % numStarSprites]
              : circleSprites[p.colorIndex % numCircleSprites];

            ctx.globalAlpha = alpha;
            ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
            continue;
          }

          // 2b. Heart Particles (Outline: Layer 1 & Fill: Layer 2)
          let currentAlpha = 0;
          let drawSize = p.baseSize;

          if (elapsed < 0.8) {
            // Ambient subtle floating before gather
            const idleTime = now * 0.001;
            p.x = p.originX + Math.sin(idleTime + i) * 4;
            p.y = p.originY + Math.cos(idleTime + i) * 4;
            currentAlpha = Math.min(0.4, (elapsed / 0.8) * 0.4);
          } else if (elapsed >= 0.8 && elapsed < 2.8) {
            // Smooth gathering into heart position
            const gatherProgress = (elapsed - 0.8) / 2.0; // 0 to 1
            // Smooth easeOutCubic
            const ease = 1 - Math.pow(1 - gatherProgress, 3);

            // Staggered reveal based on fillThreshold for bottom-to-top filling
            const fillStagger = Math.min(1, Math.max(0, (gatherProgress - p.fillThreshold * 0.4) / 0.6));
            p.x = p.originX + (p.targetX - p.originX) * ease;
            p.y = p.originY + (p.targetY - p.originY) * ease;
            currentAlpha = (0.35 + fillStagger * 0.65) * p.targetAlpha;
          } else if (elapsed >= 2.8 && elapsed < 5.0) {
            // Heart is fully formed and rhythmically pulsing
            const dx = p.targetX - centerX;
            const dy = p.targetY - centerY;
            p.x = centerX + dx * beatScale;
            p.y = centerY + dy * beatScale;

            p.sparklePhase += p.sparkleSpeed * 1.4;
            currentAlpha = (0.55 + Math.abs(Math.sin(p.sparklePhase)) * 0.45) * p.targetAlpha * beatGlow;
            drawSize = p.baseSize * (beatScale > 1.05 ? 1.2 : 1.0);
          } else if (elapsed >= 5.0) {
            // Outward stardust explosion transition
            const dx = p.targetX - centerX;
            const dy = p.targetY - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const explosionSpeed = (elapsed - 5.0) * 22;

            p.x += (dx / dist) * explosionSpeed * (1.1 + (i % 4) * 0.3);
            p.y += (dy / dist) * explosionSpeed * (1.1 + (i % 4) * 0.3);
            currentAlpha = Math.max(0, 1.0 - (elapsed - 5.0) * 2.3);
          }

          if (currentAlpha > 0.02) {
            const sprite = p.isStar
              ? starSprites[p.colorIndex % numStarSprites]
              : circleSprites[p.colorIndex % numCircleSprites];

            const renderWidth = drawSize * 4.5; // Sprite includes outer soft glow radius
            ctx.globalAlpha = Math.min(1, currentAlpha);
            ctx.drawImage(
              sprite,
              p.x - renderWidth / 2,
              p.y - renderWidth / 2,
              renderWidth,
              renderWidth
            );
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsExpandingOut(true);
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    skipTimeoutRef.current = setTimeout(() => {
      onComplete();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[1000] w-full h-[100dvh] min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#02010b] select-none">
      {/* 1. Deep Romantic Cosmic Background Gradient & Optimized Static Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#02010c] via-[#08051e] to-[#04010a]" />

      {/* 2. Soft Romantic Bokeh Atmosphere (Layered CSS with will-change: transform) */}
      <div className="absolute top-[10%] left-[12%] w-[260px] sm:w-[400px] h-[260px] sm:h-[400px] bg-[#1d4ed8]/20 rounded-full blur-[80px] sm:blur-[110px] pointer-events-none transform-gpu" />
      <div className="absolute top-[18%] right-[15%] w-[240px] sm:w-[360px] h-[240px] sm:h-[360px] bg-[#be185d]/20 rounded-full blur-[85px] sm:blur-[120px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-[15%] left-[25%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-[#7e22ce]/20 rounded-full blur-[90px] sm:blur-[130px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-[20%] right-[10%] w-[220px] sm:w-[330px] h-[220px] sm:h-[330px] bg-[#0284c7]/20 rounded-full blur-[75px] sm:blur-[100px] pointer-events-none transform-gpu" />

      {/* 3. GPU-Accelerated Canvas for Stardust Heart & Sparkling Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-10 pointer-events-none" />

      {/* 4. Central Romantic Aura Glow (Smooth CSS Transition without per-frame re-renders) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full pointer-events-none transition-all duration-1000 transform-gpu ${
          isHeartFormed
            ? 'bg-gradient-to-r from-pink-500/25 via-purple-500/30 to-amber-400/20 blur-[85px] scale-110 opacity-100'
            : 'bg-gradient-to-r from-pink-500/10 via-purple-500/15 to-transparent blur-[70px] scale-90 opacity-60'
        }`}
      />

      {/* 5. Bottom Text: "Something special is waiting for you…" */}
      <AnimatePresence>
        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.4 } }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute bottom-16 sm:bottom-20 left-0 right-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none"
          >
            <p className="font-serif italic text-sm sm:text-base md:text-lg text-pink-100/90 tracking-wide drop-shadow-[0_2px_12px_rgba(244,63,94,0.6)]">
              “Something special is waiting for you…”
            </p>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 mt-2 text-[11px] uppercase tracking-[0.25em] text-pink-300/60 font-mono"
            >
              <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
              <span>{introBadge}</span>
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Smooth Light Glow Expansion Flash for Page Transition */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isExpandingOut ? 1 : 0,
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-tr from-pink-500/40 via-purple-600/50 to-white/90 backdrop-blur-xl"
      />

      {/* 7. Subtle Skip Control */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-40 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] tracking-widest text-pink-200/70 hover:text-white uppercase transition-all backdrop-blur-md"
      >
        Skip Intro →
      </button>
    </div>
  );
};
