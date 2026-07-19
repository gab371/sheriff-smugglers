import { useEffect, useRef, useState, useCallback } from "react";
import { usePeer } from "./usePeer";
import { GameEngine } from "../core/gameEngine";
import type { NetworkMessage } from "../network/protocol";

export function useGame() {
  const p2p = usePeer();
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
  const [localPlayerName, setLocalPlayerName] = useState<string>("");
  const [localPlayerAvatar, setLocalPlayerAvatar] = useState<string>("🤠");

  // Host Action Handler
  useEffect(() => {
    if (!isHost) {
      gameEngineRef.current = null;
      return;
    }

    if (!gameEngineRef.current) {
      gameEngineRef.current = new GameEngine();
    }

    const engine = gameEngineRef.current;

    peerManager.hostActionHandler = (_senderPeerId: string, actionMsg: NetworkMessage) => {
      if (actionMsg.type === 'ACTION') {
        const { actionName, playerId, payload } = actionMsg;

        switch (actionName) {
          case 'JOIN_GAME':
            engine.addPlayer(playerId, payload.name, payload.avatar, playerId === myPeerId);
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

        peerManager.broadcastState(engine.state);
        peerManager.onStateReceived?.(JSON.parse(JSON.stringify(engine.state)));
      }
    };

    peerManager.onPeerStatusChange = (peerId: string, peerStatus: 'CONNECTED' | 'DISCONNECTED') => {
      if (peerStatus === 'DISCONNECTED') {
        engine.removePlayer(peerId);
        peerManager.broadcastState(engine.state);
        peerManager.onStateReceived?.(JSON.parse(JSON.stringify(engine.state)));
      }
    };

    return () => {
      peerManager.hostActionHandler = null;
      peerManager.onPeerStatusChange = null;
    };
  }, [isHost, myPeerId, peerManager, playSfx]);

  // Client actions
  const hostRoom = useCallback(async (name: string, avatar: string) => {
    setLocalPlayerName(name);
    setLocalPlayerAvatar(avatar);
    const roomId = await hostGame();
    const engine = new GameEngine();
    gameEngineRef.current = engine;
    engine.addPlayer(roomId, name, avatar, true);
    peerManager.broadcastState(engine.state);
    peerManager.onStateReceived?.(JSON.parse(JSON.stringify(engine.state)));
  }, [hostGame, peerManager]);

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

  return {
    isHost,
    myPeerId,
    hostPeerId: p2p.hostPeerId,
    connectedPeers: p2p.connectedPeers,
    chatMessages,
    gameState,
    status,
    error,
    hostRoom,
    joinRoom,
    toggleReady,
    startGame,
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
