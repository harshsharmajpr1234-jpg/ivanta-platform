'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export function Hero3DShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Mouse interaction for smooth 3D perspective tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smooth tilt angles (-6deg to +6deg for ultra-subtle Apple feel)
    const rotateY = ((x - centerX) / centerX) * 6;
    const rotateX = -((y - centerY) / centerY) * 6;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  // Subtle floating breathing effect
  useEffect(() => {
    if (isHovered) return;
    let frame: number;
    let start = performance.now();

    const animate = (now: number) => {
      const time = (now - start) / 1000;
      setRotate({
        x: Math.sin(time * 0.8) * 1.6,
        y: Math.cos(time * 0.6) * 2.2,
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
      className="relative flex items-center justify-center select-none"
      style={{ perspective: '1200px' }}
      aria-label="Interactive 3D Apple Showcase"
    >
      {/* Subtle soft ambient glow */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-full opacity-40 blur-3xl -z-10 bg-radial from-slate-200/60 to-transparent"
      />

      {/* 3D Floating Artwork */}
      <div
        className="relative flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        <div
          className="relative w-full max-w-[520px] rounded-2xl overflow-hidden shadow-2xl shadow-black/8 transition-all duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(10px)',
          }}
        >
          <Image
            src="/hero-3d-apple-studio-white.jpg"
            alt="iVanta Apple 3D Device Showcase - Certified Pre-Owned iPhone, Apple Watch and AirPods"
            width={1200}
            height={896}
            priority
            className="w-full h-auto object-cover transition-transform duration-700 hover:scale-[1.02]"
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
    </div>
  );
}
