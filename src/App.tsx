import { useGame } from "./hooks/useGame";
import { Lobby } from "./components/game/Lobby";
import { GameBoard } from "./components/game/GameBoard";

function App() {
  const game = useGame();

  return (
    <div className="min-h-screen bg-[#1c0f08] text-amber-50 font-sans pb-12 selection:bg-[#e5a93b] selection:text-[#1c0f08]">
      {/* Saloon Background Wood Radial Glow decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(229,169,59,0.08),transparent_70%)] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-6">
        {/* Simple top navbar for connection status and theme styling */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#523628]/40">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤠</span>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-wider text-[#e5a93b] leading-none">
                SHERIFF & SMUGGLERS
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-amber-400/60 font-semibold">
                El Paso Saloon Edition
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            {game.status === 'CONNECTED' && (
              <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-3 py-1 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SALOON CONNECTÉ
              </div>
            )}
            {game.status === 'CONNECTING' && (
              <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-800 text-amber-400 px-3 py-1 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                CONNEXION...
              </div>
            )}
            {game.status === 'DISCONNECTED' && (
              <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-800 text-red-400 px-3 py-1 rounded-full font-bold">
                DÉCONNECTÉ
              </div>
            )}
          </div>
        </div>

        {/* View switching */}
        {!game.gameState || game.gameState.phase === 'LOBBY' ? (
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
            onDisconnect={game.disconnect}
            deckTheme={game.gameState?.deckTheme}
            onChangeDeckTheme={game.changeDeckTheme}
          />
        ) : (
          <GameBoard
            gameState={game.gameState}
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

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[#523628]/20 flex justify-between items-center text-xs text-amber-500/50">
          <div>
            Version 1.0.0 (P2P Edition)
          </div>
          <a
            href="https://github.com/gab371/Sherif-de-Nottingham"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#e5a93b] transition-colors"
          >
            <svg
              className="w-4 h-4"
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
            <span>GitHub Repository</span>
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
