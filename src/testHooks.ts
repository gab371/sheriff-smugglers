import { GameEngine } from "./core/gameEngine";
import type { Card, DeckTheme, GamePhase } from "./core/types";
import { getCardDefinition } from "./core/cards";

/**
 * Test hooks for Sheriff & Smugglers E2E tests.
 *
 * Exposed on `window.__testHooks__` ONLY in non-production builds (Playwright
 * runs `vite` in dev mode, so the hooks are present during tests; the prod
 * build strips them). Determinism comes from forcing hands/coins/phase and
 * driving the live engine via `act` — no seeded RNG, no PeerJS, no 2nd browser
 * context. See docs/plans/06_tests_e2e_par_jeu/plan.md (Idea 6, Step 2).
 */
declare global {
  interface Window {
    __testHooks__?: SheriffTestHooks;
  }
}

export interface SheriffTestHooks {
  /** Create a fresh standalone engine (no PeerJS) and register it for the other hooks. */
  createEngine(): unknown;
  /** Replace a player's hand by cardId list (cards are built from the deck theme). */
  forceHands(hands: Record<string, string[]>): void;
  /** Force a player's gold amount. */
  forceCoins(playerId: string, gold: number): void;
  /** Force the engine phase. */
  setPhase(phase: GamePhase): void;
  /** Call an engine method by name with args (returns its result, serialized). */
  act(method: string, args: unknown[]): unknown;
  /** Read the live engine state. */
  getState(): unknown;
  /** Get the live engine instance (or null if not yet created). */
  getEngine(): GameEngine | null;
}

let engineGetter: (() => GameEngine | null) | null = null;
let testEngine: GameEngine | null = null;

/** Called from useGame to expose the live engine ref to the test hooks. */
export function registerEngineGetter(getter: () => GameEngine | null): void {
  engineGetter = getter;
}

function liveEngine(): GameEngine | null {
  return testEngine ?? engineGetter?.() ?? null;
}

function buildCard(cardId: string, theme: DeckTheme, index: number): Card | null {
  const def = getCardDefinition(cardId, theme);
  if (!def) return null;
  return { uid: `${cardId}_test_${index}`, cardId, ...def } as Card;
}

export function installTestHooks(): void {
  if (typeof window === "undefined") return;
  if (import.meta.env.PROD) return; // never expose in production builds
  if (window.__testHooks__) return; // idempotent

  window.__testHooks__ = {
    createEngine: () => {
      testEngine = new GameEngine();
      return testEngine.state;
    },
    forceHands: (hands) => {
      const engine = liveEngine();
      if (!engine) return;
      const theme = engine.state.deckTheme;
      for (const [playerId, cardIds] of Object.entries(hands)) {
        const p = engine.state.players.find((pl) => pl.id === playerId);
        if (!p) continue;
        const cards: Card[] = [];
        cardIds.forEach((id, i) => {
          const c = buildCard(id, theme, i);
          if (c) cards.push(c);
        });
        (p as unknown as { hand: Card[] }).hand = cards;
      }
    },
    forceCoins: (playerId, gold) => {
      const engine = liveEngine();
      const p = engine?.state.players.find((pl) => pl.id === playerId);
      if (p) (p as unknown as { gold: number }).gold = gold;
    },
    setPhase: (phase) => {
      const engine = liveEngine();
      if (engine) (engine.state as unknown as { phase: GamePhase }).phase = phase;
    },
    act: (method, args) => {
      const engine = liveEngine();
      if (!engine) return undefined;
      const fn = (engine as unknown as Record<string, (...a: unknown[]) => unknown>)[method];
      if (typeof fn !== "function") return undefined;
      return fn.apply(engine, args);
    },
    getState: () => liveEngine()?.state ?? null,
    getEngine: () => liveEngine(),
  };
}
