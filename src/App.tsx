import { useState } from "react";
declare const __APP_VERSION__: string;
import { useGame } from "./hooks/useGame";
import { Lobby } from "./components/game/Lobby";
import { GameBoard } from "./components/game/GameBoard";
import { ShieldAlert, FileText, X } from "lucide-react";

interface AppProps {
  isEmbedded?: boolean;
  externalPeerManager?: any;
  playerName?: string;
  playerAvatar?: string;
  onExit?: () => void;
}

function App({ isEmbedded = false, externalPeerManager, playerName, playerAvatar, onExit }: AppProps) {
  const game = useGame({ externalPeerManager, isEmbedded, playerName, playerAvatar });
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handleCopy = () => {
    if (game.hostPeerId) {
      navigator.clipboard.writeText(game.hostPeerId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const showLobby = !game.gameState || game.gameState.phase === 'LOBBY';

  return (
    <div className="min-h-screen text-amber-50 font-sans flex flex-col justify-between selection:bg-[#e5a93b] selection:text-[#1c0f08] relative">
      {/* Saloon Background Wood Radial Glow decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(229,169,59,0.08),transparent_70%)] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-6 px-4 border-b border-[#523628]/40 relative z-10">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-[#e5a93b] animate-pulse" />
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-[#e5a93b] bg-clip-text text-transparent tracking-tight">
              SHERIFF & SMUGGLERS
            </h1>
            <span className="text-[9px] uppercase tracking-widest text-amber-500/60 font-semibold block leading-none mt-0.5">
              El Paso Saloon Edition
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {game.status === 'CONNECTED' && (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-3 py-1.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SALOON CONNECTÉ
            </div>
          )}
          {game.status === 'CONNECTING' && (
            <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-800 text-amber-400 px-3 py-1.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
              CONNEXION...
            </div>
          )}
          {game.status === 'DISCONNECTED' && (
            <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-800 text-red-400 px-3 py-1.5 rounded-full font-bold">
              DÉCONNECTÉ
            </div>
          )}

          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 bg-[#3b251b] hover:bg-[#523628] text-amber-300 hover:text-amber-100 px-3 py-1.5 rounded-full border border-[#523628]/60 font-bold transition-all"
            title="Règles du jeu"
          >
            <FileText className="w-4 h-4" />
            <span>Règles</span>
          </button>

          {game.gameState && game.gameState.phase !== 'LOBBY' && (
            <div className="flex items-center gap-2 border-l border-[#523628]/40 pl-3">
              <button
                onClick={handleCopy}
                className="text-xs px-2.5 py-1.5 bg-[#2c180e] hover:bg-[#3d2315] text-amber-300 hover:text-amber-100 rounded-xl transition-all border border-[#523628]/40 font-bold"
              >
                {copied ? "Copié !" : "Copier le code"}
              </button>
              <button
                onClick={isEmbedded && onExit ? onExit : game.disconnect}
                className="text-xs px-2.5 py-1.5 bg-red-950/20 hover:bg-red-900/20 text-red-400 border border-red-900/30 rounded-xl transition-all font-bold"
              >
                Quitter
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 relative z-10">
        {showLobby ? (
          <Lobby
            myPeerId={game.myPeerId}
            hostPeerId={game.hostPeerId}
            status={game.status}
            error={game.error}
            players={game.gameState ? game.gameState.players : []}
            isHost={game.isHost}
            onHost={game.hostRoom}
            onJoin={game.joinRoom}
            onToggleReady={game.toggleReady}
            onStartGame={game.startGame}
            onDisconnect={isEmbedded && onExit ? onExit : game.disconnect}
            deckTheme={game.gameState?.deckTheme}
            onChangeDeckTheme={game.changeDeckTheme}
          />
        ) : (
          <GameBoard
            gameState={game.gameState!}
            localPlayerId={game.myPeerId || ""}
            chatMessages={game.chatMessages}
            onMarketDiscard={game.discardMarket}
            onMarketDrawOne={game.drawMarket}
            onLoadBag={game.loadBag}
            onDeclareBag={game.declareBag}
            onOfferBribe={game.offerBribe}
            onSheriffPass={game.sheriffPass}
            onSheriffInspect={game.sheriffInspect}
            onNextRound={game.nextRound}
            onSendChat={game.sendChatMessage}
            onDisconnect={game.disconnect}
          />
        )}
      </main>

      <footer className="max-w-7xl mx-auto w-full text-center text-[10px] text-amber-600/50 py-6 px-4 border-t border-[#523628]/20 flex justify-between items-center">
        <div>
          Sheriff & Smugglers - Réseau Privé Peer-to-Peer - Version v{__APP_VERSION__}
        </div>
        <a
          href="https://github.com/gab371/sheriff-smugglers"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-[#e5a93b] transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <span>Dépôt GitHub</span>
        </a>
      </footer>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md transition-all">
          <div className="bg-[#2d1b10] border border-[#523628] rounded-3xl p-6 w-full max-w-2xl text-amber-50 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans">
            <button
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 text-amber-500 hover:text-amber-300 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold font-serif text-[#e5a93b] mb-4 flex items-center gap-2 border-b border-[#523628]/40 pb-2">
              🤠 Règles : Sheriff & Smugglers
            </h2>

            <div className="space-y-4 text-sm text-amber-100/90 leading-relaxed">
              <section>
                <h3 className="font-bold text-[#e5a93b] font-serif uppercase tracking-wide text-xs mb-1">Objectif</h3>
                <p>
                  Devenir le marchand le plus riche en vendant vos marchandises légales au marché d'El Paso ou en y faisant passer de la contrebande en douce. Vous gagnez des pièces d'or en vendant des cartes et via des bonus de majorité en fin de partie.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#e5a93b] font-serif uppercase tracking-wide text-xs mb-1">Déroulement d'une manche</h3>
                <p className="mb-2">Chaque joueur incarne le rôle du <strong>Shérif</strong> à tour de rôle. Pour les autres marchands, la manche se compose de 3 phases :</p>
                <ul className="list-disc list-inside pl-2 space-y-1.5">
                  <li>
                    <strong className="text-amber-200">1. Le Marché (Pioche & Défausse) :</strong> Les marchands peuvent défausser jusqu'à 5 cartes de leur main et en piocher de nouvelles depuis la pioche cachée ou les deux piles de défausse visibles.
                  </li>
                  <li>
                    <strong className="text-amber-200">2. Chargement du Sac :</strong> Les marchands choisissent secrètement entre 1 et 5 cartes de leur main à placer dans leur sac à marchandises.
                  </li>
                  <li>
                    <strong className="text-amber-200">3. Déclaration :</strong> Chaque marchand déclare le contenu de son sac au Shérif. Vous devez obligatoirement déclarer le nombre exact de cartes et <strong>une seule marchandise légale</strong> (ex: "4 Pommes"). Vous pouvez mentir sur le type de marchandise !
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-[#e5a93b] font-serif uppercase tracking-wide text-xs mb-1">Phase d'Inspection & Pots-de-vin</h3>
                <p className="mb-2">Le Shérif décide d'inspecter ou de laisser passer le sac de chaque marchand. Les marchands peuvent proposer des pots-de-vin en pièces d'or (ou d'autres promesses) pour convaincre le Shérif de fermer les yeux.</p>
                <ul className="list-disc list-inside pl-2 space-y-1.5">
                  <li>
                    <strong className="text-amber-200">Le sac passe sans inspection :</strong> Le marchand place ses marchandises sur son étal (le Shérif ne saura jamais s'il y avait de la contrebande).
                  </li>
                  <li>
                    <strong className="text-red-400">Le Shérif inspecte et le marchand a menti :</strong> Le marchand doit défausser toutes ses cartes non déclarées ou de contrebande, et payer une amende (en or) au Shérif pour chaque infraction. Les cartes honnêtes vont sur son étal.
                  </li>
                  <li>
                    <strong className="text-emerald-400">Le Shérif inspecte et le marchand était honnête :</strong> Le Shérif doit payer un dédommagement en or au marchand égal à la pénalité des cartes inspectées ! Le marchand place tout sur son étal.
                  </li>
                </ul>
              </section>

              <section className="bg-[#1c0f08] border border-[#523628]/60 p-3 rounded-2xl">
                <h4 className="font-serif font-bold text-[#e5a93b] text-xs uppercase mb-1">💡 Astuce</h4>
                <p className="text-xs text-amber-300/80">
                  La contrebande rapporte énormément de points à la fin, mais les pénalités d'amendes sont élevées en cas de fouille. Utilisez le tchat pour négocier des accords secrets avec le Shérif !
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
