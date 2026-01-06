'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player } from '@/types/game';
import { io, Socket } from 'socket.io-client';

export function useGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket
    // Fetch logic removed, replaced by WebSocket
    const socket = io(); // Auto-connects to same origin
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('update', (state: GameState) => {
        console.log('[WS] State Update:', state.phase, state.currentTurnPlayerId);
        setGameState(prev => {
            if (JSON.stringify(prev) === JSON.stringify(state)) return prev;
            return state;
        });
        setLoading(false);
    });

    // Load ID from local storage
    const storedId = localStorage.getItem('babanuki_player_id');
    if (storedId) setMyPlayerId(storedId);

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinGame = useCallback((name: string) => {
    if (!socketRef.current) return;
    setLoading(true);
    socketRef.current.emit('join', { name }, (player: Player) => {
        setMyPlayerId(player.id);
        localStorage.setItem('babanuki_player_id', player.id);
        setLoading(false);
    });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start');
  }, []);

  const drawCard = useCallback((targetPlayerId: string, cardIndex?: number) => {
    if (!myPlayerId) return;
    socketRef.current?.emit('draw', { playerId: myPlayerId, targetPlayerId, cardIndex });
  }, [myPlayerId]);

  const adminDraw = useCallback((actorId: string, targetPlayerId: string, cardIndex?: number) => {
    socketRef.current?.emit('draw', { playerId: actorId, targetPlayerId, cardIndex });
  }, []);

  const tease = useCallback((cardIndex: number) => {
    if (!myPlayerId) return;
    socketRef.current?.emit('tease', { playerId: myPlayerId, cardIndex });
  }, [myPlayerId]);

  const resetGame = useCallback((hardReset: boolean) => {
    socketRef.current?.emit('reset', { hardReset });
  }, []);

  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);

  return {
    gameState,
    myPlayerId,
    myPlayer,
    loading,
    error,
    joinGame,
    startGame,
    drawCard,
    adminDraw,
    tease,
    resetGame,
    refresh: () => {} // No-op for now as socket pushes updates
  };
}
