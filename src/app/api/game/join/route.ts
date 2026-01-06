import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/serverStore';

export async function POST(request: Request) {
  const { name } = await request.json();
  
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const existing = gameStore.getState().players.find(p => p.name === name);
  if (existing) {
    // If name exists, return that player (re-join)
    return NextResponse.json(existing);
  }

  const newPlayer = gameStore.addPlayer(name);
  return NextResponse.json(newPlayer);
}
