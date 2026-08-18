"use client";

import { motion, useReducedMotion } from "motion/react";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

type QueenDoorsOfLightProps = {
  /** closed | opening — drives door + inner light animation */
  open: boolean;
  className?: string;
};

/**
 * As Portas da Luz — portal arquitectónico local da Queen.
 * Duas portas de igreja estilizadas; luz champagne/dourada por detrás.
 */
export function QueenDoorsOfLight({
  open,
  className = "",
}: QueenDoorsOfLightProps) {
  const reduceMotion = useReducedMotion();
  const opening = open && !reduceMotion;

  return (
    <div
      className={`queen-doors ${className}`}
      aria-hidden="true"
      data-open={open ? "true" : "false"}
    >
      {/* Inner sacred light — grows as doors open */}
      <motion.div
        className="queen-doors__inner-light"
        initial={false}
        animate={{
          opacity: opening ? 1 : 0.48,
          scale: opening ? 1.42 : 1,
        }}
        transition={{ duration: opening ? 2.4 : 1.3, ease: QUEEN_EASE }}
      />

      <div className="queen-doors__perspective">
        {/* Architectural arch frame */}
        <svg
          className="queen-doors__frame"
          viewBox="0 0 320 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="queen-door-frame-stroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={QUEEN_COLORS.goldLight} stopOpacity="0.95" />
              <stop offset="50%" stopColor={QUEEN_COLORS.goldMatte} stopOpacity="0.8" />
              <stop offset="100%" stopColor={QUEEN_COLORS.champagne} stopOpacity="0.45" />
            </linearGradient>
          </defs>
          {/* Outer arch */}
          <path
            d="M28 470 V168 C28 78 78 28 160 28 C242 28 292 78 292 168 V470"
            stroke="url(#queen-door-frame-stroke)"
            strokeWidth="1.4"
            fill="none"
          />
          {/* Inner arch reveal edge */}
          <path
            d="M42 470 V170 C42 90 90 44 160 44 C230 44 278 90 278 170 V470"
            stroke={QUEEN_COLORS.champagne}
            strokeWidth="0.7"
            strokeOpacity="0.55"
            fill="none"
          />
          {/* Apex keystone hint */}
          <circle
            cx="160"
            cy="36"
            r="2.2"
            fill={QUEEN_COLORS.goldMatte}
            opacity="0.55"
          />
        </svg>

        {/* Door panels */}
        <div className="queen-doors__leafs">
          <motion.div
            className="queen-doors__leaf queen-doors__leaf--left"
            initial={false}
            animate={
              reduceMotion
                ? { opacity: open ? 0 : 1 }
                : {
                    rotateY: opening ? -78 : 0,
                    x: opening ? "-7%" : "0%",
                    opacity: opening ? 0.55 : 1,
                  }
            }
            transition={{
              duration: reduceMotion ? 0.7 : 2.75,
              ease: QUEEN_EASE,
            }}
            style={{ transformOrigin: "left center" }}
          >
            <DoorFace side="left" />
          </motion.div>

          <motion.div
            className="queen-doors__leaf queen-doors__leaf--right"
            initial={false}
            animate={
              reduceMotion
                ? { opacity: open ? 0 : 1 }
                : {
                    rotateY: opening ? 78 : 0,
                    x: opening ? "7%" : "0%",
                    opacity: opening ? 0.55 : 1,
                  }
            }
            transition={{
              duration: reduceMotion ? 0.7 : 2.75,
              ease: QUEEN_EASE,
            }}
            style={{ transformOrigin: "right center" }}
          >
            <DoorFace side="right" />
          </motion.div>
        </div>
      </div>

      {/* Vertical axis of light */}
      <motion.div
        className="queen-doors__axis"
        initial={false}
        animate={{
          opacity: opening ? 0.85 : 0.4,
          scaleY: opening ? 1.08 : 1,
        }}
        transition={{ duration: 1.5, ease: QUEEN_EASE }}
      />

      {/* Dust of light — extremely discreet */}
      {!reduceMotion && (
        <div className="queen-doors__motes">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}

function DoorFace({ side }: { side: "left" | "right" }) {
  return (
    <div className={`queen-doors__face queen-doors__face--${side}`}>
      <div className="queen-doors__face-shine" />
      <div className="queen-doors__panel queen-doors__panel--upper" />
      <div className="queen-doors__panel queen-doors__panel--lower" />
      {/* Subtle cross motif — linear, reverent */}
      <div className="queen-doors__cross" aria-hidden="true">
        <span className="queen-doors__cross-v" />
        <span className="queen-doors__cross-h" />
      </div>
      <div className="queen-doors__edge" />
    </div>
  );
}
