import type { GameState, Player, Card, GameLog } from "./types";
import { CARD_DEFINITIONS, createDeck, shuffleDeck } from "./cards";
import { calculateFinalScores } from "./scoring";

export interface GameEngineOptions {
  roundsPerPlayer?: number;
}

export class GameEngine {
  public roundsPerPlayer: number;
  public state: GameState;

  constructor(options: GameEngineOptions = {}) {
    this.roundsPerPlayer = options.roundsPerPlayer || 2;
    this.state = this.createInitialState();
  }

  public createInitialState(): GameState {
    return {
      phase: 'LOBBY',
      players: [],
      sheriffIndex: 0,
      roundNumber: 1,
      totalRounds: 0,
      drawDeck: [],
      discardPile1: [],
      discardPile2: [],
      bags: {},
      activeBribes: {},
      marketPlayerStates: {},
      logs: [],
      winnerScores: null,
    };
  }

  public addLog(message: string, type: GameLog["type"] = 'info'): void {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.state.logs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      message,
      type,
    });
    if (this.state.logs.length > 50) this.state.logs.pop();
  }

  public addPlayer(id: string, name: string, avatar?: string, isHost: boolean = false): boolean {
    if (this.state.phase !== 'LOBBY') return false;
    if (this.state.players.find((p) => p.id === id)) return false;

    this.state.players.push({
      id,
      name,
      avatar: avatar || '🤠',
      isHost,
      gold: 50,
      hand: [],
      stand: { apple: [], cheese: [], bread: [], chicken: [] },
      contraband: [],
      isReady: false,
    });

    this.addLog(`${name} a rejoint le saloon !`, 'system');
    return true;
  }

  public removePlayer(id: string): void {
    const pIndex = this.state.players.findIndex((p) => p.id === id);
    if (pIndex !== -1) {
      const p = this.state.players[pIndex];
      this.state.players.splice(pIndex, 1);
      this.addLog(`${p.name} s'est déconnecté.`, 'warning');
      if (this.state.players.length < 2 && this.state.phase !== 'LOBBY') {
        this.state.phase = 'LOBBY';
        this.addLog(`Pas assez de joueurs. Retour au saloon.`, 'warning');
      }
    }
  }

  public setPlayerReady(id: string, readyStatus: boolean): void {
    const p = this.state.players.find((p) => p.id === id);
    if (p) p.isReady = readyStatus;
  }

  public startGame(): boolean {
    if (this.state.players.length < 2) return false;

    this.state.drawDeck = createDeck();
    this.state.discardPile1 = [];
    this.state.discardPile2 = [];
    this.state.sheriffIndex = 0;
    this.state.roundNumber = 1;
    this.state.totalRounds = this.state.players.length * this.roundsPerPlayer;

    this.state.players.forEach((player) => {
      player.gold = 50;
      player.hand = this.drawFromDeck(6);
      player.stand = { apple: [], cheese: [], bread: [], chicken: [] };
      player.contraband = [];
    });

    this.state.discardPile1 = this.drawFromDeck(5);
    this.state.discardPile2 = this.drawFromDeck(5);

    this.startMarketPhase();
    return true;
  }

  public drawFromDeck(count: number): Card[] {
    const cards: Card[] = [];
    for (let i = 0; i < count; i++) {
      if (this.state.drawDeck.length === 0) {
        const recycled = [...this.state.discardPile1, ...this.state.discardPile2];
        this.state.discardPile1 = [];
        this.state.discardPile2 = [];
        this.state.drawDeck = shuffleDeck(recycled);
        this.addLog(`Le paquet principal a été mélangé.`, 'system');
      }
      if (this.state.drawDeck.length > 0) {
        const c = this.state.drawDeck.pop();
        if (c) cards.push(c);
      }
    }
    return cards;
  }

  public startMarketPhase(): void {
    this.state.phase = 'MARKET_DRAW';
    this.state.marketPlayerStates = {};
    this.state.players.forEach((p) => {
      this.state.marketPlayerStates[p.id] = { step: 'DISCARD', cardsToDraw: 0, done: false };
    });

    const sheriff = this.getSheriff();
    this.addLog(`--- MANCHE ${this.state.roundNumber} / ${this.state.totalRounds} ---`, 'phase');
    this.addLog(`Le Shérif est ${sheriff.name} !`, 'sheriff');
  }

  public merchantMarketDiscard(playerId: string, discardUids: string[] = []): boolean {
    if (this.state.phase !== 'MARKET_DRAW') return false;
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || playerId === this.getSheriff().id) return false;

    const mState = this.state.marketPlayerStates[playerId];
    if (!mState || mState.step !== 'DISCARD') return false;

    const discardedCards = player.hand.filter((c) => discardUids.includes(c.uid));
    player.hand = player.hand.filter((c) => !discardUids.includes(c.uid));

    mState.pendingDiscards = discardedCards;

    if (discardedCards.length === 0) {
      mState.step = 'DONE';
      mState.done = true;
      this.addLog(`${player.name} conserve sa main sans défausser.`, 'action');
    } else {
      mState.step = 'DRAWING';
      mState.cardsToDraw = discardedCards.length;
      this.addLog(
        `${player.name} a préparé ${discardedCards.length} carte(s) à défausser. Doit piocher ${discardedCards.length} carte(s).`,
        'action'
      );
    }

    if (this.getMerchants().every((m) => this.state.marketPlayerStates[m.id]?.done)) {
      this.startBagLoadingPhase();
    }
    return true;
  }

  public merchantMarketDrawOne(playerId: string, source: 'DECK' | 'DISCARD1' | 'DISCARD2' = 'DECK'): boolean {
    if (this.state.phase !== 'MARKET_DRAW') return false;
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || playerId === this.getSheriff().id) return false;

    const mState = this.state.marketPlayerStates[playerId];
    if (!mState || mState.step !== 'DRAWING' || mState.cardsToDraw <= 0) return false;

    let drawnCard: Card | null = null;
    if (source === 'DISCARD1' && this.state.discardPile1.length > 0) {
      drawnCard = this.state.discardPile1.pop() || null;
    } else if (source === 'DISCARD2' && this.state.discardPile2.length > 0) {
      drawnCard = this.state.discardPile2.pop() || null;
    } else {
      const drawn = this.drawFromDeck(1);
      if (drawn.length > 0) drawnCard = drawn[0];
    }

    if (drawnCard) {
      player.hand.push(drawnCard);
      mState.cardsToDraw -= 1;
      if (source === 'DECK') {
        this.addLog(`${player.name} a pioché 1 carte secrète depuis la pioche.`, 'action');
      } else {
        const srcName = source === 'DISCARD1' ? 'Défausse 1' : 'Défausse 2';
        this.addLog(`${player.name} a pioché ${drawnCard.name} depuis ${srcName}.`, 'action');
      }
    }

    if (mState.cardsToDraw <= 0) {
      if (mState.pendingDiscards && mState.pendingDiscards.length > 0) {
        this.state.discardPile1.push(...mState.pendingDiscards);
        mState.pendingDiscards = [];
      }
      mState.step = 'DONE';
      mState.done = true;
    }

    if (this.getMerchants().every((m) => this.state.marketPlayerStates[m.id]?.done)) {
      this.startBagLoadingPhase();
    }
    return true;
  }

  public startBagLoadingPhase(): void {
    this.state.phase = 'BAG_LOADING';
    this.state.bags = {};
    this.getMerchants().forEach((m) => {
      this.state.bags[m.id] = { cards: [], declaredGood: null, declaredCount: 0, status: 'WAITING' };
    });
    this.addLog(`Phase du Sac : Remplissez secrètement votre sac (1 à 5 cartes).`, 'phase');
  }

  public loadBag(playerId: string, cardUids: string[]): boolean {
    if (this.state.phase !== 'BAG_LOADING') return false;
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || cardUids.length < 1 || cardUids.length > 5) return false;

    const bagCards = player.hand.filter((c) => cardUids.includes(c.uid));
    player.hand = player.hand.filter((c) => !cardUids.includes(c.uid));

    this.state.bags[playerId] = {
      cards: bagCards,
      declaredGood: null,
      declaredCount: bagCards.length,
      status: 'LOADED',
    };

    this.addLog(`${player.name} a fermé son sac avec ${bagCards.length} marchandise(s).`, 'action');

    if (this.getMerchants().every((m) => this.state.bags[m.id]?.status === 'LOADED')) {
      this.startDeclarationPhase();
    }
    return true;
  }

  public startDeclarationPhase(): void {
    this.state.phase = 'DECLARATION';
    this.addLog(`Phase de Déclaration : Déclarez votre marchandise légale au Shérif !`, 'phase');
  }

  public declareBag(playerId: string, declaredGoodId: string): boolean {
    if (this.state.phase !== 'DECLARATION') return false;
    const bag = this.state.bags[playerId];
    if (!bag || bag.status !== 'LOADED') return false;

    const goodDef = CARD_DEFINITIONS[declaredGoodId];
    if (!goodDef || goodDef.type !== 'LEGAL') return false;

    bag.declaredGood = declaredGoodId;
    bag.status = 'DECLARED';

    const player = this.state.players.find((p) => p.id === playerId);
    if (player) {
      this.addLog(`${player.name} déclare : "${bag.declaredCount} ${goodDef.name}(s) !"`, 'declaration');
    }

    if (this.getMerchants().every((m) => this.state.bags[m.id]?.status === 'DECLARED')) {
      this.startInspectionPhase();
    }
    return true;
  }

  public startInspectionPhase(): void {
    this.state.phase = 'INSPECTION';
    this.state.activeBribes = {};
    this.addLog(`Le Shérif commence les inspections et négociations !`, 'sheriff');
  }

  public offerBribe(merchantId: string, bribeData: { gold: string | number; text?: string }): boolean {
    if (this.state.phase !== 'INSPECTION') return false;
    const merchant = this.state.players.find((p) => p.id === merchantId);
    if (!merchant) return false;

    const goldOffer = Math.min(merchant.gold, Math.max(0, typeof bribeData.gold === 'string' ? parseInt(bribeData.gold) || 0 : bribeData.gold));
    this.state.activeBribes[merchantId] = { gold: goldOffer, text: bribeData.text || '', status: 'PENDING' };
    this.addLog(`${merchant.name} propose un pot-de-vin : ${goldOffer} Or "${bribeData.text || ''}"`, 'bribe');
    return true;
  }

  public sheriffPassBag(merchantId: string): boolean {
    if (this.state.phase !== 'INSPECTION') return false;
    const bag = this.state.bags[merchantId];
    if (!bag || ['PASSED', 'INSPECTED'].includes(bag.status)) return false;

    const merchant = this.state.players.find((p) => p.id === merchantId);
    const sheriff = this.getSheriff();
    if (!merchant || !sheriff) return false;

    const bribe = this.state.activeBribes[merchantId];
    if (bribe && bribe.gold > 0) {
      const actualGold = Math.min(merchant.gold, bribe.gold);
      merchant.gold -= actualGold;
      sheriff.gold += actualGold;
      bribe.status = 'ACCEPTED';
      this.addLog(`Le Shérif accepte le pot-de-vin de ${actualGold} Or de ${merchant.name} !`, 'bribe');
    }

    bag.status = 'PASSED';
    bag.cards.forEach((card) => {
      if (card.type === 'LEGAL') {
        if (!merchant.stand[card.cardId]) merchant.stand[card.cardId] = [];
        merchant.stand[card.cardId].push(card);
      } else {
        merchant.contraband.push(card);
      }
    });

    this.addLog(`Le Shérif laisse passer le sac de ${merchant.name} !`, 'pass');
    this.checkInspectionPhaseComplete();
    return true;
  }

  public sheriffInspectBag(merchantId: string): boolean {
    if (this.state.phase !== 'INSPECTION') return false;
    const bag = this.state.bags[merchantId];
    if (!bag || ['PASSED', 'INSPECTED'].includes(bag.status)) return false;

    const merchant = this.state.players.find((p) => p.id === merchantId);
    const sheriff = this.getSheriff();
    if (!merchant || !sheriff) return false;

    bag.status = 'INSPECTED';

    const bribe = this.state.activeBribes[merchantId];
    if (bribe) {
      bribe.status = 'REJECTED';
    }

    const declaredGood = bag.declaredGood;
    const honestCards = bag.cards.filter((c) => c.cardId === declaredGood);
    const illegalCards = bag.cards.filter((c) => c.cardId !== declaredGood);

    if (illegalCards.length === 0) {
      let totalFine = 0;
      honestCards.forEach((c) => {
        totalFine += c.fine;
        if (!merchant.stand[c.cardId]) merchant.stand[c.cardId] = [];
        merchant.stand[c.cardId].push(c);
      });

      const actualFine = Math.min(sheriff.gold, totalFine);
      sheriff.gold -= actualFine;
      merchant.gold += actualFine;
      this.addLog(
        `Inspection de ${merchant.name} : HONNÊTE ! Le Shérif paye ${actualFine} Or d'amende à ${merchant.name} !`,
        'inspection-honest'
      );
    } else {
      let totalFine = 0;
      honestCards.forEach((c) => {
        if (!merchant.stand[c.cardId]) merchant.stand[c.cardId] = [];
        merchant.stand[c.cardId].push(c);
      });

      illegalCards.forEach((c) => {
        totalFine += c.fine;
        this.state.discardPile1.push(c);
      });

      const actualFine = Math.min(merchant.gold, totalFine);
      merchant.gold -= actualFine;
      sheriff.gold += actualFine;
      this.addLog(
        `Inspection de ${merchant.name} : MENSONGE ! ${illegalCards.length} marchandise(s) saisie(s). ${merchant.name} paye ${actualFine} Or d'amende au Shérif !`,
        'inspection-liar'
      );
    }

    this.checkInspectionPhaseComplete();
    return true;
  }

  public checkInspectionPhaseComplete(): void {
    if (this.getMerchants().every((m) => ['PASSED', 'INSPECTED'].includes(this.state.bags[m.id]?.status))) {
      this.endRound();
    }
  }

  public endRound(): void {
    this.state.phase = 'ROUND_END';
    this.state.players.forEach((p) => {
      const needed = 6 - p.hand.length;
      if (needed > 0) p.hand.push(...this.drawFromDeck(needed));
    });

    if (this.state.roundNumber >= this.state.totalRounds) {
      this.endGame();
    } else {
      this.state.sheriffIndex = (this.state.sheriffIndex + 1) % this.state.players.length;
      this.state.roundNumber += 1;
      this.addLog(`Fin de manche. L'étoile du Shérif tourne !`, 'system');
    }
  }

  public nextRound(): void {
    if (this.state.phase === 'ROUND_END') {
      this.startMarketPhase();
    }
  }

  public endGame(): void {
    this.state.phase = 'GAME_OVER';
    this.state.winnerScores = calculateFinalScores(this.state.players);
    this.addLog(`=== FIN DE LA PARTIE ! ===`, 'phase');
  }

  public getSheriff(): Player {
    return this.state.players[this.state.sheriffIndex] || this.state.players[0];
  }

  public getMerchants(): Player[] {
    const sheriff = this.getSheriff();
    return this.state.players.filter((p) => p.id !== sheriff.id);
  }
}
