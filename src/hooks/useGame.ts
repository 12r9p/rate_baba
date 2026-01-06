'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameState, Player } from '@/types/game';

export function useGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  useEffect(() => {
    // Load ID from local storage
    const storedId = localStorage.getItem('babanuki_player_id');
    if (storedId) setMyPlayerId(storedId);
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/game');
      if (!res.ok) throw new Error('Failed to fetch state');
      const data = await res.json();
      setGameState(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1000); // Poll every 1s
    return () => clearInterval(interval);
  }, [fetchState]);

  const joinGame = async (name: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyPlayerId(data.id);
        localStorage.setItem('babanuki_player_id', data.id);
        fetchState();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to join');
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    await fetch('/api/game/start', { method: 'POST' });
    fetchState();
  };

  const drawCard = async (targetPlayerId: string, cardIndex?: number) => {
    if (!myPlayerId) return;
    await fetch('/api/game/draw', {
      method: 'POST',
      body: JSON.stringify({ playerId: myPlayerId, targetPlayerId, cardIndex }),
    });
    fetchState();
  };

  const resetGame = async (hardReset: boolean) => {
    await fetch('/api/game/reset', {
      method: 'POST',
      body: JSON.stringify({ hardReset }),
    });
    fetchState();
  };

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
    resetGame,
    refresh: fetchState
  };
}
