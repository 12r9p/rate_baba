import { NextResponse } from 'next/server';
import db from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get top 20 players sorted by rate (descending)
        const rankings = db.prepare(`
            SELECT 
                id,
                name,
                rate,
                matches,
                wins
            FROM players
            WHERE matches > 0
            ORDER BY rate DESC, wins DESC
            LIMIT 20
        `).all();

        return NextResponse.json(rankings);
    } catch (error) {
        console.error('Error fetching rankings:', error);
        return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
    }
}
