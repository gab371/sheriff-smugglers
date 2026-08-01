import React from "react";
import type { Card } from "../../core/types";

interface CardViewProps {
  card?: Card;
  onClick?: () => void;
  selected?: boolean;
  selectable?: boolean;
  faceDown?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  onClick,
  selected = false,
  selectable = true,
  faceDown = false,
}) => {
  if (faceDown || !card) {
    return (
      <div
        className={`relative w-28 h-40 rounded-xl flex flex-col items-center justify-center select-none
          bg-gradient-to-br from-[#2d1b10] via-[#1c0f08] to-[#0c0704]
          border-2 border-[#b59b65]/70 shadow-lg shadow-black/50
          ${selectable && onClick ? "cursor-pointer hover:-translate-y-2 active:scale-95" : ""}`}
        onClick={selectable ? onClick : undefined}
        aria-hidden
      >
        <div className="absolute inset-2 rounded-lg border border-[#e5a93b]/25" />
        <span className="font-serif text-[#e5a93b] text-2xl tracking-widest drop-shadow-md">★</span>
        <span className="mt-1 text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#dfcb9b]/80">
          Sheriff
        </span>
      </div>
    );
  }

  const isContraband = card.type === "CONTRABAND";

  return (
    <div
      onClick={selectable ? onClick : undefined}
      className={`relative w-28 h-40 rounded-xl flex flex-col justify-between p-2.5 transition-all duration-200 select-none ${
        selectable ? "cursor-pointer hover:-translate-y-2 active:scale-95" : ""
      } ${
        isContraband
          ? "bg-gradient-to-b from-[#3a110a] to-[#250a06] border-2 border-red-700/80 shadow-lg shadow-red-950/40"
          : "bg-gradient-to-b from-[#f4e4bc] to-[#dfcb9b] border-2 border-[#b59b65] text-[#2c1e14] shadow-lg shadow-amber-950/30"
      } ${
        selected
          ? "ring-4 ring-[#e5a93b] scale-105 -translate-y-2 border-transparent shadow-xl shadow-[#e5a93b]/30"
          : ""
      }`}
    >
      <div className="flex flex-col gap-0.5 text-[9px] font-bold uppercase tracking-wider border-b border-[#523628]/10 pb-1">
        <span className={`whitespace-nowrap ${isContraband ? "text-red-400" : "text-[#7d5635]"}`}>
          {isContraband ? "🚨 Contrebande" : "📜 Légal"}
        </span>
        <span
          className={`text-[10px] font-extrabold truncate ${isContraband ? "text-amber-100/90" : "text-[#2c1e14]"}`}
          title={card.name}
        >
          {card.name}
        </span>
      </div>

      <div className="flex justify-center items-center my-auto">
        <span className="text-4xl filter drop-shadow-md select-none">{card.icon}</span>
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold border-t border-[#523628]/10 pt-1">
        <span
          className={`flex items-center gap-0.5 ${
            isContraband ? "text-yellow-400" : "text-[#27ae60]"
          }`}
          title="Valeur de vente au stand"
        >
          +{card.value} 🪙
        </span>
        <span
          className="text-red-500 flex items-center gap-0.5"
          title="Amende en cas d'inspection"
        >
          -{card.fine} 🪙
        </span>
      </div>
    </div>
  );
};
