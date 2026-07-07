"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useExperience } from "./context";

export function AmbientBackground() {
  const { theme } = useExperience();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 40, damping: 22, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const blob1X = useTransform(smoothX, [-0.5, 0.5], [-60, 60]);
  const blob1Y = useTransform(smoothY, [-0.5, 0.5], [-60, 60]);
  const blob2X = useTransform(smoothX, [-0.5, 0.5], [80, -80]);
  const blob2Y = useTransform(smoothY, [-0.5, 0.5], [80, -80]);

  const isGrid = theme.visuals.shapes === "grid";
  const isGlass = theme.visuals.shapes === "glass";

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden pointer-events-none">
      {isGrid && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${theme.colors.accent} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.accent} 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      )}

      {!isGrid && (
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            style={{
              x: blob1X,
              y: blob1Y,
              backgroundColor: theme.palette.blob1,
              left: "-10%",
              top: "10%",
            }}
            className={`absolute w-[60vw] h-[60vw] ${isGlass ? "rounded-2xl" : "rounded-full"} filter blur-[120px] opacity-35 animate-blob-one`}
          />
          <motion.div
            style={{
              x: blob2X,
              y: blob2Y,
              backgroundColor: theme.palette.blob2,
              right: "-5%",
              bottom: "15%",
            }}
            className={`absolute w-[50vw] h-[50vw] ${isGlass ? "rounded-3xl" : "rounded-full"} filter blur-[100px] opacity-30 animate-blob-two`}
          />
          <motion.div
            style={{
              backgroundColor: theme.palette.blob3,
              left: "30%",
              top: "40%",
            }}
            className={`absolute w-[40vw] h-[40vw] ${isGlass ? "rounded-xl" : "rounded-full"} filter blur-[140px] opacity-25 animate-blob-three`}
          />
        </div>
      )}

      {theme.structure !== "minimal" && (
        <>
          <div className="absolute left-0 top-0 h-full w-px opacity-10 hidden md:block">
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(to bottom, transparent, ${theme.colors.accent}, transparent)`,
              }}
            />
          </div>
          <div className="absolute right-0 top-0 h-full w-px opacity-10 hidden md:block">
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(to bottom, transparent, ${theme.colors.accent}, transparent)`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
