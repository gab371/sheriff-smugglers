import React, { useState } from "react";
import type { Player } from "../../core/types";
import { Button } from "../ui/button";

interface LobbyProps {
  myPeerId: string | null;
  hostPeerId: string | null;
  status: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
  error: string | null;
  players: Player[];
  isHost: boolean;
  onHost: (name: string, avatar: string) => void;
  onJoin: (name: string, avatar: string, roomId: string) => void;
  onToggleReady: (ready: boolean) => void;
  onStartGame: () => void;
  onDisconnect: () => void;
  deckTheme?: 'WESTERN' | 'MEDIEVAL' | 'MODERN';
  onChangeDeckTheme?: (theme: 'WESTERN' | 'MEDIEVAL' | 'MODERN') => void;
}

const AVATARS = ["🤠", "👩‍🌾", "🧙‍♂️", "👨‍🍳", "👰‍♀️", "🤵‍♂️", "🌵", "🐎"];

export const Lobby: React.FC<LobbyProps> = ({
  myPeerId,
  hostPeerId,
  status,
  error,
  players,
  isHost,
  onHost,
  onJoin,
  onToggleReady,
  onStartGame,
  onDisconnect,
  deckTheme = 'WESTERN',
  onChangeDeckTheme,
}) => {
  const [name, setName] = useState(`Marchand_${Math.floor(Math.random() * 1000)}`);
  const [avatar, setAvatar] = useState("🤠");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [copied, setCopied] = useState(false);

  const localPlayer = players.find((p) => p.id === myPeerId);
  const isReady = localPlayer?.isReady || false;

  const handleCopy = () => {
    if (hostPeerId) {
      navigator.clipboard.writeText(hostPeerId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (status === 'CONNECTED' && myPeerId) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 bg-[#2d1b10]/60 backdrop-blur-xl border border-[#523628]/60 rounded-3xl shadow-2xl relative overflow-hidden text-amber-50">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
              Saloon : {hostPeerId}
            </h1>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-[#3b251b] hover:bg-[#523628] text-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-[#523628]/60"
              title="Copier le code"
            >
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
          <span className="px-3 py-1 bg-[#1c0f08] border border-[#523628]/60 rounded-full text-xs text-amber-400/80 font-mono">
            {isHost ? "SHÉRIF / HÔTE" : "MARCHAND"}
          </span>
        </div>
        <p className="text-amber-300/60 text-sm mb-6">Partagez ce code avec d'autres marchands pour les inviter au saloon.</p>

        {/* SÉLECTEUR DE THEME DE DECK */}
        <div className="bg-[#1c0f08] border border-[#523628]/45 rounded-2xl p-4 mb-6 flex flex-col gap-2">
          <div className="text-xs text-amber-500 font-bold uppercase tracking-widest">Thème du Deck</div>
          {isHost ? (
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['WESTERN', 'MEDIEVAL', 'MODERN'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onChangeDeckTheme?.(t)}
                  className={`text-xs py-2 px-1 rounded-xl border-2 font-bold transition-all ${
                    deckTheme === t
                      ? "bg-[#e5a93b] text-[#1c0f08] border-transparent"
                      : "bg-[#2d1b10] border-[#523628]/60 text-amber-200 hover:bg-[#3b251b]"
                  }`}
                >
                  {t === 'WESTERN' ? '🤠 Western' : t === 'MEDIEVAL' ? '🏰 Médiéval' : '🏙️ Moderne'}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-amber-200 font-semibold bg-[#2d1b10] p-2.5 rounded-xl border border-[#523628]/60 text-center text-sm">
              Actif : {deckTheme === 'WESTERN' ? '🤠 Western' : deckTheme === 'MEDIEVAL' ? '🏰 Médiéval' : '🏙️ Moderne'}
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold text-amber-100">Marchands connectés ({players.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#1c0f08]/40 border border-[#523628]/40"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.avatar}</span>
                  <div>
                    <span className="font-semibold text-amber-100">
                      {p.name} {p.id === myPeerId ? ' (Vous)' : ''}
                    </span>
                  </div>
                </div>
                <div>
                  {p.isHost ? (
                    <span className="inline-block w-24 text-center text-xs px-2.5 py-1 bg-amber-500/10 text-[#e5a93b] border border-amber-500/20 rounded-full font-semibold">
                      Hôte
                    </span>
                  ) : p.isReady ? (
                    <span className="inline-block w-24 text-center text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
                      Prêt
                    </span>
                  ) : (
                    <span className="inline-block w-24 text-center text-xs px-2.5 py-1 bg-[#2d1b10] text-amber-400/60 border border-[#523628]/40 rounded-full">
                      Attente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            className={`flex-1 font-bold h-12 border rounded-2xl transition-all ${
              isReady
                ? "bg-[#3b251b] hover:bg-[#523628] text-amber-500 border-[#523628]"
                : "bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] border-transparent shadow-md shadow-amber-500/10"
            }`}
            onClick={() => onToggleReady(!isReady)}
          >
            {isReady ? "Annuler Prêt" : "Je suis Prêt !"}
          </Button>

          {isHost && (
            <Button
              disabled={players.length < 2}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#2d1b10] disabled:opacity-50 text-white font-bold h-12 rounded-2xl shadow-md shadow-emerald-500/10 transition-all"
              onClick={onStartGame}
            >
              Lancer la Partie
            </Button>
          )}
        </div>

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
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-[#2d1b10]/60 backdrop-blur-xl border border-[#523628]/60 rounded-3xl shadow-2xl relative overflow-hidden text-amber-50">
      <div className="text-center mb-8">
        <span className="text-5xl inline-block mb-3 animate-bounce">🤠</span>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent whitespace-nowrap">
          SHERIFF & SMUGGLERS
        </h1>
        <p className="text-xs uppercase tracking-widest text-amber-400/60 mt-2 font-semibold">
          Saloon P2P Multi-joueurs
        </p>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-900 text-red-200 rounded-2xl p-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="player-name" className="block text-xs uppercase tracking-widest font-bold text-amber-400/80 mb-2">
            Nom du Marchand
          </label>
          <input
            type="text"
            id="player-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1c0f08] border border-[#523628]/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#e5a93b] text-amber-100 transition-all"
            placeholder="ex: Billy the Kid"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest font-bold text-amber-400/80 mb-2">
            Choisir un Avatar
          </label>
          <div className="grid grid-cols-8 gap-2 bg-[#1c0f08] p-2.5 rounded-2xl border border-[#523628]/45">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setAvatar(av)}
                className={`text-2xl p-1.5 rounded-xl transition-all flex items-center justify-center aspect-square ${
                  avatar === av
                    ? "bg-amber-500/20 border border-[#e5a93b] scale-110"
                    : "hover:bg-[#3b251b]"
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-[#523628]/40 my-6" />

        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] font-bold h-12 rounded-2xl transition-all shadow-md shadow-amber-500/10"
            onClick={() => onHost(name, avatar)}
            disabled={status === 'CONNECTING'}
          >
            🤠 Créer un Saloon (Hôte)
          </Button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#523628]/40"></div>
            <span className="flex-shrink mx-4 text-amber-500/40 text-xs uppercase tracking-wider font-bold">OU</span>
            <div className="flex-grow border-t border-[#523628]/40"></div>
          </div>

          <div className="space-y-2.5">
            <label htmlFor="room-code" className="block text-xs uppercase tracking-widest font-bold text-amber-400/80 mb-1">
              Code du Saloon à rejoindre
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="room-code"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                className="flex-1 bg-[#1c0f08] border border-[#523628]/60 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-[#e5a93b] font-mono tracking-widest text-center text-amber-100 transition-all"
                placeholder="CODE"
              />
              <Button
                className="bg-[#3b251b] hover:bg-[#523628] text-[#e5a93b] border border-[#523628]/60 font-bold px-6 rounded-2xl transition-all"
                onClick={() => onJoin(name, avatar, roomIdInput)}
                disabled={status === 'CONNECTING' || !roomIdInput}
              >
                Rejoindre
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
