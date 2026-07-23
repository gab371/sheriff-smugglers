import { test, expect } from "@playwright/test";
import { createEngine, act, forceHands, getState } from "./helpers/engine";
import {
  honestCornHand,
  liarMixedHand,
  medievalAppleHand,
  modernSodaHand,
} from "./fixtures/scenarios";

/**
 * Sheriff & Smugglers ? per-rule E2E specs. The engine is driven directly via
 * window.__testHooks__ (no PeerJS, no 2nd browser context) for fast,
 * deterministic coverage. Hands are forced by cardId for known scenarios.
 */

type Page = import("@playwright/test").Page;

async function lobbyVisible(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Saloon/i })).toBeVisible({ timeout: 30_000 });
}

/** Create a 2-player game and start it. Round 1: p1=sheriff, p2=merchant. */
async function setupTwoPlayers(page: Page) {
  await createEngine(page);
  await act(page, "addPlayer", "p1", "Host", "??", true);
  await act(page, "addPlayer", "p2", "Guest", "??", false);
  expect(await act(page, "startGame")).toBe(true);
  const state = await getState(page);
  expect(state.phase).toBe("MARKET_DRAW");
  expect(state.sheriffIndex).toBe(0);
  return state;
}

/** Drive one merchant through market(discard 0) ? load 2 cards ? declare good. */
async function merchantLoadAndDeclare(
  page: Page,
  merchantId: string,
  hand: string[],
  good: string,
) {
  await forceHands(page, { [merchantId]: hand });
  const h = (await getState(page)).players.find((p: any) => p.id === merchantId).hand;
  await act(page, "merchantMarketDiscard", merchantId, []);
  await act(page, "loadBag", merchantId, [h[0].uid, h[1].uid]);
  expect(await act(page, "declareBag", merchantId, good)).toBe(true);
}

test("startGame: 2 players ? MARKET_DRAW, sheriff = host, 4 rounds total", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  const state = await getState(page);
  expect(state.roundNumber).toBe(1);
  expect(state.totalRounds).toBe(4);
  expect(state.players[0].gold).toBe(50);
  expect(state.players[0].hand.length).toBe(6);
});

test("MARKET_DRAW: merchant keeps hand (discard 0) ? BAG_LOADING", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await act(page, "merchantMarketDiscard", "p2", []);
  const state = await getState(page);
  expect(state.phase).toBe("BAG_LOADING");
  expect(state.bags["p2"].status).toBe("WAITING");
});

test("BAG ? DECLARATION ? PASS (honest): cards go to stand, ROUND_END", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await merchantLoadAndDeclare(page, "p2", honestCornHand, "corn");
  let state = await getState(page);
  expect(state.phase).toBe("INSPECTION");
  expect(state.bags["p2"].status).toBe("DECLARED");
  await act(page, "sheriffPassBag", "p2");
  state = await getState(page);
  expect(state.bags["p2"].status).toBe("PASSED");
  expect(state.players[1].stand.corn.length).toBe(2);
  expect(state.phase).toBe("ROUND_END");
});

test("INSPECTION honest bag: sheriff pays fine to merchant", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await merchantLoadAndDeclare(page, "p2", honestCornHand, "corn");
  await act(page, "sheriffInspectBag", "p2");
  const state = await getState(page);
  expect(state.bags["p2"].status).toBe("INSPECTED");
  expect(state.players[1].gold).toBe(54); // 50 + 4 (2 corns * fine 2)
  expect(state.players[0].gold).toBe(46); // 50 - 4
  expect(state.players[1].stand.corn.length).toBe(2);
  expect(state.phase).toBe("ROUND_END");
});

test("INSPECTION liar bag: merchant pays sheriff, illegal seized", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await merchantLoadAndDeclare(page, "p2", liarMixedHand, "corn"); // bag = corn + spices
  await act(page, "sheriffInspectBag", "p2");
  const state = await getState(page);
  expect(state.bags["p2"].status).toBe("INSPECTED");
  expect(state.players[1].gold).toBe(46); // 50 - 4 (spices fine 4)
  expect(state.players[0].gold).toBe(54); // 50 + 4
  expect(state.players[1].stand.corn.length).toBe(1); // honest corn kept
  expect(state.discardPile1.some((c: any) => c.cardId === "spices")).toBe(true);
  expect(state.phase).toBe("ROUND_END");
});

test("BRIBE: accepted on pass ? gold transferred to sheriff", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await merchantLoadAndDeclare(page, "p2", honestCornHand, "corn");
  await act(page, "offerBribe", "p2", { gold: 10, text: "sois gentil" });
  await act(page, "sheriffPassBag", "p2");
  const state = await getState(page);
  expect(state.activeBribes["p2"].status).toBe("ACCEPTED");
  expect(state.players[1].gold).toBe(40); // 50 - 10
  expect(state.players[0].gold).toBe(60); // 50 + 10
  expect(state.bags["p2"].status).toBe("PASSED");
});

test("BRIBE: rejected on inspect", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await merchantLoadAndDeclare(page, "p2", honestCornHand, "corn");
  await act(page, "offerBribe", "p2", { gold: 10, text: "ignore" });
  await act(page, "sheriffInspectBag", "p2");
  const state = await getState(page);
  expect(state.activeBribes["p2"].status).toBe("REJECTED");
  expect(state.bags["p2"].status).toBe("INSPECTED");
});

test("ROUND_END ? nextRound rotates sheriff and increments round", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await forceHands(page, { p2: honestCornHand });
  const h = (await getState(page)).players[1].hand;
  await act(page, "merchantMarketDiscard", "p2", []);
  await act(page, "loadBag", "p2", [h[0].uid]);
  await act(page, "declareBag", "p2", "corn");
  await act(page, "sheriffPassBag", "p2");
  let state = await getState(page);
  expect(state.phase).toBe("ROUND_END");
  // endRound already increments roundNumber and rotates sheriffIndex (non-final round)
  expect(state.roundNumber).toBe(2);
  expect(state.sheriffIndex).toBe(1);
  await act(page, "nextRound");
  state = await getState(page);
  expect(state.phase).toBe("MARKET_DRAW");
  expect(state.roundNumber).toBe(2);
  expect(state.sheriffIndex).toBe(1);
});

const DECK_THEME_CASES: Array<{ theme: string; hand: string[]; good: string }> = [
  { theme: "WESTERN", hand: honestCornHand, good: "corn" },
  { theme: "MEDIEVAL", hand: medievalAppleHand, good: "apple" },
  { theme: "MODERN", hand: modernSodaHand, good: "soda" },
];

for (const { theme, hand, good } of DECK_THEME_CASES) {
  test(`deck theme ${theme}: declare ${good} accepted`, async ({ page }) => {
    await lobbyVisible(page);
    await createEngine(page);
    await act(page, "addPlayer", "p1", "Host", "??", true);
    await act(page, "addPlayer", "p2", "Guest", "??", false);
    expect(await act(page, "changeDeckTheme", theme)).toBe(true);
    await act(page, "startGame");
    await merchantLoadAndDeclare(page, "p2", hand, good);
    const state = await getState(page);
    expect(state.deckTheme).toBe(theme);
    expect(state.bags["p2"].declaredGood).toBe(good);
    expect(state.phase).toBe("INSPECTION");
  });
}
