/**
 * Mock-data fixtures for Sheriff & Smugglers E2E tests. Determinism comes
 * from forcing hands by cardId (no seeded RNG). cardIds reference the deck
 * theme definitions in src/core/cards.ts. See docs/plans/06_tests_e2e_par_jeu/plan.md.
 */

/** 6 legal corn cards (WESTERN theme) — an honest bag. */
export const honestCornHand: string[] = ["corn", "corn", "corn", "corn", "corn", "corn"];

/** A mixed hand: corn (legal) + spices (contraband, WESTERN) — a lying bag. */
export const liarMixedHand: string[] = ["corn", "spices", "corn", "corn", "corn", "corn"];

/** MEDIEVAL theme legal good for deck-theme switching tests. */
export const medievalAppleHand: string[] = ["apple", "apple", "apple", "apple", "apple", "apple"];

/** MODERN theme legal good for deck-theme switching tests. */
export const modernSodaHand: string[] = ["soda", "soda", "soda", "soda", "soda", "soda"];
