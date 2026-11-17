"use client";

import React, { useState, useRef, useEffect } from "react";
import { Wine, Send, Check } from "lucide-react";
import { triggerCelebrationConfetti } from "./AlexandrinaKennethAmbient";

const DRINK_OPTIONS = [
  { id: "cerveja", label: "Cerveja", icon: "🍺" },
  { id: "vinho", label: "Vinho", icon: "🍷" },
  { id: "whisky", label: "Whisky", icon: "🥃" },
  { id: "gin", label: "Gin", icon: "🍸" },
  { id: "refrigerante", label: "Refrigerante", icon: "🥤" },
  { id: "agua", label: "Água", icon: "💧" },
  { id: "sumos", label: "Sumos", icon: "🧃" },
  { id: "cocktail-sem-alcool", label: "Cocktail sem álcool", icon: "🍹" },
];

const WHATSAPP_DRINKS_NUMBER = "258840000000";

export function AlexandrinaKennethDrinks() {
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const multiselectRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        multiselectRef.current &&
        !multiselectRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDrink = (id: string) => {
    setSelectedDrinks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setError(null);
  };

  const getTriggerText = () => {
    if (selectedDrinks.length === 0) return "Selecionar bebidas";
    if (selectedDrinks.length === 1) {
      const drink = DRINK_OPTIONS.find((d) => d.id === selectedDrinks[0]);
      return drink?.label || "1 selecionada";
    }
    return `${selectedDrinks.length} selecionadas`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 3) {
      setError("Por favor, insere o teu nome completo (mínimo 3 caracteres)");
      return;
    }

    if (!table.trim()) {
      setError("Por favor, indica a tua mesa");
      return;
    }

    if (selectedDrinks.length === 0) {
      setError("Por favor, seleciona pelo menos uma bebida");
      return;
    }

    setError(null);

    const drinkLabels = selectedDrinks
      .map((id) => {
        const item = DRINK_OPTIONS.find((d) => d.id === id);
        return item ? `${item.icon} ${item.label}` : id;
      })
      .join(", ");

    const now = new Date();
    const formattedDate = now.toLocaleDateString("pt-MZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("pt-MZ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const text = `🍷 *PEDIDO DE BEBIDAS - CASAMENTO ALEXANDRINA & KENNETH* 🍷

Nome: ${name.trim()}
Mesa: ${table.trim()}
Bebidas selecionadas: ${drinkLabels}
${message.trim() ? `Observações: ${message.trim()}\n` : ""}
Data: ${formattedDate} às ${formattedTime}`;

    const url = `https://wa.me/${WHATSAPP_DRINKS_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    triggerCelebrationConfetti();
    setToastMessage("Pedido enviado para o bar com sucesso! 🥂");
    setTimeout(() => setToastMessage(null), 4000);

    // Reset form
    setName("");
    setTable("");
    setSelectedDrinks([]);
    setMessage("");
  };

  return (
    <div
      className="panel drink-box drink-box--premium panel--bebidas-layout relative"
      id="bebidas"
      aria-labelledby="bebidas-heading"
    >
      <div>
        <h3 id="bebidas-heading" className="flex items-center gap-2">
          <Wine className="drink-icon text-[#d4af37]" size={22} aria-hidden="true" />
          Pedido de Bebidas
        </h3>
        <p>
          Durante o copo de água, pede as tuas bebidas favoritas à nossa equipa sem saíres do teu lugar.
        </p>

        {error && (
          <div className="drink-error mb-3 text-red-500 text-xs font-semibold" role="alert">
            {error}
          </div>
        )}

        <form className="drink-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group mb-3">
            <input
              type="text"
              placeholder="O teu nome"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              required
              aria-label="O teu nome"
              className="w-full"
            />
          </div>

          <div className="form-group mb-3">
            <input
              type="text"
              placeholder="Ex.: Mesa 8"
              value={table}
              onChange={(e) => {
                setTable(e.target.value);
                setError(null);
              }}
              required
              aria-label="Número ou identificação da mesa"
              className="w-full"
            />
          </div>

          <div className="form-group mb-3 relative" ref={multiselectRef}>
            <button
              type="button"
              className="multiselect-trigger w-full flex items-center justify-between text-left cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span>{getTriggerText()}</span>
              <span className="arrow text-xs text-[#d4af37]">{isDropdownOpen ? "▲" : "▼"}</span>
            </button>

            {isDropdownOpen && (
              <div
                className="multiselect-dropdown absolute top-full left-0 right-0 z-30 bg-white border border-[#d4af37]/30 rounded-xl shadow-xl max-h-56 overflow-y-auto mt-1 p-2"
                role="listbox"
              >
                {DRINK_OPTIONS.map((drink) => {
                  const isSelected = selectedDrinks.includes(drink.id);
                  return (
                    <div
                      key={drink.id}
                      onClick={() => toggleDrink(drink.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        isSelected
                          ? "bg-[#fff8f0] text-[#b8941f] font-semibold"
                          : "hover:bg-black/5 text-[#2c2c2c]"
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="flex items-center gap-2">
                        <span>{drink.icon}</span>
                        <span>{drink.label}</span>
                      </span>
                      {isSelected && <Check size={14} className="text-[#d4af37]" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="form-group mb-4">
            <textarea
              rows={2}
              placeholder="Ex.: prefiro bebida fresca..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-label="Observações para o bar"
              className="w-full"
            />
          </div>

          <button
            type="submit"
            className="submit cursor-pointer flex items-center justify-center gap-2 w-full"
            id="submitDrinkOrder"
          >
            <Send size={15} />
            <span>Pedir Bebidas</span>
          </button>
        </form>

        {toastMessage && (
          <div
            className="drink-toast absolute top-4 left-4 right-4 bg-[#1a1a1a] text-[#d4af37] p-3 rounded-xl text-center text-xs font-semibold shadow-lg border border-[#d4af37]/30 z-20"
            role="status"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
