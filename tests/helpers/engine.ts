import type { Page } from "@playwright/test";

/**
 * Playwright helpers wrapping window.__testHooks__ for Sheriff & Smugglers E2E
 * tests. The engine is driven directly (no PeerJS, no 2nd browser context) for
 * fast, deterministic per-rule coverage. See docs/plans/06_tests_e2e_par_jeu/plan.md.
 */

export async function createEngine(page: Page): Promise<any> {
  return page.evaluate(() => (window as any).__testHooks__.createEngine());
}

export async function act(page: Page, method: string, ...args: any[]): Promise<any> {
  return page.evaluate(
    ({ method, args }) => (window as any).__testHooks__.act(method, args),
    { method, args },
  );
}

/** Replace players' hands by cardId list (cards built from the deck theme). */
export async function forceHands(page: Page, hands: Record<string, string[]>): Promise<void> {
  await page.evaluate((h) => (window as any).__testHooks__.forceHands(h), hands);
}

/** Force a player's gold amount. */
export async function forceCoins(page: Page, playerId: string, gold: number): Promise<void> {
  await page.evaluate(
    ({ playerId, gold }) => (window as any).__testHooks__.forceCoins(playerId, gold),
    { playerId, gold },
  );
}

export async function setPhase(page: Page, phase: string): Promise<void> {
  await page.evaluate((p) => (window as any).__testHooks__.setPhase(p), phase);
}

export async function getState(page: Page): Promise<any> {
  return page.evaluate(() => (window as any).__testHooks__.getState());
}

export { expect } from "@playwright/test";
