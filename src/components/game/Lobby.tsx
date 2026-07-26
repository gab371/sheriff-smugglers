import React, { useState } from "react";
import type { Player, DeckTheme } from "../../core/types";
import { Button } from "../ui/button";
import { SpectatorRolePanel } from "./SpectatorRolePanel";
import { copyRoomUrlToClipboard } from "p2play-core/url";
import { P2PlayLobby } from "p2play-core";

interface LobbyProps {
  myPeerId: string | null;
  hostPeerId: string | null;
  status: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
  error: string | null;
  players: Player[];
  spectators?: Player[];
  spectatorLocks?: { [peerId: string]: boolean };
  isHost: boolean;
  onHost: (name: string, avatar: string) => void;
  onJoin: (name: string, avatar: string, roomId: string) => void;
  onToggleReady: (ready: boolean) => void;
  onStartGame: () => void;
  onDisconnect: () => void;
  onSetRole?: (peerId: string, role: 'player' | 'spectator') => void;
  onLockSpectator?: (peerId: string, locked: boolean) => void;
  deckTheme?: DeckTheme;
  onChangeDeckTheme?: (theme: DeckTheme) => void;
}

const AVATARS = ["🤠", "👩‍🌾", "🧙‍♂️", "👨‍🍳", "👰‍♀️", "🤵‍♂️", "🌵", "🐎"];

export const Lobby: React.FC<LobbyProps> = ({
  myPeerId,
  hostPeerId,
  status,
  error,
  players,
  spectators = [],
  spectatorLocks = {},
  isHost,
  onHost,
  onJoin,
  onToggleReady,
  onStartGame,
  onDisconnect,
  onSetRole,
  onLockSpectator,
  deckTheme = 'WESTERN',
  onChangeDeckTheme,
}) => {
  const [copied, setCopied] = useState(false);

  const localPlayer = players.find((p) => p.id === myPeerId);
  const isReady = localPlayer?.isReady || false;

  const handleCopy = () => {
    if (hostPeerId) {
      copyRoomUrlToClipboard(hostPeerId).then((success: boolean) => {
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    }
  };

  if (status === 'CONNECTED' && myPeerId) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 bg-[#2d1b10]/60 backdrop-blur-xl border border-[#523628]/60 rounded-3xl shadow-2xl relative overflow-hidden text-amber-50">
        <div className="text-center mb-6">
          <span className="text-4xl inline-block mb-2">🤠</span>
          <h2 className="text-2xl font-black tracking-tight text-amber-400">Saloon des Marchands</h2>
          <p className="text-xs text-amber-500/70 font-medium">Attente des joueurs pour lancer le marché</p>
        </div>

        {hostPeerId && (
          <div className="mb-6 p-4 bg-[#1c0f08] border border-[#523628]/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-amber-200">
              <span className="text-amber-500 font-bold">Code du Saloon:</span>
              <code className="font-mono bg-[#2d1b10] px-3 py-1 rounded-xl border border-[#523628]/40 font-bold text-amber-300 tracking-wider">
                {hostPeerId}
              </code>
            </div>
            <Button
              onClick={handleCopy}
              className="bg-[#3b251b] hover:bg-[#523628] text-amber-300 border border-[#523628]/60 text-xs px-4 py-2 rounded-xl transition-all w-full sm:w-auto"
            >
              {copied ? "✓ Lien copié !" : "📋 Copier le lien"}
            </Button>
          </div>
        )}

        {isHost && onChangeDeckTheme && (
          <div className="mb-6 p-4 bg-[#1c0f08] border border-[#523628]/60 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Thème du paquet :</span>
            <div className="flex bg-[#2d1b10] p-1 rounded-xl border border-[#523628]/40 text-xs">
              <button
                type="button"
                onClick={() => onChangeDeckTheme('WESTERN')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  deckTheme === 'WESTERN'
                    ? "bg-[#e5a93b] text-[#1c0f08] shadow"
                    : "text-amber-400/60 hover:text-amber-200"
                }`}
              >
                🤠 Far West
              </button>
              <button
                type="button"
                onClick={() => onChangeDeckTheme('MEDIEVAL')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  deckTheme === 'MEDIEVAL'
                    ? "bg-[#e5a93b] text-[#1c0f08] shadow"
                    : "text-amber-400/60 hover:text-amber-200"
                }`}
              >
                🏰 Médiéval
              </button>
              <button
                type="button"
                onClick={() => onChangeDeckTheme('MODERN')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  deckTheme === 'MODERN'
                    ? "bg-[#e5a93b] text-[#1c0f08] shadow"
                    : "text-amber-400/60 hover:text-amber-200"
                }`}
              >
                🌆 Moderne
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <h3 className="text-xs uppercase tracking-wider font-bold text-amber-500/80 px-1">
            Marchands à la table ({players.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-3 bg-[#1c0f08] border border-[#523628]/40 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl p-1 bg-[#2d1b10] rounded-xl border border-[#523628]/30 flex-shrink-0">
                    {player.avatar}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-sm text-amber-100 block truncate">
                      {player.name}
                    </span>
                    {player.id === hostPeerId && (
                      <span className="text-[10px] text-[#e5a93b] font-semibold uppercase tracking-wider block">
                        👑 Hôte du Saloon
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-xl font-bold flex-shrink-0 border ${
                    player.isHost
                      ? "bg-amber-900/40 text-amber-300 border-amber-700/50"
                      : player.isReady
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                      : "bg-amber-950/40 text-amber-400/60 border-amber-900/30"
                  }`}
                >
                  {player.isHost ? "Hôte" : player.isReady ? "Prêt" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spectator Section */}
        {onLockSpectator && onSetRole && (
          <div className="mb-6">
            <SpectatorRolePanel
              players={players}
              isHost={isHost}
              myPeerId={myPeerId}
              spectators={spectators}
              spectatorLocks={spectatorLocks}
              onSetRole={onSetRole}
              onLockSpectator={onLockSpectator}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {!isHost && (
            <Button
              onClick={() => onToggleReady(!isReady)}
              className={`flex-1 font-bold h-12 rounded-2xl transition-all text-sm ${
                isReady
                  ? "bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 border border-amber-700/50"
                  : "bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] shadow-md shadow-amber-500/10"
              }`}
            >
              {isReady ? "Annuler prêt" : "Je suis prêt !"}
            </Button>
          )}

          {isHost && (
            <Button
              onClick={onStartGame}
              disabled={players.length < 2 || !players.every((p) => p.isHost || p.isReady)}
              className="flex-1 bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] font-bold h-12 rounded-2xl transition-all disabled:opacity-40 shadow-md shadow-amber-500/10 text-sm"
            >
              Lancer la partie ({players.length}/6)
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
    <P2PlayLobby
      title="SHERIFF & SMUGGLERS"
      subtitle="Saloon P2P Multi-joueurs"
      bannerEmoji="🤠"
      theme="amber"
      avatars={AVATARS}
      status={status}
      error={error}
      maxUsernameLength={15}
      showVoiceToggle={false}
      showCharacterCounter={false}
      defaultUsername={`MARCHAND_${Math.floor(Math.random() * 1000)}`}
      usernameLabel="Nom du Marchand"
      usernamePlaceholder="ex: Billy the Kid"
      avatarLabel="Choisir un Avatar"
      createButtonText="🤠 Créer un Saloon (Hôte)"
      compactHostSection={true}
      joinCodeLabel="Code du Saloon à rejoindre"
      joinCodePlaceholder="CODE"
      joinButtonText="Rejoindre"
      joinLayout="side-by-side"
      classes={{
        root: "w-full max-w-md mx-auto p-8 bg-[#2d1b10]/60 backdrop-blur-xl border border-[#523628]/60 rounded-3xl shadow-2xl relative overflow-hidden text-amber-50",
        header: "text-center mb-8",
        emoji: "text-5xl inline-block mb-3 animate-bounce",
        title: "text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent whitespace-nowrap",
        subtitle: "text-xs uppercase tracking-widest text-amber-400/60 mt-2 font-semibold",
        content: "space-y-6",
        label: "block text-xs uppercase tracking-widest font-bold text-amber-400/80 mb-2",
        input: "w-full bg-[#1c0f08] border border-[#523628]/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#e5a93b] text-amber-100 transition-all text-left font-normal",
        avatarGrid: "grid grid-cols-8 gap-2 bg-[#1c0f08] p-2.5 rounded-2xl border border-[#523628]/45",
        avatarItem: "text-2xl p-1.5 rounded-xl transition-all flex items-center justify-center aspect-square hover:bg-[#3b251b]",
        avatarItemSelected: "text-2xl p-1.5 rounded-xl transition-all flex items-center justify-center aspect-square bg-amber-500/20 border border-[#e5a93b] scale-110",
        hr: "border-[#523628]/40 my-6",
        actionGroup: "flex flex-col gap-3",
        createButton: "w-full bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] font-bold h-12 rounded-2xl transition-all shadow-md shadow-amber-500/10",
        divider: "relative flex py-2 items-center",
        dividerLine: "flex-grow border-t border-[#523628]/40",
        dividerText: "flex-shrink mx-4 text-amber-500/40 text-xs uppercase tracking-wider font-bold",
        joinWrapper: "space-y-2.5 text-left",
        joinGroup: "flex gap-2",
        joinInput: "flex-1 bg-[#1c0f08] border border-[#523628]/60 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-[#e5a93b] font-mono tracking-widest text-center text-amber-100 transition-all font-bold uppercase",
        joinButton: "bg-[#3b251b] hover:bg-[#523628] text-[#e5a93b] border border-[#523628]/60 font-bold px-6 rounded-2xl transition-all",
        urlNotice: "p-5 bg-[#1c0f08] border border-[#523628]/60 rounded-2xl text-left flex flex-col gap-4",
      }}
      onHost={(username, avatar) => onHost(username, avatar)}
      onJoin={(username, avatar, roomCode) => onJoin(username, avatar, roomCode)}
    />
  );
};
