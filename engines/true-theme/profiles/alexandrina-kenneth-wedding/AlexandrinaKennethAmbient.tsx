"use client";

import React, { useEffect, useRef } from "react";

export function AlexandrinaKennethAmbient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Gold particles
    const particleCount = Math.min(35, Math.floor(width / 35));
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.5 - 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * 0.02 + 0.005,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += Math.sin(Date.now() * p.pulse) * 0.005;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0.1, Math.min(0.65, p.opacity))})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(212, 175, 55, 0.45)";
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 opacity-70"
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}
      />
      <div id="confettiContainer" className="confetti-container pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true" />
      <div id="floatingHearts" className="floating-hearts-container pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true" />
      <div id="sparkleContainer" className="sparkle-container pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true" />
    </>
  );
}

/** Global confetti trigger matching original celebrateSuccess / triggerConfetti */
export function triggerCelebrationConfetti() {
  if (typeof document === "undefined") return;

  const colors = ["#4CAF50", "#D4AF37", "#9C27B0", "#FF5722", "#E8B4B8", "#FFD700"];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div");
      confetti.style.cssText = `
        position: fixed;
        top: -12px;
        left: ${Math.random() * 100}%;
        width: ${Math.random() * 6 + 6}px;
        height: ${Math.random() * 6 + 6}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        pointer-events: none;
        z-index: 10000;
        animation: confettiFall ${Math.random() * 1.5 + 2.5}s linear forwards;
      `;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 4000);
    }, i * 25);
  }
}

