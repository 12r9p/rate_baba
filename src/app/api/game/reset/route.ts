import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/serverStore';

export async function POST(request: Request) {
  const { hardReset } = await request.json();
  gameStore.resetGame(hardReset);
  return NextResponse.json(gameStore.getState());
}
