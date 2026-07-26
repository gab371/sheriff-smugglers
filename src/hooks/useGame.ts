import { useEffect, useRef, useState, useCallback } from "react";
import { usePeer } from "./usePeer";
import { GameEngine } from "../core/gameEngine";
import { sanitizeGameState, sanitizeGameStateForSpectator } from "../network/protocol";
import type { NetworkMessage } from "../network/protocol";
import type { GameState, DeckTheme } from "../core/types";
import { installTestHooks, registerEngineGetter } from "../testHooks";

interface UseGameOptions {
  externalPeerManager?: import("p2play-core").PeerManagerLike;
  playerName?: string;
  playerAvatar?: string;
  isEmbedded?: boolean;
  isHost?: boolean;
  lateJoin?: boolean;
  gameConfig?: any;
  hubPhase?: string;
}

export function useGame(options?: UseGameOptions) {
  const p2p = usePeer(options);
  const {
    isHost,
    myPeerId,
    peerManager,
    playSfx,
    hostGame,
    joinGame,
    sendAction,
    sendChat,
    gameState,
    status,
    error,
    chatMessages,
    disconnect
  } = p2p;

  const gameEngineRef = useRef<GameEngine | null>(null);
  const victoryPlayedRef = useRef<boolean>(false);

  // Expose test hooks (dev/test builds only) for E2E determinism.
  // No-op in production (installTestHooks gates on import.meta.env.PROD).
  useEffect(() => {
    registerEngineGetter(() => gameEngineRef.current);
    installTestHooks();
  }, []);

  const [localPlayerName, setLocalPlayerName] = useState<string>(options?.playerName || "");
  const [localPlayerAvatar, setLocalPlayerAvatar] = useState<string>(options?.playerAvatar || "🤠");

  // Helper function to broadcast sanitized states to each player.
  // Hides each player's private information (hand, contraband, bag contents)
  // from the others — including from the host/Sheriff — to prevent cheating.
  const broadcastSanitizedStates = useCallback((engineState: GameState, overridePeerId?: string) => {
    const activePeerId = overridePeerId || myPeerId;
    if (!activePeerId) return;

    const sent = new Set<string>([activePeerId]);
    const resolveConn = (id: string) => {
      let conn = peerManager.connections.get(id);
      if (!conn) {
        for (const [peerId, connection] of peerManager.connections.entries()) {
          if (peerId.endsWith(id) || id.endsWith(peerId)) {
            conn = connection;
            break;
          }
        }
      }
      return conn;
    };

    const hostSanitized = sanitizeGameState(engineState, activePeerId);
    p2p.peerManager.onStateReceived?.(JSON.parse(JSON.stringify(hostSanitized)));

    engineState.players.forEach((p) => {
      if (p.id === activePeerId) return;
      const conn = resolveConn(p.id);
      if (conn && conn.open) {
        conn.send({ type: 'STATE_UPDATE', state: sanitizeGameState(engineState, p.id) });
        sent.add(p.id);
      }
    });

    const spectatorView = sanitizeGameStateForSpectator(engineState);
    engineState.spectators.forEach((s) => {
      const conn = resolveConn(s.id);
      if (conn && conn.open) {
        conn.send({ type: 'STATE_UPDATE', state: JSON.parse(JSON.stringify(spectatorView)) });
        sent.add(s.id);
      }
    });

    peerManager.connections.forEach((conn, peerId) => {
      if (!conn.open || sent.has(peerId)) return;
      const alreadyKnown =
        engineState.players.some((p) => p.id === peerId || peerId.endsWith(p.id) || p.id.endsWith(peerId)) ||
        engineState.spectators.some((s) => s.id === peerId || peerId.endsWith(s.id) || s.id.endsWith(peerId));
      if (alreadyKnown) return;
      conn.send({ type: 'STATE_UPDATE', state: JSON.parse(JSON.stringify(spectatorView)) });
    });
  }, [myPeerId, peerManager, p2p.peerManager]);

  // Host Action Handler & Embedded Auto-Start
  useEffect(() => {
    if (!isHost) {
      gameEngineRef.current = null;
      return;
    }

    if (!gameEngineRef.current) {
      gameEngineRef.current = new GameEngine();
    }

    const engine = gameEngineRef.current;

    // Embedded setup: populate players from the hub lobby but stay in LOBBY
    // so the host can pick the deck theme before clicking "Lancer la Partie".
    if (options?.isEmbedded && options?.externalPeerManager && engine.state.phase === 'LOBBY') {
      setTimeout(() => {
        engine.state.players = [];
        const hostName = options.playerName || "Hôte";
        const hostAvatar = options.playerAvatar || "🤠";
        engine.addPlayer(myPeerId!, hostName, hostAvatar, true);

        if ((peerManager as any).lobbyPlayers) {
          (peerManager as any).lobbyPlayers.forEach((p: any) => {
            if (p.peerId && p.peerId !== myPeerId) {
              engine.addPlayer(p.peerId, p.username || `Marchand ${p.peerId.slice(0, 4)}`, p.avatar || "🤠", false);
            }
          });
        }

        // Do NOT auto-start: broadcast the LOBBY state so the saloon lobby
        // (with the deck selector + "Lancer la Partie") shows for everyone.
        broadcastSanitizedStates(engine.state);
      }, 0);
    }

    peerManager.hostActionHandler = (_senderPeerId, actionMsg) => {
      const msg = actionMsg as NetworkMessage;
      if (msg.type === 'ACTION') {
        const { actionName, playerId, payload } = msg;

        switch (actionName) {
          case 'JOIN_GAME':
            if (engine.state.phase === 'LOBBY') {
              engine.addPlayer(playerId, payload.name, payload.avatar, playerId === myPeerId);
            } else {
              // Late joiner: a running game only accepts spectators.
              engine.addSpectator(playerId, payload.name, payload.avatar);
            }
            break;

          case 'TOGGLE_READY':
            engine.setPlayerReady(playerId, payload.readyStatus);
            // Auto ready up logs
            const p = engine.state.players.find((pl) => pl.id === playerId);
            if (p) {
              engine.addLog(`${p.name} est ${payload.readyStatus ? 'prêt !' : 'en attente...'}`, 'info');
            }
            break;

          case 'START_GAME':
            if (playerId === myPeerId) {
              const success = engine.startGame();
              if (success) {
                playSfx('gavel');
              }
            }
            break;

          case 'CHANGE_DECK_THEME':
            if (playerId === myPeerId) {
              engine.changeDeckTheme(payload.theme);
            }
            break;

          case 'SET_ROLE': {
            const requesterIsHost = playerId === myPeerId;
            const targetId = payload.peerId as string;
            const nextRole = payload.role as 'player' | 'spectator';
            if (requesterIsHost || targetId === playerId) {
              engine.setPlayerRole(targetId, nextRole, {
                requesterPeerId: playerId,
                requesterIsHost,
              });
            }
            break;
          }

          case 'LOCK_SPECTATOR':
            if (playerId === myPeerId) {
              const targetId = payload.peerId as string;
              const locked = !!payload.locked;
              if (locked) {
                engine.setPlayerRole(targetId, 'spectator', {
                  requesterPeerId: playerId,
                  requesterIsHost: true,
                });
              }
              engine.setSpectatorLock(targetId, locked);
            }
            break;

          case 'MARKET_DISCARD':
            engine.merchantMarketDiscard(playerId, payload.discardUids);
            playSfx('card');
            break;

          case 'MARKET_DRAW':
            engine.merchantMarketDrawOne(playerId, payload.source);
            playSfx('card');
            break;

          case 'LOAD_BAG':
            engine.loadBag(playerId, payload.cardUids);
            playSfx('bagsnap');
            break;

          case 'DECLARE_BAG':
            engine.declareBag(playerId, payload.declaredGoodId);
            playSfx('gavel');
            break;

          case 'OFFER_BRIBE':
            engine.offerBribe(playerId, { gold: payload.gold, text: payload.text });
            playSfx('coin');
            break;

          case 'SHERIFF_PASS':
            if (engine.getSheriff().id === playerId) {
              engine.sheriffPassBag(payload.merchantId);
              playSfx('coin');
            }
            break;

          case 'SHERIFF_INSPECT':
            if (engine.getSheriff().id === playerId) {
              engine.sheriffInspectBag(payload.merchantId);
              // The Sheriff "looks into the bag": bag snap then gavel.
              playSfx('bagsnap');
              playSfx('gavel');
            }
            break;

          case 'NEXT_ROUND':
            if (engine.getSheriff().id === playerId) {
              engine.nextRound();
              playSfx('gavel');
            }
            break;
        }

        broadcastSanitizedStates(engine.state);

        // Play a victory fanfare once when the game ends (broadcast to all peers).
        if (engine.state.phase === 'GAME_OVER' && !victoryPlayedRef.current) {
          victoryPlayedRef.current = true;
          playSfx('victory');
        } else if (engine.state.phase !== 'GAME_OVER') {
          victoryPlayedRef.current = false;
        }
      }
    };

    peerManager.onPeerStatusChange = (peerId: string, peerStatus: 'CONNECTED' | 'DISCONNECTED') => {
      if (peerStatus === 'DISCONNECTED') {
        engine.removePlayer(peerId);
        broadcastSanitizedStates(engine.state);
      } else if (peerStatus === 'CONNECTED') {
        broadcastSanitizedStates(engine.state);
      }
    };

    return () => {
      peerManager.hostActionHandler = null;
      peerManager.onPeerStatusChange = null;
    };
  }, [isHost, myPeerId, peerManager, playSfx, broadcastSanitizedStates]);

  // Embedded guests must announce themselves to the host engine.
  useEffect(() => {
    if (!options?.isEmbedded || isHost || !myPeerId) return;
    const name = options.playerName || localPlayerName || "Joueur";
    const avatar = options.playerAvatar || localPlayerAvatar || "👤";
    const sendJoin = () => {
      peerManager.sendToHost("ACTION", {
        actionName: "JOIN_GAME",
        playerId: myPeerId,
        payload: { name, avatar },
      });
    };
    const t1 = window.setTimeout(sendJoin, 250);
    const t2 = window.setTimeout(sendJoin, 1000);
    const t3 = window.setTimeout(sendJoin, 2500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [
    options?.isEmbedded,
    options?.playerName,
    options?.playerAvatar,
    isHost,
    myPeerId,
    localPlayerName,
    localPlayerAvatar,
    peerManager,
  ]);

  // Client actions
  const hostRoom = useCallback(async (name: string, avatar: string) => {
    setLocalPlayerName(name);
    setLocalPlayerAvatar(avatar);
    const roomId = await hostGame();
    const engine = new GameEngine();
    gameEngineRef.current = engine;
    engine.addPlayer(roomId, name, avatar, true);
    broadcastSanitizedStates(engine.state, roomId);
  }, [hostGame, broadcastSanitizedStates]);

  const joinRoom = useCallback(async (name: string, avatar: string, roomId: string) => {
    setLocalPlayerName(name);
    setLocalPlayerAvatar(avatar);
    const id = await joinGame(roomId);
    setTimeout(() => {
      peerManager.sendToHost('ACTION', {
        actionName: 'JOIN_GAME',
        playerId: id,
        payload: { name, avatar },
      });
    }, 1000);
  }, [joinGame, peerManager]);

  const toggleReady = useCallback((readyStatus: boolean) => {
    sendAction('TOGGLE_READY', { readyStatus });
  }, [sendAction]);

  const startGame = useCallback(() => {
    sendAction('START_GAME', {});
  }, [sendAction]);

  const discardMarket = useCallback((discardUids: string[]) => {
    sendAction('MARKET_DISCARD', { discardUids });
  }, [sendAction]);

  const drawMarket = useCallback((source: 'DECK' | 'DISCARD1' | 'DISCARD2') => {
    sendAction('MARKET_DRAW', { source });
  }, [sendAction]);

  const loadBag = useCallback((cardUids: string[]) => {
    sendAction('LOAD_BAG', { cardUids });
  }, [sendAction]);

  const declareBag = useCallback((declaredGoodId: string) => {
    sendAction('DECLARE_BAG', { declaredGoodId });
  }, [sendAction]);

  const offerBribe = useCallback((gold: number, text: string) => {
    sendAction('OFFER_BRIBE', { gold, text });
  }, [sendAction]);

  const sheriffPass = useCallback((merchantId: string) => {
    sendAction('SHERIFF_PASS', { merchantId });
  }, [sendAction]);

  const sheriffInspect = useCallback((merchantId: string) => {
    sendAction('SHERIFF_INSPECT', { merchantId });
  }, [sendAction]);

  const nextRound = useCallback(() => {
    sendAction('NEXT_ROUND', {});
  }, [sendAction]);

  const sendChatMessage = useCallback((text: string) => {
    sendChat(localPlayerName || "Marchand", text);
  }, [sendChat, localPlayerName]);

  const changeDeckTheme = useCallback((theme: DeckTheme) => {
    sendAction('CHANGE_DECK_THEME', { theme });
  }, [sendAction]);

  const setRole = useCallback((peerId: string, role: 'player' | 'spectator') => {
    sendAction('SET_ROLE', { peerId, role });
  }, [sendAction]);

  const lockSpectator = useCallback((peerId: string, locked: boolean) => {
    sendAction('LOCK_SPECTATOR', { peerId, locked });
  }, [sendAction]);

  return {
    isHost,
    myPeerId,
    hostPeerId: p2p.hostPeerId,
    peerManager: p2p.peerManager,
    connectedPeers: p2p.connectedPeers,
    chatMessages,
    gameState,
    status,
    error,
    hostRoom,
    joinRoom,
    toggleReady,
    startGame,
    changeDeckTheme,
    setRole,
    lockSpectator,
    discardMarket,
    drawMarket,
    loadBag,
    declareBag,
    offerBribe,
    sheriffPass,
    sheriffInspect,
    nextRound,
    sendChatMessage,
    disconnect,
    localPlayerName,
    localPlayerAvatar,
  };
}
