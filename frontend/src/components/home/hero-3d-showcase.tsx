'use client';

import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, BatteryCharging, Sparkles, Camera, PackageCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type TitaniumFinish = 'natural' | 'blue' | 'black' | 'white';

interface FinishConfig {
  name: string;
  dotColor: string;
  rimGradient: string;
  backGradient: string;
  accentGlow: string;
  wallpaper: string;
}

const FINISHES: Record<TitaniumFinish, FinishConfig> = {
  natural: {
    name: 'Natural Titanium',
    dotColor: '#b8afa2',
    rimGradient: 'linear-gradient(135deg, #e4ddd1 0%, #b8afa2 50%, #8e8477 100%)',
    backGradient: 'linear-gradient(145deg, #ded7cb, #c5bcad, #9a9082)',
    accentGlow: 'rgba(184, 175, 162, 0.25)',
    wallpaper: 'from-amber-900/30 via-slate-900 to-black',
  },
  blue: {
    name: 'Blue Titanium',
    dotColor: '#2f3c4f',
    rimGradient: 'linear-gradient(135deg, #495a75 0%, #2f3c4f 50%, #1a222e 100%)',
    backGradient: 'linear-gradient(145deg, #37465c, #263244, #141a24)',
    accentGlow: 'rgba(47, 60, 79, 0.35)',
    wallpaper: 'from-sky-900/40 via-blue-950 to-black',
  },
  black: {
    name: 'Black Titanium',
    dotColor: '#2b2c30',
    rimGradient: 'linear-gradient(135deg, #44454a 0%, #2b2c30 50%, #151618 100%)',
    backGradient: 'linear-gradient(145deg, #323337, #202123, #111213)',
    accentGlow: 'rgba(30, 30, 35, 0.3)',
    wallpaper: 'from-zinc-800/40 via-zinc-950 to-black',
  },
  white: {
    name: 'White Titanium',
    dotColor: '#e3e4e6',
    rimGradient: 'linear-gradient(135deg, #ffffff 0%, #d8d9dc 50%, #b2b4b8 100%)',
    backGradient: 'linear-gradient(145deg, #f8f9fa, #e6e7ea, #c8cad0)',
    accentGlow: 'rgba(227, 228, 230, 0.35)',
    wallpaper: 'from-indigo-100/40 via-slate-900 to-black',
  },
};

export function Hero3DShowcase() {
  const [finish, setFinish] = useState<TitaniumFinish>('natural');
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cur = FINISHES[finish];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D perspective tilt (-14 to +14 deg)
    const rotateY = ((x - centerX) / centerX) * 14;
    const rotateX = -((y - centerY) / centerY) * 14;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setGlare((g) => ({ ...g, opacity: 0 }));
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Subtle auto-float tilt animation when idle
  useEffect(() => {
    if (isHovered) return;
    let frame: number;
    let time = 0;
    const animate = () => {
      time += 0.02;
      setRotate({
        x: Math.sin(time) * 3,
        y: Math.cos(time * 0.8) * 5,
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
      className="relative flex flex-col items-center justify-center select-none py-6 lg:py-10"
      style={{ perspective: '1100px' }}
      aria-label="Interactive 3D Apple Device Showcase"
    >
      {/* Ambient background soft glow */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-[40px] opacity-70 blur-3xl transition-all duration-700 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${cur.accentGlow}, transparent 70%)`,
        }}
      />

      {/* Floating 3D Device Container */}
      <div
        className="relative flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {/* ========================================================= */}
        {/* 3D FLOATING TRUST BADGES (Parallax Layer Z: 50px - 70px) */}
        {/* ========================================================= */}

        {/* Badge 1: 85%+ Battery (Top-Right) */}
        <div
          className="absolute -right-3 sm:-right-8 -top-4 sm:-top-2 z-30 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-white/95 px-3 py-2 shadow-pop backdrop-blur-md transition-all duration-300 hover:scale-105"
          style={{
            transform: 'translateZ(65px)',
          }}
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
          className="absolute -left-3 sm:-left-8 top-10 sm:top-14 z-30 flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-white/95 px-3 py-2 shadow-pop backdrop-blur-md transition-all duration-300 hover:scale-105"
          style={{
            transform: 'translateZ(55px)',
          }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Eye className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-blue-700">Display QC</p>
            <p className="text-[12px] font-black text-ink">True Tone & OLED Pass</p>
          </div>
        </div>

        {/* Badge 3: Camera OIS (Bottom-Left) */}
        <div
          className="absolute -left-2 sm:-left-6 bottom-16 sm:bottom-20 z-30 flex items-center gap-2 rounded-2xl border border-violet-500/20 bg-white/95 px-3 py-2 shadow-pop backdrop-blur-md transition-all duration-300 hover:scale-105"
          style={{
            transform: 'translateZ(60px)',
          }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Camera className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-violet-700">Optics Tested</p>
            <p className="text-[12px] font-black text-ink">48MP Sensor-Shift OIS</p>
          </div>
        </div>

        {/* Badge 4: Open Box Delivery (Bottom-Right) */}
        <div
          className="absolute -right-2 sm:-right-6 bottom-6 sm:bottom-8 z-30 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-white/95 px-3 py-2 shadow-pop backdrop-blur-md transition-all duration-300 hover:scale-105"
          style={{
            transform: 'translateZ(70px)',
          }}
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
        {/* 3D iPHONE 15 PRO MAX CHASSIS                              */}
        {/* ========================================================= */}
        <div
          className="relative w-[230px] sm:w-[270px] md:w-[290px] aspect-[1/2.05] rounded-[48px] sm:rounded-[54px] p-[3px] shadow-2xl transition-all duration-500"
          style={{
            background: cur.rimGradient,
            boxShadow: `0 25px 60px -15px rgba(0,0,0,0.25), 0 0 40px ${cur.accentGlow}`,
            transformStyle: 'preserve-3d',
            transform: 'translateZ(20px)',
          }}
        >
          {/* Outer Titanium Bezel Accent Ring */}
          <div className="relative h-full w-full rounded-[45px] sm:rounded-[51px] p-[7px] sm:p-[8px] bg-black overflow-hidden">
            
            {/* Screen Inner Bezel */}
            <div
              className={cn(
                'relative h-full w-full rounded-[38px] sm:rounded-[44px] overflow-hidden bg-gradient-to-br',
                cur.wallpaper
              )}
            >
              {/* Dynamic Island Pill */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-between h-5 w-24 rounded-full bg-black px-2 ring-1 ring-white/10 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse" />
                <span className="text-[8.5px] font-mono font-bold text-white/90">iVanta QC</span>
                <span className="h-2 w-2 rounded-full bg-sky-500/80" />
              </div>

              {/* Status Bar */}
              <div className="absolute top-1.5 inset-x-5 flex justify-between text-[9px] font-semibold text-white/70 z-10">
                <span>9:41</span>
                <span>5G · 100%</span>
              </div>

              {/* Wallpaper Graphic / Lockscreen Display */}
              <div className="relative h-full w-full flex flex-col items-center justify-center p-4 text-center">
                {/* Wallpaper Radial Glow */}
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background: `radial-gradient(ellipse at 50% 40%, ${cur.dotColor}88, transparent 65%)`,
                  }}
                />

                {/* Apple Certified Logo Mark */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 p-2 backdrop-blur-md ring-1 ring-white/20 shadow-lg">
                    <img src="/logo-icon.png" alt="iVanta" className="h-full w-full object-contain" />
                  </div>
                  <p className="mt-3 text-[14px] font-black tracking-tight text-white drop-shadow-md">
                    iPhone 15 Pro Max
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-white/80 tracking-wide uppercase">
                    Grade A+ Certified
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10.5px] font-semibold text-white backdrop-blur-sm ring-1 ring-white/20">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>32-Point Inspected</span>
                  </div>
                </div>

                {/* Bottom Home Indicator Bar */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-white/70" />
              </div>

              {/* Photorealistic Specular Glare / Glass Reflection Sheen */}
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-20"
                style={{
                  background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 55%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Subtle Cast Shadow Under 3D Phone */}
        <div
          className="absolute -bottom-6 w-3/4 h-8 rounded-full blur-xl opacity-40 transition-all duration-300"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.6), transparent 70%)',
            transform: 'translateZ(-30px)',
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* 4 TITANIUM COLOR SELECTOR PILLS                           */}
      {/* ========================================================= */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Available Finish: <span className="text-ink font-extrabold">{cur.name}</span>
        </p>

        <div className="flex items-center gap-2.5 rounded-full border border-line bg-white/90 p-1.5 shadow-sm backdrop-blur-md">
          {(Object.keys(FINISHES) as TitaniumFinish[]).map((key) => {
            const f = FINISHES[key];
            const active = finish === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFinish(key)}
                aria-label={`Select ${f.name}`}
                className={cn(
                  'group relative flex h-7 w-7 items-center justify-center rounded-full transition-transform',
                  active ? 'scale-110 ring-2 ring-accent ring-offset-2' : 'hover:scale-105'
                )}
              >
                <span
                  className="h-5 w-5 rounded-full border border-black/10 shadow-inner"
                  style={{ backgroundColor: f.dotColor }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
