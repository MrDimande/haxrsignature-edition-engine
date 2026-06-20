"use client";

import React, { useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useApp } from "@/lib/context";
import { kalimbaPlayer } from "@/lib/audio";
import { COLORS } from "@/styles/tokens";

export default function AudioToggle() {
  const { audioEnabled, setAudioEnabled, introComplete } = useApp();

  // Cleanup apenas ao desmontar a página (não interromper durante navegação interna)
  useEffect(() => {
    return () => {
      kalimbaPlayer?.stop();
    };
  }, []);

  const handleToggle = async () => {
    if (!kalimbaPlayer) return;

    if (audioEnabled) {
      kalimbaPlayer.stop();
      setAudioEnabled(false);
    } else {
      const started = await kalimbaPlayer.start();
      setAudioEnabled(started);
    }
  };

  // Only display the floating audio control after the user enters the ceremony
  if (!introComplete) return null;

  return (
    <button
      onClick={handleToggle}
      className="fixed top-6 right-6 z-40 flex items-center gap-3.5 px-4 py-2 border border-[#FAF5F0]/10 rounded-none bg-[#120A07]/60 backdrop-blur-md text-[#FAF5F0] hover:text-[#FAF5F0] hover:border-[#D4AF37]/45 cursor-pointer transition-all duration-500 ease-out select-none"
      aria-label="Toggle ambient audio"
    >
      {/* Wave Bars Indicator */}
      <div className="flex items-end gap-1 h-3.5 w-5">
        <span 
          className={`w-[1.5px] bg-[#FAF5F0] transition-all rounded-[0.5px] ${audioEnabled ? "animate-audio-bar-1 origin-bottom" : "h-1"}`}
          style={{ backgroundColor: audioEnabled ? COLORS.burntGoldLight : "#FAF5F0", height: audioEnabled ? undefined : "4px" }}
        />
        <span 
          className={`w-[1.5px] bg-[#FAF5F0] transition-all rounded-[0.5px] ${audioEnabled ? "animate-audio-bar-2 origin-bottom" : "h-2"}`}
          style={{ backgroundColor: audioEnabled ? COLORS.burntGoldLight : "#FAF5F0", height: audioEnabled ? undefined : "8px" }}
        />
        <span 
          className={`w-[1.5px] bg-[#FAF5F0] transition-all rounded-[0.5px] ${audioEnabled ? "animate-audio-bar-3 origin-bottom" : "h-1.5"}`}
          style={{ backgroundColor: audioEnabled ? COLORS.burntGoldLight : "#FAF5F0", height: audioEnabled ? undefined : "6px" }}
        />
        <span 
          className={`w-[1.5px] bg-[#FAF5F0] transition-all rounded-[0.5px] ${audioEnabled ? "animate-audio-bar-4 origin-bottom" : "h-3"}`}
          style={{ backgroundColor: audioEnabled ? COLORS.burntGoldLight : "#FAF5F0", height: audioEnabled ? undefined : "11px" }}
        />
      </div>

      {/* Text Label */}
      <span className="font-body text-[9px] uppercase tracking-[0.25em] font-light hidden sm:inline">
        {audioEnabled ? "Som On" : "Som Off"}
      </span>

      {/* Icon */}
      {audioEnabled ? (
        <Volume2 size={13} className="text-[#D4AF37]" />
      ) : (
        <VolumeX size={13} className="text-[#FAF5F0]/70" />
      )}
    </button>
  );
}
