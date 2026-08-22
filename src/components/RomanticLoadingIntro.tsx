import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

interface RomanticLoadingIntroProps {
  onComplete: () => void;
  herName?: string;
  introName?: string;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  targetAlpha: number;
  sparkleSpeed: number;
  sparklePhase: number;
  isStar: boolean;
  angle: number;
  speed: number;
  distance: number;
  layer: number; // 0: background dust, 1: heart contour, 2: heart fill, 3: trailing sparks
}

export const RomanticLoadingIntro: React.FC<RomanticLoadingIntroProps> = ({
  onComplete,
  herName = 'Special One',
  introName,
}) => {
  const displayIntroName = (introName || '').trim() || herName;
  const introBadge = displayIntroName.startsWith('For ') || displayIntroName.startsWith('for ') ? displayIntroName : `For ${displayIntroName}`;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'gathering' | 'formed' | 'beating' | 'exploding' | 'complete'>('initial');
  const [showText, setShowText] = useState(false);
  const [isExpandingOut, setIsExpandingOut] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Time tracker for precise script choreography
  const startTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lock body/html scrolling while Intro is open and restore on unmount
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

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle Palette
    const colors = [
      '#e879f9', // Pink / Orchid
      '#c084fc', // Purple / Violet
      '#f43f5e', // Rose
      '#fb7185', // Soft Rose
      '#a855f7', // Neon Purple
      '#fef08a', // Warm Gold highlight
      '#ffffff', // Crisp white sparkle
    ];

    // Mathematical Parametric Heart coordinates generator
    // x = 16 * sin^3(t)
    // y = -(13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t))
    const getHeartPoint = (t: number, scale: number = 14) => {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      return {
        x: x * scale,
        y: y * scale,
      };
    };

    // Calculate responsive scale for heart
    const heartScale = Math.min(width, height) < 600 ? 9.5 : 14.5;
    const centerX = width / 2;
    const centerY = height / 2 - 20;

    // Create particles
    const totalHeartParticles = 480;
    const backgroundStarsCount = 70;
    const particles: Particle[] = [];

    // 1. Generate Background Floating Stars & Bokeh Dust
    for (let i = 0; i < backgroundStarsCount; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      particles.push({
        x: rx,
        y: ry,
        originX: rx,
        originY: ry,
        targetX: rx,
        targetY: ry,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() < 0.2 ? 2.5 : Math.random() < 0.6 ? 1.5 : 0.9,
        color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#fef08a' : '#e879f9',
        alpha: 0.1 + Math.random() * 0.7,
        targetAlpha: 0.7,
        sparkleSpeed: 0.02 + Math.random() * 0.04,
        sparklePhase: Math.random() * Math.PI * 2,
        isStar: true,
        angle: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.3,
        distance: 0,
        layer: 0,
      });
    }

    // 2. Generate Heart Outline & Internal Constellation Particles
    for (let i = 0; i < totalHeartParticles; i++) {
      const t = (i / totalHeartParticles) * Math.PI * 2;
      const isContour = i < 280;

      let target: { x: number; y: number };
      if (isContour) {
        // Outline of the heart
        const pt = getHeartPoint(t, heartScale);
        target = { x: centerX + pt.x, y: centerY + pt.y };
      } else {
        // Soft inner volume / cloud of the heart
        const pt = getHeartPoint(t, heartScale);
        const innerRatio = Math.sqrt(Math.random()) * 0.85;
        target = {
          x: centerX + pt.x * innerRatio + (Math.random() - 0.5) * 8,
          y: centerY + pt.y * innerRatio + (Math.random() - 0.5) * 8,
        };
      }

      // Initial scatter position (scattered far and floating in stardust field)
      const scatterAngle = Math.random() * Math.PI * 2;
      const scatterDist = 120 + Math.random() * (Math.max(width, height) * 0.55);
      const startX = centerX + Math.cos(scatterAngle) * scatterDist;
      const startY = centerY + Math.sin(scatterAngle) * scatterDist;

      particles.push({
        x: startX,
        y: startY,
        originX: startX,
        originY: startY,
        targetX: target.x,
        targetY: target.y,
        vx: 0,
        vy: 0,
        size: Math.random() < 0.15 ? 3.0 : Math.random() < 0.5 ? 2.0 : 1.2,
        color: colors[i % colors.length],
        alpha: 0,
        targetAlpha: 0.85 + Math.random() * 0.15,
        sparkleSpeed: 0.03 + Math.random() * 0.05,
        sparklePhase: Math.random() * Math.PI * 2,
        isStar: Math.random() < 0.35,
        angle: scatterAngle,
        speed: 0.015 + Math.random() * 0.02,
        distance: scatterDist,
        layer: isContour ? 1 : 2,
      });
    }

    startTimeRef.current = performance.now();

    // Render / Animation Loop
    const render = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000; // in seconds

      ctx.clearRect(0, 0, width, height);

      // Phase State Transitions
      if (elapsed < 1.0) {
        // 0.0s - 1.0s: Initial ambient float
      } else if (elapsed >= 1.0 && elapsed < 3.0) {
        // 1.0s - 3.0s: Gathering toward center to form the heart outline & fill
        setAnimationPhase('gathering');
      } else if (elapsed >= 3.0 && elapsed < 3.5) {
        // 3.0s: Formed & fully glowing
        setAnimationPhase('formed');
        setShowText(true);
      } else if (elapsed >= 3.5 && elapsed < 4.5) {
        // 3.5s - 4.5s: Heart beats gently 2 times
        setAnimationPhase('beating');
        setShowText(true);
      } else if (elapsed >= 4.5 && elapsed < 5.0) {
        // 4.5s - 5.0s: Intense soft glow
        setShowText(false);
      } else if (elapsed >= 5.0 && elapsed < 5.6) {
        // 5.0s - 5.5s: Expand outward with smooth light/particle transition
        setAnimationPhase('exploding');
        setIsExpandingOut(true);
      } else if (elapsed >= 5.6) {
        // Transition finished
        if (!isFinished) {
          setIsFinished(true);
          onComplete();
        }
        return;
      }

      // Calculate Heartbeat / Pulse Factor
      let beatScale = 1.0;
      let beatGlow = 1.0;

      if (elapsed >= 3.5 && elapsed < 4.5) {
        // 2 rhythmic heartbeats over 1.0 second (two peak pulses at ~3.7s and ~4.1s)
        const beatProgress = (elapsed - 3.5) / 1.0; // 0 to 1
        const pulse = Math.sin(beatProgress * Math.PI * 4); // 2 full waves
        if (pulse > 0) {
          beatScale = 1.0 + pulse * 0.085;
          beatGlow = 1.0 + pulse * 0.7;
        }
      } else if (elapsed >= 4.5 && elapsed < 5.0) {
        // Radiating brightness before explosion
        const brighten = (elapsed - 4.5) / 0.5;
        beatScale = 1.0 + brighten * 0.12;
        beatGlow = 1.0 + brighten * 1.5;
      } else if (elapsed >= 5.0) {
        // Expansion phase
        const expandFactor = (elapsed - 5.0) / 0.55;
        beatScale = 1.0 + Math.pow(expandFactor, 2) * 8.0;
        beatGlow = Math.max(0, 1.0 - expandFactor * 1.2);
      }

      // 1. Draw glowing neon path tracing (Reference Image 2 stroke with moving comet tip)
      if (elapsed >= 1.0 && elapsed < 5.0) {
        const traceProgress = Math.min(1.0, Math.max(0, (elapsed - 1.0) / 1.8)); // complete by 2.8s

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(beatScale, beatScale);

        // Neon Glow Pass 1: Outer Soft Violet Halo
        ctx.beginPath();
        const steps = 180;
        const currentSteps = Math.floor(steps * traceProgress);

        for (let s = 0; s <= currentSteps; s++) {
          const t = (s / steps) * Math.PI * 2;
          const pt = getHeartPoint(t, heartScale);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }

        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 25 * beatGlow;
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.4 * beatGlow})`;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Neon Glow Pass 2: Sharp Inner Pink/White Core
        ctx.beginPath();
        for (let s = 0; s <= currentSteps; s++) {
          const t = (s / steps) * Math.PI * 2;
          const pt = getHeartPoint(t, heartScale);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12 * beatGlow;
        ctx.strokeStyle = `rgba(255, 230, 245, ${0.9 * beatGlow})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Glowing Comet Tip Head (As seen in Reference Image 2)
        if (traceProgress < 1.0 && currentSteps > 0) {
          const headT = (currentSteps / steps) * Math.PI * 2;
          const headPt = getHeartPoint(headT, heartScale);

          const radGrad = ctx.createRadialGradient(headPt.x, headPt.y, 0, headPt.x, headPt.y, 22);
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
          radGrad.addColorStop(0.3, 'rgba(236, 72, 153, 0.9)');
          radGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.4)');
          radGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(headPt.x, headPt.y, 22, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // 2. Update and Render All Stardust Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.layer === 0) {
          // Ambient background stars
          p.sparklePhase += p.sparkleSpeed;
          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const currentAlpha = 0.2 + Math.abs(Math.sin(p.sparklePhase)) * 0.7;

          ctx.save();
          ctx.globalAlpha = currentAlpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }

        // Heart Particles (layer 1 & 2)
        if (elapsed < 1.0) {
          // Slow floating idle
          p.x = p.originX + Math.sin(now * 0.001 + i) * 6;
          p.y = p.originY + Math.cos(now * 0.001 + i) * 6;
          p.alpha = Math.min(p.targetAlpha * 0.5, (elapsed / 1.0) * 0.5);
        } else if (elapsed >= 1.0 && elapsed < 3.0) {
          // Converge towards heart outline target coordinates
          const gatherProgress = (elapsed - 1.0) / 2.0; // 0 to 1
          // Smooth easeInOutCubic
          const ease =
            gatherProgress < 0.5
              ? 4 * gatherProgress * gatherProgress * gatherProgress
              : 1 - Math.pow(-2 * gatherProgress + 2, 3) / 2;

          p.x = p.originX + (p.targetX - p.originX) * ease;
          p.y = p.originY + (p.targetY - p.originY) * ease;
          p.alpha = 0.4 + ease * 0.6;
        } else if (elapsed >= 3.0 && elapsed < 5.0) {
          // Lock to Heart with pulse / beat scaling
          const dx = p.targetX - centerX;
          const dy = p.targetY - centerY;

          p.x = centerX + dx * beatScale + Math.sin(now * 0.003 + i) * 1.2;
          p.y = centerY + dy * beatScale + Math.cos(now * 0.003 + i) * 1.2;

          p.sparklePhase += p.sparkleSpeed * 1.5;
          p.alpha = 0.5 + Math.abs(Math.sin(p.sparklePhase)) * 0.5 * beatGlow;
        } else if (elapsed >= 5.0) {
          // Outward explosion / expansion
          const dx = p.targetX - centerX;
          const dy = p.targetY - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const speed = (elapsed - 5.0) * 18;

          p.x += (dx / dist) * speed * (1.2 + (i % 5) * 0.4);
          p.y += (dy / dist) * speed * (1.2 + (i % 5) * 0.4);
          p.alpha = Math.max(0, 1.0 - (elapsed - 5.0) * 2.2);
        }

        // Draw Particle
        if (p.alpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, p.alpha);
          ctx.fillStyle = p.color;

          if (p.isStar && p.size > 1.8) {
            // Draw four-point diamond star sparkle
            ctx.translate(p.x, p.y);
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8 * beatGlow;

            ctx.beginPath();
            const s = p.size * (1 + Math.sin(p.sparklePhase) * 0.3);
            ctx.moveTo(0, -s * 1.8);
            ctx.quadraticCurveTo(0, 0, s * 1.8, 0);
            ctx.quadraticCurveTo(0, 0, 0, s * 1.8);
            ctx.quadraticCurveTo(0, 0, -s * 1.8, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s * 1.8);
            ctx.fill();
          } else {
            // Soft circular particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (beatScale > 1.2 ? beatScale * 0.8 : 1), 0, Math.PI * 2);
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6 * beatGlow;
            ctx.fill();
          }

          ctx.restore();
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsExpandingOut(true);
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    skipTimeoutRef.current = setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[1000] w-full h-[100dvh] min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#02010b] select-none">
      {/* 1. Deep Romantic Atmospheric Background (Directly from Reference Image 1) */}
      {/* Dark Cosmic Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#02010c] via-[#08051e] to-[#04010a]" />

      {/* Large Soft Blurred Romantic Bokeh Orbs (Matching Image 1's soft blue, purple, magenta spheres) */}
      <div className="absolute top-[10%] left-[12%] w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] bg-[#1d4ed8]/25 rounded-full blur-[80px] sm:blur-[110px] animate-pulse pointer-events-none" />
      <div className="absolute top-[18%] right-[15%] w-[260px] sm:w-[380px] h-[260px] sm:h-[380px] bg-[#be185d]/25 rounded-full blur-[85px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[25%] w-[320px] sm:w-[480px] h-[320px] sm:h-[480px] bg-[#7e22ce]/20 rounded-full blur-[90px] sm:blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[240px] sm:w-[350px] h-[240px] sm:h-[350px] bg-[#0284c7]/20 rounded-full blur-[75px] sm:blur-[100px] pointer-events-none" />

      {/* 2. Full-Screen Canvas for Neon Stardust Heart & Floating Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-10" />

      {/* 3. Romantic Central Warm Aura Glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] rounded-full pointer-events-none transition-all duration-700 ${
          animationPhase === 'beating' || animationPhase === 'formed'
            ? 'bg-gradient-to-r from-pink-500/25 via-purple-500/30 to-amber-400/20 blur-[90px] scale-110'
            : 'bg-gradient-to-r from-pink-500/10 via-purple-500/15 to-transparent blur-[70px] scale-90'
        }`}
      />

      {/* 4. Elegant Optional Text: "Something special is waiting for you…" */}
      <AnimatePresence>
        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.5 } }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute bottom-16 sm:bottom-20 left-0 right-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none"
          >
            <p className="font-serif italic text-sm sm:text-base md:text-lg text-pink-100/90 tracking-wide drop-shadow-[0_2px_12px_rgba(244,63,94,0.6)]">
              “Something special is waiting for you…”
            </p>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5 mt-2 text-[11px] uppercase tracking-[0.25em] text-pink-300/60 font-mono"
            >
              <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
              <span>{introBadge}</span>
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Smooth Light Glow Expansion Flash (Final Step: Stardust → Heart → Heart Glow → Birthday Website) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isExpandingOut ? 1 : 0,
        }}
        transition={{ duration: 0.65, ease: 'easeInOut' }}
        className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-tr from-pink-500/40 via-purple-600/50 to-white/90 backdrop-blur-xl"
      />

      {/* 6. Subtle Skip Control */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-40 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] tracking-widest text-pink-200/70 hover:text-white uppercase transition-all backdrop-blur-md"
      >
        Skip Intro →
      </button>
    </div>
  );
};
