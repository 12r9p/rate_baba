
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";
import { GameManager } from "./src/lib/GameManager";
import jwt from "jsonwebtoken";
import { parse as parseCookie } from "cookie";
import { v4 as uuidv4 } from "uuid";
import { broadcastGameState } from "./src/lib/socketUtils";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-prod";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Room Management
const rooms = new Map<string, GameManager>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    // console.log("New connection:", socket.id);

    // Parse Cookies for Auth
    const cookies = parseCookie(socket.handshake.headers.cookie || "");
    let token = cookies.token;
    
    // Auth Data
    let playerId: string | null = null;
    let playerName: string | null = null;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            playerId = decoded.id;
            playerName = decoded.name;
        } catch (e) {
            // Invalid token
        }
    }

    // --- EVENTS ---

    // 1. Join Room
    socket.on("join-room", ({ roomId, name, isSpectator }: { roomId: string, name: string, isSpectator?: boolean }, callback) => {
        if (!roomId || !name) {
            if (callback) callback({ success: false, error: "Invalid data" });
            return;
        }

        // If no ID, generate one (for session)
        if (!playerId) {
            playerId = uuidv4();
        }
        
        const finalName = name || playerName || "Guest";
        
        // Issue Token
        const newToken = jwt.sign({ id: playerId, name: finalName }, JWT_SECRET, { expiresIn: '7d' });
        
        let gm = rooms.get(roomId);
        if (!gm) {
            console.log(`Creating new room: ${roomId}`);
            gm = new GameManager(roomId, io);
            rooms.set(roomId, gm);
        }

        socket.join(roomId);
        
        // Save Context
        (socket as any).currentRoomId = roomId;
        (socket as any).playerId = playerId;

        if (gm) {
             // If spectator, just join socket room and send state, DO NOT add to game logical state
             if (isSpectator) {
                 socket.join(roomId);
                 (socket as any).currentRoomId = roomId;
                 
                 // Return success (no player object)
                 if (callback) callback({ success: true, token: newToken }); // Token still useful for ident? matches logic
                 
                 // Send current state to THIS spectator only
                 socket.emit('update', gm.getState());
                 return;
             }

             const p = gm.join(finalName, playerId);
             
             // System Message
             gm.postMessage('system', 'System', `${p.name} joined the room.`, true);
             
             // Return success with player data
             if (callback) callback({ success: true, player: p, token: newToken });
             
             if (callback) callback({ success: true, player: p, token: newToken });
             
             // Broadcast Personalized Updates
             broadcastGameState(io, roomId, gm);
        }
    });

    // 2. Get Rooms (Lobby)
    socket.on('get-rooms', (cb) => {
        const roomList = Array.from(rooms.values()).map(r => r.getSummary());
        if (cb) cb(roomList);
    });

    // 3. Game Actions
    socket.on("action", ({ roomId, type, payload }: { roomId: string, type: string, payload: any }) => {
        const gm = rooms.get(roomId);
        if (!gm) return;

        const actorId = playerId; // From closure
        if (!actorId && type !== 'get-state') return; // Must be logged in

        switch (type) {
            case 'message':
                gm.postMessage(actorId!, playerName || 'Unknown', payload.content);
                break;
            case 'start':
                gm.start();
                break;
            case 'draw':
                gm.draw(actorId!, payload.targetPlayerId, payload.cardIndex);
                break;
            case 'voteToSkip':
                gm.voteToSkip(actorId!);
                break;
            case 'tease':
                gm.tease(actorId!, payload.cardIndex);
                break;
            case 'reset':
                gm.reset(payload.hardReset);
                break;
            case 'adminDraw':
                gm.draw(payload.actorId, payload.targetPlayerId, payload.cardIndex);
                break;
            case 'kick':
                gm.kick(actorId!, payload.targetPlayerId);
                break;
            case 'shuffleHand':
                gm.shuffleHand(actorId!);
                break;
            case 'add-bot':
                gm.addBot(payload.name);
                break;
        }

        // Broadcast Personalized Updates
        broadcastGameState(io, roomId, gm);
    });

    socket.on("disconnect", () => {
         // Handle disconnect
         const rid = (socket as any).currentRoomId;
         if (rid && playerId) {
             const gm = rooms.get(rid);
             if (gm) {
                 gm.leave(playerId);
                 
                 // If room is empty, delete it
                 if (gm.getState().players.length === 0) {
                     rooms.delete(rid);
                     console.log(`Room ${rid} deleted (empty)`);
                 } else {
                     // Broadcast Personalized Updates
                     broadcastGameState(io, rid, gm);
                 }
             }
         }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
