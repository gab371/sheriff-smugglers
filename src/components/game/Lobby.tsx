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

  const localPlayer = players.find((p) => p.id === myPeerId);
  const isReady = localPlayer?.isReady || false;

  const copyRoomId = () => {
    if (hostPeerId) {
      navigator.clipboard.writeText(hostPeerId);
      alert(`Code de saloon (${hostPeerId}) copié dans le presse-papiers !`);
    }
  };

  if (status === 'CONNECTED' && myPeerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
        <div className="w-full max-w-md bg-[#2d1b10] border-4 border-[#e5a93b] rounded-2xl p-6 shadow-2xl text-amber-50">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-wider text-[#e5a93b] font-serif">SALOON D'EL PASO</h1>
            <p className="text-sm text-amber-200 mt-1">Attente des marchands...</p>
          </div>

          <div className="bg-[#1c0f08] border border-[#523628] rounded-xl p-4 mb-6 flex flex-col items-center justify-between gap-3">
            <div className="text-sm text-amber-200">Code de la table</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-bold tracking-widest text-[#e5a93b]">{hostPeerId}</span>
              <Button
                variant="outline"
                className="bg-[#3b251b] hover:bg-[#523628] text-amber-100 border-[#e5a93b] text-xs h-8 px-3"
                onClick={copyRoomId}
              >
                Copier
              </Button>
            </div>
          </div>

          {/* SÉLECTEUR DE THEME DE DECK */}
          <div className="bg-[#1c0f08] border border-[#523628] rounded-xl p-4 mb-6 flex flex-col gap-2">
            <div className="text-sm text-amber-300 font-bold uppercase tracking-wider">Thème du Deck</div>
            {isHost ? (
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(['WESTERN', 'MEDIEVAL', 'MODERN'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onChangeDeckTheme?.(t)}
                    className={`text-xs py-2 px-1 rounded-lg border-2 font-bold transition-all ${
                      deckTheme === t
                        ? "bg-[#e5a93b] text-[#1c0f08] border-transparent"
                        : "bg-[#2d1b10] border-[#523628] text-amber-300 hover:bg-[#3b251b]"
                    }`}
                  >
                    {t === 'WESTERN' ? '🤠 Western' : t === 'MEDIEVAL' ? '🏰 Médiéval' : '🏙️ Moderne'}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-amber-100 font-semibold bg-[#2d1b10] p-2 rounded border border-[#523628] text-center text-sm">
                Actif : {deckTheme === 'WESTERN' ? '🤠 Western' : deckTheme === 'MEDIEVAL' ? '🏰 Médiéval' : '🏙️ Moderne'}
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
            <div className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-2">Marchands attablés</div>
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-[#3b251b]/80 border border-[#523628] rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="font-semibold text-amber-100">
                    {p.name} {p.id === myPeerId ? ' (Vous)' : ''}
                  </span>
                  {p.isHost && (
                    <span className="bg-[#e5a93b] text-[#1c0f08] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                      Hôte
                    </span>
                  )}
                </div>
                <div>
                  {p.isReady ? (
                    <span className="text-emerald-400 font-bold text-sm">Prêt ✓</span>
                  ) : (
                    <span className="text-amber-500/80 text-sm">Prépare son sac...</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              className={`flex-1 font-bold h-12 border ${
                isReady
                  ? "bg-[#523628] hover:bg-[#3b251b] text-amber-200 border-[#e5a93b]"
                  : "bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] border-transparent"
              }`}
              onClick={() => onToggleReady(!isReady)}
            >
              {isReady ? "Annuler Prêt" : "Je suis Prêt !"}
            </Button>

            {isHost && (
              <Button
                disabled={players.length < 2}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:opacity-50 text-white font-bold h-12"
                onClick={onStartGame}
              >
                Lancer la Partie
              </Button>
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onDisconnect}
              className="text-xs text-amber-400/80 hover:text-amber-300 underline"
            >
              Quitter la table
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md bg-[#2d1b10] border-4 border-[#e5a93b] rounded-2xl p-6 shadow-2xl text-amber-50">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-wider text-[#e5a93b] font-serif drop-shadow-lg">
            SHERIFF & SMUGGLERS
          </h1>
          <p className="text-xs uppercase tracking-widest text-amber-200 mt-2">
            Saloon P2P Multi-joueurs
          </p>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-200 rounded-lg p-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="player-name" className="block text-xs uppercase tracking-wider font-bold text-amber-300 mb-1.5">
              Nom du Marchand
            </label>
            <input
              type="text"
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1c0f08] border border-[#523628] rounded-lg px-4 py-2.5 text-amber-100 focus:outline-none focus:border-[#e5a93b]"
              placeholder="ex: Billy the Kid"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-amber-300 mb-1.5">
              Sélectionnez un Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                    avatar === av
                      ? "bg-[#3b251b] border-[#e5a93b]"
                      : "bg-[#1c0f08] border-[#523628] hover:bg-[#3b251b]/40"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-[#523628] my-6" />

          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] font-bold h-12"
              onClick={() => onHost(name, avatar)}
              disabled={status === 'CONNECTING'}
            >
              🤠 Créer un Saloon (Hôte)
            </Button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#523628]"></div>
              <span className="flex-shrink mx-4 text-amber-400/60 text-xs uppercase tracking-wider font-bold">OU</span>
              <div className="flex-grow border-t border-[#523628]"></div>
            </div>

            <div className="space-y-2">
              <label htmlFor="room-code" className="block text-xs uppercase tracking-wider font-bold text-amber-300 mb-1">
                Code du Saloon à rejoindre
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="room-code"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#1c0f08] border border-[#523628] rounded-lg px-3 py-2 text-amber-100 focus:outline-none focus:border-[#e5a93b] font-mono tracking-widest text-center"
                  placeholder="CODE"
                />
                <Button
                  className="bg-[#3b251b] hover:bg-[#523628] text-amber-100 border border-[#e5a93b] font-bold px-6"
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
    </div>
  );
};
