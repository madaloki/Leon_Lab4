// Michael Leon
// Intro To WebDev - Lab 4
// Two Player Tic-Tac-Toe (SERVER)
// Built from the Project 5 server pattern: Express + HTTP + WebSockets

/*
 * SERVER OVERVIEW
 * ---------------------------------------------------------
 * 1. Express serves everything in the public folder.
 * 2. The first browser to connect is Player X, the second is
 *    Player O, everyone after that is a Spectator.
 * 3. The server keeps the shared game state (board, turn, winner).
 * 4. The server checks every move, then sends the new state
 *    to every browser (broadcastState).
 * ---------------------------------------------------------
 *
 * Run with:  node server.js
 * Then open: http://localhost:3000
 */

// SERVER SETUP
const express = require("express");    // Import the Express framework
const http = require("http");          // Import HTTP module for Express and WebSockets
const WebSocket = require("ws");       // WebSocket library for real-time communication

const app = express();                        // Create Express application
const server = http.createServer(app);        // Create HTTP server
const wss = new WebSocket.Server({ server }); // Create WebSocket server
app.use(express.static("public"));            // Serve everything inside the public folder

// GAME STATE (shared - the server owns the "truth")
let gameState = {
    board: ["", "", "", "", "", "", "", "", ""],
    currentPlayer: "X",
    winner: null          // null, "X", "O" or "tie"
};

let playerX = null;       // WebSocket connection of Player X
let playerO = null;       // WebSocket connection of Player O

// All 8 ways to win
const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],   // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],   // columns
    [0, 4, 8], [2, 4, 6]               // diagonals
];

// SEND GAME STATE TO EVERYONE
function broadcastState() {
    const payload = JSON.stringify({
        type: "state",
        gameState: gameState,
        xConnected: playerX !== null,
        oConnected: playerO !== null
    });

    // Loop through clients call lambda expression with each client
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// CHECK FOR A WINNER OR A TIE
function checkWinner() {
    for (const line of winningLines) {
        const [a, b, c] = line;
        const board = gameState.board;
        if (board[a] !== "" && board[a] === board[b] && board[a] === board[c]) {
            return board[a];     // "X" or "O"
        }
    }
    if (!gameState.board.includes("")) {
        return "tie";            // board is full, nobody won
    }
    return null;
}

// RESET THE GAME
function resetGame() {
    gameState.board = ["", "", "", "", "", "", "", "", ""];
    gameState.currentPlayer = "X";
    gameState.winner = null;
}

// Connection Event Handler, ws is the WebSocket connection for that specific user
wss.on("connection", ws => {

    // ROLE SELECTION: first is X, second is O, everyone else watches
    if (playerX === null) {
        playerX = ws;
        ws.role = "X";
    } else if (playerO === null) {
        playerO = ws;
        ws.role = "O";
    } else {
        ws.role = "Spectator";
    }
    console.log("A user connected as: " + ws.role);

    // Tell this client its role, then send everyone the current game
    ws.send(JSON.stringify({ type: "role", role: ws.role }));
    broadcastState();

    // RECEIVE MESSAGE
    ws.on("message", message => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (error) {
            return; // ignore anything that is not valid JSON
        }

        // A PLAYER MAKES A MOVE
        if (data.type === "move") {
            const index = Number(data.index);

            // Only the player whose turn it is may move
            if (ws.role !== gameState.currentPlayer) return;
            // Need both players before the game starts
            if (playerX === null || playerO === null) return;
            // Game already over
            if (gameState.winner !== null) return;
            // Must be a real, empty square (0 - 8)
            if (!Number.isInteger(index) || index < 0 || index > 8) return;
            if (gameState.board[index] !== "") return;

            gameState.board[index] = ws.role;
            gameState.winner = checkWinner();

            // Switch turns
            if (gameState.currentPlayer === "X") {
                gameState.currentPlayer = "O";
            } else {
                gameState.currentPlayer = "X";
            }

            broadcastState();
        }

        // A PLAYER RESETS THE GAME (spectators can't)
        if (data.type === "reset") {
            if (ws.role === "X" || ws.role === "O") {
                resetGame();
                broadcastState();
            }
        }
    }); // end of ws.on("message", message => {

    // CLIENT DISCONNECTS: free up their spot and start a fresh game
    ws.on("close", () => {
        console.log("A " + ws.role + " disconnected");
        if (ws === playerX) {
            playerX = null;
            resetGame();
        }
        if (ws === playerO) {
            playerO = null;
            resetGame();
        }
        broadcastState();
    });

});
// End of wss.on

// LAB 4 CHANGE 1:
// Render gives us the port in process.env.PORT. On our own PC it falls back to 3000.
// "0.0.0.0" lets the server accept connections from any network interface,
// not just localhost (Render needs this, and it also lets phones on your Wi-Fi connect).
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
