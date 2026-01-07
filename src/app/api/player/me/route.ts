import { NextRequest, NextResponse } from 'next/server';
import { PlayerRepository } from '@/repositories/PlayerRepository';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-prod";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, name: string };
        const player = PlayerRepository.getPlayerWithHistory(decoded.id);

        if (!player) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        return NextResponse.json(player);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}
