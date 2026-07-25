import { usePeer as useCorePeer, type PeerManagerLike } from "p2play-core";
import type { GameState } from "../core/types";
import { soundManager } from "../core/soundFX";

interface UsePeerOptions {
  externalPeerManager?: PeerManagerLike<GameState>;
}

export function usePeer(options?: UsePeerOptions) {
  return useCorePeer<GameState>({
    externalPeerManager: options?.externalPeerManager,
    namespacePrefix: "sherif",
    sounds: {
      coin: () => soundManager.playCoin(),
      card: () => soundManager.playCard(),
      bagsnap: () => soundManager.playBagSnap(),
      gavel: () => soundManager.playGavel(),
      victory: () => soundManager.playVictory(),
      defeat: () => soundManager.playDefeat(),
      click: () => soundManager.playClick(),
      sword: () => soundManager.playSword(),
      skullthud: () => soundManager.playSkullThud(),
      bid: () => soundManager.playBid(),
      ping: () => soundManager.playPing(),
    },
  });
}
