"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type GoldButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "px-5 py-2 text-xs tracking-[0.15em]",
  md: "px-7 py-3 text-sm tracking-[0.2em]",
  lg: "px-9 py-4 text-sm tracking-[0.25em]",
};

export function GoldButton({
  children,
  variant = "solid",
  size = "md",
  className = "",
  disabled,
  ...props
}: GoldButtonProps) {
  const base =
    "relative overflow-hidden rounded-sm font-montserrat font-semibold uppercase transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]";

  const variants = {
    solid:
      "bg-gold text-deep-black shadow-gold-glow hover:bg-gold-light",
    outline:
      "border border-gold/60 bg-transparent text-gold hover:bg-gold/10 hover:border-gold",
  };

  return (
    <button
      className={`${base} ${sizeClasses[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {variant === "solid" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      )}
    </button>
  );
}
