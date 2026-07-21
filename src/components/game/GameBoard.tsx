import React, { useState, useEffect } from "react";
import type { GameState } from "../../core/types";
import { CARD_THEMES, getCardDefinition } from "../../core/cards";
import { CardView } from "./CardView";
import { ChatBox } from "./ChatBox";
import type { ChatMessage } from "../../network/protocol";
import { Button } from "../ui/button";

interface GameBoardProps {
  gameState: GameState;
  localPlayerId: string;
  chatMessages: ChatMessage[];
  onMarketDiscard: (discardUids: string[]) => void;
  onMarketDrawOne: (source: 'DECK' | 'DISCARD1' | 'DISCARD2') => void;
  onLoadBag: (cardUids: string[]) => void;
  onDeclareBag: (declaredGoodId: string) => void;
  onOfferBribe: (gold: number, text: string) => void;
  onSheriffPass: (merchantId: string) => void;
  onSheriffInspect: (merchantId: string) => void;
  onNextRound: () => void;
  onSendChat: (text: string) => void;
  onDisconnect: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  localPlayerId,
  chatMessages,
  onMarketDiscard,
  onMarketDrawOne,
  onLoadBag,
  onDeclareBag,
  onOfferBribe,
  onSheriffPass,
  onSheriffInspect,
  onNextRound,
  onSendChat,
  onDisconnect,
}) => {
  const theme = gameState.deckTheme || 'WESTERN';
  const legalGoods = Object.keys(CARD_THEMES[theme]).filter(
    (key) => CARD_THEMES[theme][key].type === 'LEGAL'
  );

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [selectedGoodId, setSelectedGoodId] = useState(legalGoods[0] || "apple");
  const [showBribeModal, setShowBribeModal] = useState(false);
  const [bribeGold, setBribeGold] = useState(5);
  const [bribeText, setBribeText] = useState("");

  // Sync selectedGoodId when theme changes or modal opens
  useEffect(() => {
    if (legalGoods.length > 0 && !legalGoods.includes(selectedGoodId)) {
      setSelectedGoodId(legalGoods[0]);
    }
  }, [theme, legalGoods, selectedGoodId]);

  const localPlayer = gameState.players.find((p) => p.id === localPlayerId);
  const sheriff = gameState.players[gameState.sheriffIndex];
  const isSheriff = sheriff?.id === localPlayerId;
  const phase = gameState.phase;

  // Clear selections when phase changes
  useEffect(() => {
    setSelectedCards(new Set());
  }, [phase, gameState.roundNumber]);

  const handleCardClick = (uid: string) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        if (phase === 'BAG_LOADING' && next.size >= 5) return prev;
        next.add(uid);
      }
      return next;
    });
  };

  const getPhaseLabel = (p: typeof phase) => {
    switch (p) {
      case 'MARKET_DRAW':
        return 'Phase 1 : Le Marché (Troc & Pioche)';
      case 'BAG_LOADING':
        return 'Phase 2 : Remplissage des Sacs';
      case 'DECLARATION':
        return 'Phase 3 : Déclarations au Shérif';
      case 'INSPECTION':
        return 'Phase 4 : Fouilles & Pots-de-Vin';
      case 'ROUND_END':
        return 'Fin de Manche';
      case 'GAME_OVER':
        return 'Partie Terminée !';
      default:
        return p;
    }
  };

  if (phase === 'GAME_OVER' && gameState.winnerScores) {
    return (
      <div className="flex flex-col items-center justify-center p-4 max-w-4xl mx-auto text-amber-50">
        <div className="w-full bg-[#2d1b10] border-4 border-[#e5a93b] rounded-2xl p-6 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-[#e5a93b] font-serif tracking-wider">
              🏆 FIN DE LA PARTIE 🏆
            </h1>
            <p className="text-amber-200 text-sm mt-2">Le train d'El Paso s'en va. Voici les comptes !</p>
          </div>

          <div className="space-y-4 mb-8">
            {gameState.winnerScores.map((score, idx) => (
              <div
                key={score.playerId}
                className={`border-2 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  idx === 0
                    ? "bg-[#3e2b1b] border-[#e5a93b] shadow-lg"
                    : "bg-[#25150c] border-[#523628]/60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold font-mono text-[#e5a93b] w-8">
                    #{idx + 1}
                  </span>
                  <span className="text-4xl">{score.avatar}</span>
                  <div>
                    <h2 className="text-xl font-bold text-amber-100">
                      {score.name} {score.playerId === localPlayerId ? '(Vous)' : ''}
                    </h2>
                    <div className="text-xs text-amber-400/80 flex flex-wrap gap-x-3 mt-1">
                      <span>Bourse : {score.coins} 🪙</span>
                      <span>Étal Légal : {score.standValue} pts</span>
                      <span>Contrebande : {score.contrabandValue} pts</span>
                      <span>Bonis Rois/Reines : {score.kingBonuses + score.queenBonuses} pts</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-[#e5a93b] font-mono">{score.totalScore} pts</div>
                  <div className="text-[10px] text-amber-400/60 font-serif max-w-xs mt-1 md:text-right">
                    {score.bonusList.join(', ') || 'Aucun bonus'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onDisconnect}
              className="bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] font-bold px-8 h-12"
            >
              Retourner au Saloon Principal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-amber-50 max-w-7xl mx-auto px-2">
      {/* Header Info */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-[#2d1b10]/60 backdrop-blur-md border border-[#523628]/60 rounded-3xl px-5 py-4 gap-2">
        <div className="font-serif font-bold text-[#e5a93b] tracking-wide text-lg">
          🤠 {getPhaseLabel(phase)}
        </div>
        <div className="text-sm font-semibold flex items-center gap-4">
          <span className="bg-[#1c0f08] px-3 py-1.5 rounded-full border border-[#523628]/60 font-mono text-amber-300/80">
            Manche {gameState.roundNumber} / {gameState.totalRounds}
          </span>
          <span className="text-[#e5a93b] bg-[#2d1b10]/60 px-3 py-1.5 rounded-full border border-[#523628]/60">
            Votre Bourse : <strong>{localPlayer?.gold || 0} 🪙</strong>
          </span>
        </div>
      </header>

      {/* Main Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Sheriff Desk Banner */}
          <div className="bg-[#2d1b10]/60 backdrop-blur-md border border-[#523628]/60 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🎖️</span>
              <div>
                <div className="text-xs uppercase tracking-widest text-[#e5a93b] font-bold font-mono">
                  Le Shérif en Ville
                </div>
                <div className="text-xl font-bold font-serif text-amber-100">
                  {sheriff ? sheriff.name : "Personne"}
                </div>
              </div>
            </div>
            <div className="text-right sm:text-right">
              <div className="text-sm font-semibold text-amber-200">
                Bourse du Shérif : <span className="text-[#e5a93b]">{sheriff ? sheriff.gold : 0} 🪙</span>
              </div>
              <div className="text-xs text-[#e5a93b]/85 italic mt-0.5">
                {isSheriff ? "⭐ VOUS ÊTES LE SHÉRIF ! ⭐" : "Négociez des pots-de-vin pour passer vos marchandises."}
              </div>
            </div>
          </div>

          {/* Saloon Decks */}
          <div className="bg-[#1c0f08]/40 border border-[#523628]/60 rounded-3xl p-6 flex flex-wrap justify-center items-center gap-8 shadow-inner">
            {/* Draw Deck */}
            <div
              onClick={() => {
                if (phase === 'MARKET_DRAW' && !isSheriff && gameState.marketPlayerStates[localPlayerId]?.step === 'DRAWING') {
                  onMarketDrawOne('DECK');
                }
              }}
              className={`w-24 h-36 rounded-2xl bg-gradient-to-b from-[#3b251b] to-[#1c0f08] border border-[#523628] flex flex-col justify-center items-center p-3 select-none text-center shadow-lg relative ${
                phase === 'MARKET_DRAW' && !isSheriff && gameState.marketPlayerStates[localPlayerId]?.step === 'DRAWING'
                  ? 'ring-4 ring-[#e5a93b] cursor-pointer hover:-translate-y-1'
                  : ''
              }`}
            >
              <span className="text-3xl mb-1.5">🃏</span>
              <span className="font-bold text-xs tracking-wide text-[#e5a93b] font-serif">Pioche</span>
              <span className="text-[10px] text-amber-300 mt-1">({gameState.drawDeck.length} cartes)</span>
            </div>

            {/* Discard Deck 1 */}
            <div className="flex flex-col items-center gap-1.5 select-none">
              <div className="text-[9px] text-amber-400/80 uppercase font-mono font-bold">
                Défausse 1 ({gameState.discardPile1.length})
              </div>
              <div
                onClick={() => {
                  if (phase === 'MARKET_DRAW' && !isSheriff && gameState.marketPlayerStates[localPlayerId]?.step === 'DRAWING' && gameState.discardPile1.length > 0) {
                    onMarketDrawOne('DISCARD1');
                  }
                }}
                className={`relative w-24 h-36 rounded-2xl transition-all duration-200 ${
                  phase === 'MARKET_DRAW' && !isSheriff && gameState.marketPlayerStates[localPlayerId]?.step === 'DRAWING' && gameState.discardPile1.length > 0
                    ? 'ring-4 ring-[#e5a93b] cursor-pointer hover:-translate-y-1 active:scale-95'
                    : ''
                }`}
              >
                {gameState.discardPile1.length > 0 ? (
                  <CardView card={gameState.discardPile1[gameState.discardPile1.length - 1]} selectable={false} />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-[#1c0f08] border border-dashed border-[#523628]/60 flex items-center justify-center text-amber-500/30 font-bold text-xs">
                    Vide
                  </div>
                )}
              </div>
            </div>

            {/* Discard Deck 2 */}
            <div className="flex flex-col items-center gap-1.5 select-none">
              <div className="text-[9px] text-amber-400/80 uppercase font-mono font-bold">
                Défausse 2 ({gameState.discardPile2.length})
              </div>
              <div
                onClick={() => {
                  if (phase === 'MARKET_DRAW' && !isSheriff && gameState.marketPlayerStates[localPlayerId]?.step === 'DRAWING' && gameState.discardPile2.length > 0) {
                    onMarketDrawOne('DISCARD2');
                  }
                }}
                className={`relative w-24 h-36 rounded-2xl transition-all duration-200 ${
                  phase === 'MARKET_DRAW' && !isSheriff && gameState.marketPlayerStates[localPlayerId]?.step === 'DRAWING' && gameState.discardPile2.length > 0
                    ? 'ring-4 ring-[#e5a93b] cursor-pointer hover:-translate-y-1 active:scale-95'
                    : ''
                }`}
              >
                {gameState.discardPile2.length > 0 ? (
                  <CardView card={gameState.discardPile2[gameState.discardPile2.length - 1]} selectable={false} />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-[#1c0f08] border border-dashed border-[#523628]/60 flex items-center justify-center text-amber-500/30 font-bold text-xs">
                    Vide
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opponents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameState.players.map((p) => {
              const isPlayerSheriff = p.id === sheriff?.id;
              const bag = gameState.bags[p.id];
              const isLocal = p.id === localPlayerId;
              const activeBribe = gameState.activeBribes[p.id];

              return (
                <div
                  key={p.id}
                  className={`bg-[#2d1b10]/60 backdrop-blur-md border rounded-3xl p-4 flex flex-col gap-3 shadow-md ${
                    isPlayerSheriff ? "border-[#e5a93b]" : "border-[#523628]/60"
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-[#523628]/40 pb-2">
                    <div className="flex items-center gap-2 font-bold font-serif">
                      <span className="text-2xl">{p.avatar}</span>
                      <span className="text-amber-105">
                        {p.name} {isLocal ? "(Vous)" : ""}
                      </span>
                      {isPlayerSheriff && (
                        <span className="bg-[#e5a93b] text-[#1c0f08] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          SHÉRIF
                        </span>
                      )}
                    </div>
                    <div className="text-[#e5a93b] font-bold font-mono">{p.gold} 🪙</div>
                  </div>

                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    {legalGoods.map((goodId) => {
                      const def = CARD_THEMES[theme][goodId];
                      return (
                        <span key={goodId} className="bg-[#1c0f08] border border-[#523628]/45 rounded-xl px-2.5 py-0.5 flex items-center gap-1">
                          {def.icon} {(p.stand?.[goodId] || []).length}
                        </span>
                      );
                    })}
                    <span className="bg-rose-955/20 border border-rose-900/40 text-rose-450 rounded-xl px-2.5 py-0.5">🚨 {(p.contraband || []).length}</span>
                  </div>

                  {!isPlayerSheriff && (
                    <div className="bg-[#1c0f08] border border-[#523628]/45 rounded-2xl p-3 text-xs flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-300/90">👜 Sac de Marchandises</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bag?.status === 'WAITING' ? 'bg-[#2d1b10] text-amber-400 border border-[#523628]/40' :
                          bag?.status === 'LOADED' ? 'bg-[#3b251b] text-amber-250 border border-[#523628]/60' :
                          bag?.status === 'DECLARED' ? 'bg-[#e5a93b]/20 text-[#e5a93b] border border-[#e5a93b]/30' :
                          bag?.status === 'PASSED' ? 'bg-emerald-955/20 text-emerald-400 border border-emerald-900/40' :
                          'bg-red-955/20 text-red-400 border border-red-900/40'
                        }`}>
                          {bag?.status === 'WAITING' ? 'Préparation...' :
                           bag?.status === 'LOADED' ? 'Fermé' :
                           bag?.status === 'DECLARED' ? 'Déclaré' :
                           bag?.status === 'PASSED' ? 'Laissé Passer ✓' : 'Fouillé 🔎'}
                        </span>
                      </div>
                      <div className="text-amber-100/70">
                        {bag ? (bag.status === 'WAITING' ? 'En attente...' : `${bag.declaredCount || bag.cards.length} carte(s)`) : 'Vide'}
                      </div>
                      {bag?.declaredGood && (
                        <div className="text-[10px] text-[#e5a93b] font-bold">
                          Marchandise déclarée : {bag.declaredCount} {getCardDefinition(bag.declaredGood, theme)?.name || bag.declaredGood}(s) {getCardDefinition(bag.declaredGood, theme)?.icon || ""}
                        </div>
                      )}
                    </div>
                  )}

                  {activeBribe && (
                    <div className="bg-[#e5a93b]/10 border border-[#e5a93b]/30 rounded-2xl p-2.5 text-xs flex flex-col gap-0.5">
                      <span className="text-[#e5a93b] font-bold">🤝 Proposition de pot-de-vin :</span>
                      <span className="text-amber-100 font-medium">
                        {activeBribe.gold} Or {activeBribe.text ? `("${activeBribe.text}")` : ""}
                      </span>
                    </div>
                  )}

                  {isSheriff && phase === 'INSPECTION' && bag && !['PASSED', 'INSPECTED'].includes(bag.status) && (
                    <div className="flex gap-2 mt-1">
                      <Button
                        onClick={() => onSheriffPass(p.id)}
                        className="flex-1 bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] text-xs font-bold py-2 h-auto rounded-xl"
                      >
                        Laisser Passer
                      </Button>
                      <Button
                        onClick={() => onSheriffInspect(p.id)}
                        className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-2 h-auto rounded-xl border border-red-800"
                      >
                        Inspecter 🔎
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Local Player Controller Bar */}
          <div className="bg-[#2d1b10]/60 backdrop-blur-md border border-[#523628]/60 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 border-b border-[#523628]/40 pb-3">
          <div className="font-serif font-bold text-lg text-amber-100 flex items-center gap-2">
            🎒 Vos Marchandises en Main ({localPlayer?.hand.length || 0} cartes)
          </div>
          <div className="flex gap-2">
            {isSheriff && ['MARKET_DRAW', 'BAG_LOADING', 'DECLARATION'].includes(phase) && (
              <span className="text-[#e5a93b] text-sm italic font-serif">
                ⌛ En attente que les marchands préparent leur cargaison...
              </span>
            )}

            {phase === 'MARKET_DRAW' && !isSheriff && (
              <>
                {gameState.marketPlayerStates[localPlayerId]?.done ? (
                  <span className="text-emerald-400 text-sm font-semibold">
                    ✓ Prêt ! En attente des autres marchands...
                  </span>
                ) : gameState.marketPlayerStates[localPlayerId]?.step === 'DRAWING' ? (
                  <span className="text-[#e5a93b] text-sm font-semibold">
                    👈 Cliquez sur les défausses ou la pioche pour tirer {gameState.marketPlayerStates[localPlayerId].cardsToDraw} carte(s) !
                  </span>
                ) : (
                  <Button
                    onClick={() => onMarketDiscard(Array.from(selectedCards))}
                    className="bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] font-bold h-10 px-6 rounded-xl"
                  >
                    {selectedCards.size > 0 ? `Défausser ces ${selectedCards.size} carte(s)` : "Conserver ma main"}
                  </Button>
                )}
              </>
            )}

            {phase === 'BAG_LOADING' && !isSheriff && (
              <>
                {gameState.bags[localPlayerId]?.status === 'LOADED' ? (
                  <span className="text-emerald-400 text-sm font-semibold">
                    ✓ Sac scellé ! En attente des autres marchands...
                  </span>
                ) : (
                  <Button
                    onClick={() => onLoadBag(Array.from(selectedCards))}
                    disabled={selectedCards.size < 1 || selectedCards.size > 5}
                    className="bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] disabled:bg-zinc-800 disabled:text-zinc-500 font-bold h-10 px-6 rounded-xl"
                  >
                    Sceller le Sac ({selectedCards.size})
                  </Button>
                )}
              </>
            )}

            {phase === 'DECLARATION' && !isSheriff && (
              <>
                {gameState.bags[localPlayerId]?.status === 'DECLARED' ? (
                  <span className="text-emerald-450 text-sm font-semibold">
                    ✓ Déclaration envoyée ! En attente...
                  </span>
                ) : (
                  <Button
                    onClick={() => setShowDeclareModal(true)}
                    className="bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] font-bold h-10 px-6 rounded-xl"
                  >
                    Déclarer Cargaison
                  </Button>
                )}
              </>
            )}

            {phase === 'INSPECTION' && !isSheriff && (
              <>
                {!['PASSED', 'INSPECTED'].includes(gameState.bags[localPlayerId]?.status) && (
                  <Button
                    onClick={() => {
                      setBribeGold(5);
                      setBribeText("");
                      setShowBribeModal(true);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-[#e5a93b] border border-[#523628]/60 font-bold h-10 px-6 rounded-xl"
                  >
                    Proposer un Pot-de-Vin 🤝
                  </Button>
                )}
              </>
            )}

            {phase === 'ROUND_END' && isSheriff && (
              <Button
                onClick={onNextRound}
                className="bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] font-bold h-10 px-6 rounded-xl"
              >
                Passer à la Manche Suivante
              </Button>
            )}
          </div>
        </div>

        {/* Hand Cards */}
        <div className="flex flex-wrap gap-4 justify-center">
          {localPlayer && localPlayer.hand.length > 0 ? (
            localPlayer.hand.map((c) => (
              <CardView
                key={c.uid}
                card={c}
                selected={selectedCards.has(c.uid)}
                onClick={() => handleCardClick(c.uid)}
                selectable={
                  (phase === 'MARKET_DRAW' && gameState.marketPlayerStates[localPlayerId]?.step === 'DISCARD') ||
                  (phase === 'BAG_LOADING' && gameState.bags[localPlayerId]?.status === 'WAITING')
                }
              />
            ))
          ) : (
            <div className="text-zinc-600 font-bold italic text-sm py-8">
              Aucune carte en main.
            </div>
          )}
        </div>
          </div>
        </div>

        {/* Side Panel (Logs & Chat) */}
        <div className="flex flex-col gap-6">
          {/* Logs */}
          <div className="flex flex-col h-96 bg-[#2d1b10]/60 border border-[#523628]/60 rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-[#1c0f08]/50 border-b border-[#523628]/60 px-4 py-2.5 text-xs font-bold text-[#e5a93b] uppercase tracking-widest">
              Journal du Saloon 📜
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-1.5 text-xs font-mono">
              {gameState.logs.map((log) => (
                <div key={log.id} className="text-amber-100/90 leading-relaxed break-words">
                  <span className="text-[#e5a93b]/50 font-bold mr-1">[{log.timestamp}]</span>
                  <span className={`${
                    log.type === 'warning' ? 'text-red-400 font-semibold' :
                    log.type === 'system' ? 'text-cyan-400 font-semibold' :
                    log.type === 'phase' ? 'text-emerald-400 font-bold' :
                    log.type === 'sheriff' ? 'text-[#e5a93b] font-bold' :
                    log.type === 'bribe' ? 'text-yellow-400 font-semibold' :
                    log.type === 'inspection-liar' ? 'text-red-500 font-bold' :
                    log.type === 'inspection-honest' ? 'text-emerald-500 font-bold' :
                    'text-amber-100/80'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <ChatBox messages={chatMessages} onSendMessage={onSendChat} />
        </div>
      </div>



      {/* Declaration Modal */}
      {showDeclareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-zinc-100 shadow-2xl">
            <h2 className="text-xl font-bold font-serif text-[#e5a93b] text-center mb-4 uppercase tracking-wider">
              Déclaration de Cargaison
            </h2>
            <p className="text-xs text-zinc-400 text-center mb-4">
              Sélectionnez la marchandise légale déclarée au Shérif (pour vos {gameState.bags[localPlayerId]?.cards.length} carte(s)) :
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {legalGoods.map((goodId) => {
                const def = CARD_THEMES[theme][goodId];
                return (
                  <button
                    key={goodId}
                    onClick={() => setSelectedGoodId(goodId)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-sm font-semibold select-none ${
                      selectedGoodId === goodId
                        ? "bg-zinc-800 border-[#e5a93b] text-zinc-100"
                        : "bg-zinc-950 border-zinc-850 hover:bg-zinc-800/40 text-zinc-300"
                    }`}
                  >
                    <span className="text-2xl">{def.icon}</span>
                    <span>{def.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end text-sm font-bold">
              <Button
                variant="outline"
                onClick={() => setShowDeclareModal(false)}
                className="bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-2xl"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  onDeclareBag(selectedGoodId);
                  setShowDeclareModal(false);
                }}
                className="bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] rounded-2xl"
              >
                Déclarer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bribe Modal */}
      {showBribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-zinc-100 shadow-2xl">
            <h2 className="text-xl font-bold font-serif text-[#e5a93b] text-center mb-4 uppercase tracking-wider">
              Offrir un Pot-de-Vin 🤝
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-1">
                  Pièces d'Or offertes :
                </label>
                <input
                  type="number"
                  min="0"
                  max={localPlayer?.gold || 0}
                  value={bribeGold}
                  onChange={(e) => setBribeGold(Math.min(localPlayer?.gold || 0, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl px-4 py-2 text-zinc-100 focus:outline-none focus:border-[#e5a93b]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-1">
                  Promesse / Message au Shérif :
                </label>
                <input
                  type="text"
                  placeholder="Ferme les yeux, y a que des pommes..."
                  value={bribeText}
                  onChange={(e) => setBribeText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl px-4 py-2 text-zinc-100 focus:outline-none focus:border-[#e5a93b]"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end text-sm font-bold">
              <Button
                variant="outline"
                onClick={() => setShowBribeModal(false)}
                className="bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-2xl"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  onOfferBribe(bribeGold, bribeText);
                  setShowBribeModal(false);
                }}
                className="bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] rounded-2xl"
              >
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
