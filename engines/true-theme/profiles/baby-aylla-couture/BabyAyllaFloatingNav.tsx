"use client";

import React, { useState } from "react";
import { CoutureBowIcon } from "./BabyAyllaCoutureIcons";

interface BabyAyllaFloatingNavProps {
  onBackToCover: () => void;
}

export function BabyAyllaFloatingNav({ onBackToCover }: BabyAyllaFloatingNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { label: "Início", href: "#inicio" },
    { label: "História", href: "#historia" },
    { label: "Data", href: "#data" },
    { label: "Guia de Estilo", href: "#dress-code" },
    { label: "Detalhes", href: "#detalhes" },
    { label: "RSVP", href: "#rsvp" },
  ];

  const handleScroll = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label="Navegação da edição Baby Aylla"
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3"
    >
      {/* Expanded Menu Dropdown */}
      {isOpen && (
        <div className="bg-[#FCF9F6]/95 backdrop-blur-md border border-[#DFBA73]/40 rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5 w-48 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 px-3 py-1 text-[10px] tracking-[0.25em] text-[#7A6662] uppercase font-bold border-b border-[#DFBA73]/20 mb-1">
            <CoutureBowIcon size={14} />
            <span>Dior Collection</span>
          </div>

          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => handleScroll(link.href)}
              className="text-left px-3 py-1.5 text-xs text-[#523F3C] hover:text-[#C87A6E] hover:bg-[#ECCBC0]/20 rounded-lg transition-colors font-medium font-sans"
            >
              {link.label}
            </button>
          ))}
          <div className="h-[1px] bg-[#DFBA73]/20 my-1" />
          <button
            onClick={() => {
              setIsOpen(false);
              onBackToCover();
            }}
            className="text-left px-3 py-1.5 text-xs text-[#7A6662] hover:text-[#C87A6E] hover:bg-[#ECCBC0]/20 rounded-lg transition-colors flex items-center justify-between font-sans"
          >
            <span>Ver Capa</span>
            <CoutureBowIcon size={14} />
          </button>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBackToCover}
          aria-label="Voltar à Capa"
          className="w-10 h-10 rounded-full bg-[#FCF9F6]/95 border border-[#DFBA73]/60 shadow-lg text-[#4A3B39] hover:text-[#C87A6E] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="Ver Capa"
        >
          <CoutureBowIcon size={18} />
        </button>

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Fechar Menu" : "Abrir Menu"}
          className="w-12 h-12 rounded-full bg-[#C87A6E] hover:bg-[#B86B60] text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/40 cursor-pointer"
        >
          {isOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
