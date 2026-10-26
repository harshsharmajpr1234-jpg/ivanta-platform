'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ShieldCheck, BatteryCharging, Sparkles, Camera, PackageCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type TitaniumFinish = 'natural' | 'blue' | 'black' | 'white';

interface FinishConfig {
  name: string;
  dotColor: string;
  accentGlow: string;
}

const FINISHES: Record<TitaniumFinish, FinishConfig> = {
  natural: {
    name: 'Natural Titanium',
    dotColor: '#b8afa2',
    accentGlow: 'rgba(184, 175, 162, 0.35)',
  },
  blue: {
    name: 'Blue Titanium',
    dotColor: '#3a4b63',
    accentGlow: 'rgba(58, 75, 99, 0.4)',
  },
  black: {
    name: 'Black Titanium',
    dotColor: '#2b2c30',
    accentGlow: 'rgba(40, 40, 45, 0.35)',
  },
  white: {
    name: 'White Titanium',
    dotColor: '#e8e8ed',
    accentGlow: 'rgba(232, 232, 237, 0.5)',
  },
};

export function Hero3DShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [finish, setFinish] = useState<TitaniumFinish>('natural');
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const cur = FINISHES[finish];

  // Mouse interaction for 3D perspective tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smooth tilt angles (-10deg to +10deg)
    const rotateY = ((x - centerX) / centerX) * 10;
    const rotateX = -((y - centerY) / centerY) * 10;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  // Subtle breathing float animation when not hovered
  useEffect(() => {
    if (isHovered) return;
    let frame: number;
    let start = performance.now();

    const animate = (now: number) => {
      const time = (now - start) / 1000;
      setRotate({
        x: Math.sin(time * 0.9) * 2.5,
        y: Math.cos(time * 0.7) * 3.5,
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isHovered]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center justify-center select-none py-2 lg:py-6"
      style={{ perspective: '1100px' }}
      aria-label="Interactive 3D Apple Device Showcase"
    >
      {/* Ambient background studio daylight glow */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-full opacity-60 blur-3xl transition-all duration-700 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${cur.accentGlow}, transparent 70%)`,
        }}
      />

      {/* 3D Floating Canvas */}
      <div
        className="relative flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {/* ========================================================= */}
        {/* PARALLAX FLOATING QC TRUST BADGES                         */}
        {/* ========================================================= */}

        {/* Badge 1: 85%+ Battery (Top-Right) */}
        <div
          className="absolute -right-2 sm:-right-4 -top-3 sm:-top-2 z-30 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-white/95 px-3 py-2 shadow-pop backdrop-blur-md transition-transform duration-300 hover:scale-105"
          style={{ transform: 'translateZ(55px)' }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BatteryCharging className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">Health Guarantee</p>
            <p className="text-[12px] font-black text-ink">85%+ Apple Battery</p>
          </div>
        </div>

        {/* Badge 2: Retina OLED & True Tone (Top-Left) */}
        <div
          className="absolute -left-2 sm:-left-4 top-8 sm:top-12 z-30 flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-white/95 px-3 py-2 shadow-pop backdrop-blur-md transition-transform duration-300 hover:scale-105"
          style={{ transform: 'translateZ(50px)' }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Eye className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-blue-700">Display QC</p>
            <p className="text-[12px] font-black text-ink">True Tone & OLED Pass</p>
          </div>
        </div>

        {/* Badge 3: Open Box Delivery (Bottom-Right) */}
        <div
          className="absolute -right-2 sm:-right-4 bottom-4 sm:bottom-6 z-30 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-white/95 px-3 py-2 shadow-pop backdrop-blur-md transition-transform duration-300 hover:scale-105"
          style={{ transform: 'translateZ(60px)' }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <PackageCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-amber-700">Zero Risk</p>
            <p className="text-[12px] font-black text-ink">Open Box Delivery</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PHOTOREALISTIC CLEAN WHITE APPLE STUDIO 3D ARTWORK        */}
        {/* ========================================================= */}
        <div
          className="relative w-full max-w-[480px] sm:max-w-[540px] md:max-w-[580px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 bg-[#f3f3f5] border border-line"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(20px)',
          }}
        >
          <Image
            src="/hero-3d-apple-studio-white.jpg"
            alt="iVanta Apple 3D Device Showcase - Certified Pre-Owned iPhone 15 Pro, Apple Watch Ultra 2 & AirPods Pro"
            width={1200}
            height={896}
            priority
            className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
          />

          {/* Interactive cursor light sheen */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-20"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
            }}
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* TITANIUM COLOR SWITCHER PILL (Interactive)                */}
      {/* ========================================================= */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-line bg-white/90 px-3.5 py-1.5 shadow-soft backdrop-blur-md">
          <span className="text-[10.5px] uppercase font-bold tracking-wider text-ink-faint">
            Finish:
          </span>
          <div className="flex items-center gap-2">
            {(Object.keys(FINISHES) as TitaniumFinish[]).map((key) => {
              const f = FINISHES[key];
              const isActive = finish === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFinish(key)}
                  aria-label={`Select ${f.name}`}
                  title={f.name}
                  className={cn(
                    'relative h-5 w-5 rounded-full transition-all duration-300 focus:outline-hidden',
                    isActive
                      ? 'scale-125 ring-2 ring-accent ring-offset-2'
                      : 'hover:scale-110 opacity-70 hover:opacity-100'
                  )}
                  style={{
                    background: f.dotColor,
                    boxShadow: isActive ? `0 0 10px ${f.accentGlow}` : undefined,
                  }}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-full border border-white/60" />
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-bold text-ink transition-all duration-300 pl-1">
            {cur.name}
          </span>
        </div>

        <p className="text-[11px] text-ink-faint">
          ✦ Interactive 3D perspective — Move cursor to inspect angles
        </p>
      </div>
    </div>
  );
}
