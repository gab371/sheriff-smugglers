import React from "react";
import type { GameState } from "../../core/types";

interface SpectatorViewProps {
  gameState: GameState;
  onDisconnect?: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  LOBBY: 'Saloon',
  MARKET_DRAW: 'Marché (Pioche & Défausse)',
  BAG_LOADING: 'Chargement du Sac',
  DECLARATION: 'Déclaration',
  INSPECTION: 'Inspection du Shérif',
  ROUND_END: 'Fin de Manche',
  GAME_OVER: 'Partie Terminée',
};

export const SpectatorView: React.FC<SpectatorViewProps> = ({ gameState, onDisconnect }) => {
  const sheriff = gameState.players[gameState.sheriffIndex] || gameState.players[0];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#2d1b10]/60 backdrop-blur-xl border border-[#523628]/60 rounded-3xl shadow-2xl text-amber-50">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👁</span>
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-sky-300 bg-clip-text text-transparent">
              Mode Spectateur
            </h1>
            <p className="text-xs text-amber-300/60">Vous observez la partie sans participer.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-full text-xs font-bold">
          {PHASE_LABELS[gameState.phase] || gameState.phase}
        </span>
      </div>

      {sheriff && (
        <p className="text-sm text-amber-200 mb-4">
          🤠 Shérif en poste : <strong>{sheriff.name}</strong> · Manche {gameState.roundNumber}/{gameState.totalRounds}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {gameState.players.map((p) => (
          <div key={p.id} className="p-3 rounded-2xl bg-[#1c0f08]/60 border border-[#523628]/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.avatar}</span>
                <span className="font-semibold text-amber-100">{p.name}</span>
                {p.id === sheriff?.id && <span className="text-xs text-[#e5a93b]">🤠 Shérif</span>}
              </div>
              <span className="text-xs text-amber-300/80 font-mono">{p.gold} 🪙</span>
            </div>
            <div className="text-[11px] text-amber-300/70">
              Étal : {Object.values(p.stand).reduce((n, arr) => n + arr.length, 0)} carte(s) · Contrabande : {p.contraband.length}
            </div>
            {gameState.bags[p.id] && (
              <div className="text-[11px] text-amber-400/70 mt-1">
                Sac : {gameState.bags[p.id].declaredCount} · {gameState.bags[p.id].status}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#1c0f08] border border-[#523628]/45 rounded-2xl p-3 max-h-48 overflow-y-auto">
        <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">Journal de la partie</div>
        <div className="space-y-1">
          {gameState.logs.slice(0, 12).map((l) => (
            <div key={l.id} className="text-[11px] text-amber-200/80">
              <span className="text-amber-500/60 font-mono mr-2">{l.timestamp}</span>{l.message}
            </div>
          ))}
          {gameState.logs.length === 0 && <div className="text-[11px] text-amber-500/50">Aucun événement.</div>}
        </div>
      </div>

      {gameState.winnerScores && gameState.winnerScores.length > 0 && (
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-2">Classement final</div>
          {gameState.winnerScores.map((s) => (
            <div key={s.playerId} className="text-sm text-amber-100">
              {s.avatar} {s.name} — <strong>{s.totalScore} pts</strong>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={onDisconnect}
          className="text-xs text-amber-500/50 hover:text-amber-300 underline transition-all"
        >
          Quitter le saloon
        </button>
      </div>
    </div>
  );
};
