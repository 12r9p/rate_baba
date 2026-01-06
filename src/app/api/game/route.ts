import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/serverStore';

export async function GET() {
  const state = gameStore.getState();
  // Sanitize state for players? 
  // Ideally, players shouldn't see other players' hands.
  // But for this simple implementation, I will send full state and hide cards on frontend.
  // OR: I can filter hands if I really want to be secure, but "admin" needs to see/debug maybe?
  // Let's stick to full state for now for simplicity, unless I adding a "playerId" param to mask data.
  
  return NextResponse.json(state);
}

// Polling helper or similar might simply hit this.
