
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";
import { GameManager } from "./src/lib/GameManager";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer);
  const gameManager = new GameManager();

  io.on("connection", (socket: any) => {
    console.log("Client connected:", socket.id);
    
    // Send initial state
    socket.emit('update', gameManager.getState());

    socket.on("join", ({ name }: { name: string }, callback: any) => {
        console.log("Join requested:", name);
        const player = gameManager.join(name);
        if (callback) callback(player);
        io.emit('update', gameManager.getState());
    });

    socket.on("start", () => {
        gameManager.start();
        io.emit('update', gameManager.getState());
    });

    socket.on("draw", ({ playerId, targetPlayerId, cardIndex }: any) => {
        gameManager.draw(playerId, targetPlayerId, cardIndex);
        io.emit('update', gameManager.getState());
    });

    socket.on("tease", ({ playerId, cardIndex }: any) => {
        gameManager.tease(playerId, cardIndex);
        io.emit('update', gameManager.getState());
    });

    socket.on("reset", ({ hardReset }: any) => {
        gameManager.reset(hardReset);
        io.emit('update', gameManager.getState());
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Ready on http://${hostname}:${port} as ${
        dev ? "development" : "production"
      }`
    );
  });
});
