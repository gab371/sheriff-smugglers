import React from "react";
import type { Card } from "../../core/types";

interface CardViewProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  selectable?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  onClick,
  selected = false,
  selectable = true,
}) => {
  const isContraband = card.type === 'CONTRABAND';

  return (
    <div
      onClick={selectable ? onClick : undefined}
      className={`relative w-28 h-40 rounded-xl flex flex-col justify-between p-2.5 transition-all duration-200 select-none ${
        selectable ? 'cursor-pointer hover:-translate-y-2 active:scale-95' : ''
      } ${
        isContraband
          ? "bg-gradient-to-b from-[#3a110a] to-[#250a06] border-2 border-red-700/80 shadow-md shadow-red-950/20"
          : "bg-gradient-to-b from-[#f4e4bc] to-[#dfcb9b] border-2 border-[#b59b65] text-[#2c1e14]"
      } ${
        selected
          ? "ring-4 ring-[#e5a93b] scale-105 -translate-y-2 border-transparent"
          : ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-col gap-0.5 text-[9px] font-bold uppercase tracking-wider border-b border-[#523628]/10 pb-1">
        <span className={`whitespace-nowrap ${isContraband ? "text-red-400" : "text-[#7d5635]"}`}>
          {isContraband ? "🚨 Contrebande" : "📜 Légal"}
        </span>
        <span className={`text-[10px] font-extrabold truncate ${isContraband ? "text-amber-100/90" : "text-[#2c1e14]"}`} title={card.name}>
          {card.name}
        </span>
      </div>

      {/* Center Icon */}
      <div className="flex justify-center items-center my-auto">
        <span className={`text-4xl filter drop-shadow-md select-none`}>
          {card.icon}
        </span>
      </div>

      {/* Footer */}
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
