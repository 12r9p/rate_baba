import { Server } from 'socket.io';
import { GameManager } from '@/lib/GameManager';

export async function broadcastGameState(io: Server, roomId: string, gameManager: GameManager) {
    try {
        const sockets = await io.in(roomId).fetchSockets();
        sockets.forEach(s => {
            const viewerId = (s as any).playerId || '';
            s.emit('update', gameManager.getPersonalizedState(viewerId));
        });
    } catch (e) {
        console.error(`Failed to broadcast state for room ${roomId}`, e);
    }
}
