import { test, expect } from "@playwright/test";
import { createEngine, act, forceHands, getState } from "./helpers/engine";
import { honestCornHand } from "./fixtures/scenarios";

/**
 * Sheriff & Smugglers — full-game E2E spec. Plays a complete 2-player game
 * (4 rounds, rotating sheriff) from MARKET_DRAW to GAME_OVER via the engine
 * hooks (deterministic, no PeerJS). Each round the merchant ships an honest
 * corn bag and the sheriff lets it pass.
 */
type Page = import("@playwright/test").Page;

async function lobbyVisible(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Créer un Saloon/i })).toBeVisible({ timeout: 30_000 });
}

/** Play one full round for the current merchant: discard 0, load 1 corn, declare corn, pass. */
async function playRound(page: Page, state: any) {
  const sheriff = state.players[state.sheriffIndex];
  const merchant = state.players.find((p: any) => p.id !== sheriff.id);
  await forceHands(page, { [merchant.id]: honestCornHand });
  const h = (await getState(page)).players.find((p: any) => p.id === merchant.id).hand;
  await act(page, "merchantMarketDiscard", merchant.id, []);
  await act(page, "loadBag", merchant.id, [h[0].uid]);
  await act(page, "declareBag", merchant.id, "corn");
  await act(page, "sheriffPassBag", merchant.id);
}

test("full game: 4 rounds → GAME_OVER with final scores", async ({ page }) => {
  await lobbyVisible(page);
  await createEngine(page);
  await act(page, "addPlayer", "p1", "Host", "🤠", true);
  await act(page, "addPlayer", "p2", "Guest", "🤠", false);
  await act(page, "startGame");

  let state = await getState(page);
  expect(state.totalRounds).toBe(4);

  for (let round = 1; round <= 4; round++) {
    state = await getState(page);
    expect(state.roundNumber).toBe(round);
    await playRound(page, state);
    state = await getState(page);
    if (round < 4) {
      expect(state.phase).toBe("ROUND_END");
      await act(page, "nextRound");
    } else {
      expect(state.phase).toBe("GAME_OVER");
    }
  }

  const final = await getState(page);
  expect(final.phase).toBe("GAME_OVER");
  expect(Array.isArray(final.winnerScores)).toBe(true);
  expect(final.winnerScores.length).toBe(2);
});
