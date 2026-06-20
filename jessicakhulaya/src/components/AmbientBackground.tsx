"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { COLORS } from "@/styles/tokens";

export default function AmbientBackground() {
  // ─── Interactive Mouse Move Parallax ───
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 40, damping: 22, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Map to distinct coordinate shifts for multi-plane depth
  const blob1X = useTransform(smoothX, [-0.5, 0.5], [-60, 60]);
  const blob1Y = useTransform(smoothY, [-0.5, 0.5], [-60, 60]);

  const blob2X = useTransform(smoothX, [-0.5, 0.5], [80, -80]);
  const blob2Y = useTransform(smoothY, [-0.5, 0.5], [80, -80]);

  const blob3X = useTransform(smoothX, [-0.5, 0.5], [-40, 40]);
  const blob3Y = useTransform(smoothY, [-0.5, 0.5], [40, -40]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to a range of -0.5 to 0.5 relative to the center of the screen
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden pointer-events-none bg-[#120A07]">
      {/* ─── Paper Texture Overlay ─── */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* ─── Moving Cinematic Blur Blobs (GPU Accelerated & Mouse-Driven) ─── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Blob 1: Terracotta Deep */}
        <motion.div 
          style={{ 
            x: blob1X, 
            y: blob1Y, 
            backgroundColor: COLORS.terracottaLight,
            left: "-10%",
            top: "10%"
          }}
          className="absolute w-[60vw] h-[60vw] rounded-full filter blur-[120px] opacity-25 animate-blob-one"
        />

        {/* Blob 2: Wood Brown */}
        <motion.div 
          style={{ 
            x: blob2X, 
            y: blob2Y, 
            backgroundColor: COLORS.woodBrownLight,
            right: "-5%",
            bottom: "15%"
          }}
          className="absolute w-[50vw] h-[50vw] rounded-full filter blur-[100px] opacity-20 animate-blob-two"
        />

        {/* Blob 3: Gold/Amber highlights */}
        <motion.div 
          style={{ 
            x: blob3X, 
            y: blob3Y, 
            backgroundColor: COLORS.burntGoldDark,
            left: "30%",
            top: "40%"
          }}
          className="absolute w-[40vw] h-[40vw] rounded-full filter blur-[140px] opacity-15 animate-blob-three"
        />
      </div>

      {/* ─── Subtle African Geometric Watermark ─── */}
      <div className="absolute inset-0 opacity-[0.025] mix-blend-screen select-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern 
              id="bg-african-pattern" 
              width="60" 
              height="60" 
              patternUnits="userSpaceOnUse"
            >
              {/* Diamond grid */}
              <path 
                d="M 30 0 L 60 30 L 30 60 L 0 30 Z" 
                fill="none" 
                stroke="#FAF5F0" 
                strokeWidth="1.2" 
              />
              <path 
                d="M 30 10 L 50 30 L 30 50 L 10 30 Z" 
                fill="none" 
                stroke="#FAF5F0" 
                strokeWidth="0.6" 
                strokeDasharray="2,2"
              />
              {/* Central symbol */}
              <circle cx="30" cy="30" r="3" fill="#FAF5F0" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-african-pattern)" />
        </svg>
      </div>

      {/* ─── Side Graphic: Left vertical tribal line border ─── */}
      <div className="absolute left-0 top-0 h-full w-[2px] opacity-20 hidden md:block">
        <div 
          className="h-full w-full"
          style={{
            background: `linear-gradient(to bottom, transparent, ${COLORS.burntGoldLight}, transparent)`
          }}
        />
      </div>
    </div>
  );
}
