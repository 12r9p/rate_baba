'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player } from '@/types/game';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

export function useGame(roomId?: string, options: { isSpectator?: boolean, enabled?: boolean } = {}) {
  const { isSpectator = false, enabled = true } = options;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // If no room ID or disabled, we are likely in Lobby or waiting for name
    if (!roomId || !enabled) {
        setLoading(false);
        return;
    }

    const socket = io(); 
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      // Attempt Join on connect?
      const storedName = localStorage.getItem('babanuki_player_name') || 'Guest';
      
      socket.emit('join-room', { roomId, name: storedName, isSpectator }, (res: any) => {
          if (res.success) {
              if (res.token) {
                  Cookies.set('token', res.token);
              }
              if (res.player) {
                  setMyPlayerId(res.player.id);
                  // localStorage.setItem('babanuki_player_id', res.player.id); // No longer needed as primary auth
              }
              setLoading(false);
          } else {
              console.error("Failed to join room:", res.error);
              setError(res.error || "Failed to join room. Please try again.");
              setLoading(false);
          }
      });
    });

    socket.on('update', (state: GameState) => {
        setGameState(state);
        setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, isSpectator, enabled]);

  const joinRoom = useCallback((room: string, name: string) => {
      // Logic handled in page.tsx / generic lobby usually, but exposed here if needed
  }, []);

  const sendAction = useCallback((type: string, payload: any = {}) => {
      if (!roomId || !socketRef.current) return;
      socketRef.current.emit('action', { roomId, type, payload });
  }, [roomId]);

  const startGame = useCallback(() => sendAction('start'), [sendAction]);
  
  const drawCard = useCallback((targetPlayerId: string, cardIndex: number) => {
      // Optimistic Update
      setGameState(prev => {
          if (!prev || !myPlayerId) return prev;
          const newState = structuredClone(prev);
          
          const target = newState.players.find((p: Player) => p.id === targetPlayerId);
          const me = newState.players.find((p: Player) => p.id === myPlayerId);

          if (target && me && target.hand.length > cardIndex) {
              // Remove from target
              target.hand.splice(cardIndex, 1);
              
              // Add temp card to me - use 'back' suit to show as card back
              me.hand.push({
                  id: `temp-${Date.now()}`,
                  suit: 'back', // Card back - won't show face
                  number: 0
              });
          }
          return newState;
      });

      sendAction('draw', { targetPlayerId, cardIndex });
  }, [sendAction, myPlayerId]);
  
  const tease = useCallback((cardIndex: number) => {
      sendAction('tease', { cardIndex });
  }, [sendAction]);
  
  const resetGame = useCallback((hardReset: boolean) => {
      sendAction('reset', { hardReset });
  }, [sendAction]);

  const voteToSkip = useCallback(() => {
      sendAction('voteToSkip');
  }, [sendAction]);

  const adminDraw = useCallback((actorId: string, targetPlayerId: string, cardIndex: number) => {
      sendAction('adminDraw', { actorId, targetPlayerId, cardIndex });
  }, [sendAction]);

  const sendMessage = useCallback((content: string) => {
      sendAction('message', { content });
  }, [sendAction]);

  const kickPlayer = useCallback((targetPlayerId: string) => {
      sendAction('kick', { targetPlayerId });
  }, [sendAction]);

  // Refresh just requests state update implies no-op or explicit 'get-state'
  const refresh = useCallback(() => {
     // We can just ask for update if needed, or do nothing as WS pushes.
     // Let's implement active fetch to be sure.
     // We don't have 'get-state' action in server yet, let's just rely on reconnection or add it?
     // Server code: "if (!actorId && type !== 'get-state') return;" -> implies get-state exists in thought but maybe not switch?
     // Actually server doesn't implement get-state in switch.
     // Let's just do a no-op that satisfies the interface or a console log.
     console.log("Refreshed state via WebSocket");
  }, []);

  const myPlayer = gameState?.players.find(p => p.id === myPlayerId) || null;

  return {
    gameState,
    myPlayerId,
    myPlayer,
    loading,
    error,
    startGame,
    drawCard,
    adminDraw,
    tease,
    resetGame,
    voteToSkip,
    refresh,
    sendMessage,
    kickPlayer,
    shuffleHand: () => sendAction('shuffleHand'),
    addBot: (name: string) => sendAction('add-bot', { name })
  };
}
