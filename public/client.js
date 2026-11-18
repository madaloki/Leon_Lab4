// Michael Leon
// Introduction to Web Development - Lab 4
// Two Player Tic-Tac-Toe (CLIENT)
// The server keeps the real game. This file sends clicks to the server
// and redraws the board whenever the server sends a new "state".

// LAB 4 CHANGE 2:
// If the page was opened with https:// (like on Render) use secure wss://,
// otherwise (http://localhost) use plain ws://.
// window.location.host is whatever server sent us this page, so nothing is hardcoded.
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${protocol}//${window.location.host}`); // WEBSOCKET CONNECTION

// Get HTML elements from the DOM
const canvas = document.getElementById("gameCanvas");    // canvas
const ctx = canvas.getContext("2d");                     // 2D drawing context
const roleText = document.getElementById("role");        // X, O or spectator
const statusText = document.getElementById("status");    // turn / winner text
const resetBtn = document.getElementById("resetBtn");    // reset button

const CELL_SIZE = 200;      // each square is 200 x 200 pixels
let myRole = "Spectator";   // set by the server
let board = ["", "", "", "", "", "", "", "", ""];   // local copy of the board

// Draw the empty board right away
drawBoard();

// ---------- Messages from the server ----------

ws.onmessage = event => {
    const data = JSON.parse(event.data);

    // The server told us our role
    if (data.type === "role") {
        myRole = data.role;
        if (myRole === "Spectator") {
            roleText.textContent = "You are a Spectator (game is full)";
            resetBtn.disabled = true;
        } else {
            roleText.textContent = "You are Player " + myRole;
        }
    }

    // The server sent the newest game state
    if (data.type === "state") {
        const state = data.gameState;
        board = state.board;

        // Show the turn or the winner
        if (state.winner === "tie") {
            statusText.textContent = "It's a Tie!";
        } else if (state.winner) {
            statusText.textContent = "Winner: " + state.winner;
        } else if (!data.xConnected || !data.oConnected) {
            statusText.textContent = "Waiting for another player...";
        } else if (state.currentPlayer === myRole) {
            statusText.textContent = "Your turn (" + myRole + ")";
        } else {
            statusText.textContent = "Player " + state.currentPlayer + "'s turn";
        }

        drawBoard();
    }
}; // end of ws.onmessage

ws.onclose = () => {
    statusText.textContent = "Disconnected from server";
};

// ---------- Things the user does ----------

// Click on the board: tell the server which square was clicked
canvas.addEventListener("click", event => {
    const rect = canvas.getBoundingClientRect();

    // The canvas may be shrunk on a phone, so convert the click
    // back to the 600 x 600 drawing size
    const scale = canvas.width / rect.width;
    const mouseX = (event.clientX - rect.left) * scale;
    const mouseY = (event.clientY - rect.top) * scale;

    // Turn the position into a row and column (0, 1, or 2)
    const col = Math.min(Math.floor(mouseX / CELL_SIZE), 2);
    const row = Math.min(Math.floor(mouseY / CELL_SIZE), 2);
    const index = row * 3 + col;   // position in the board array (0 - 8)

    // The server checks if the move is allowed
    ws.send(JSON.stringify({ type: "move", index: index }));
});

// Reset button: ask the server to start over
resetBtn.addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "reset" }));
});

// ---------- Drawing ----------

// Clear the canvas, then draw the grid and the pieces
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPieces();
}

// Draw the 4 lines that make the grid
function drawGrid() {
    ctx.strokeStyle = "#1f3a57";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(200, 0);   ctx.lineTo(200, 600);   // vertical line 1
    ctx.moveTo(400, 0);   ctx.lineTo(400, 600);   // vertical line 2
    ctx.moveTo(0, 200);   ctx.lineTo(600, 200);   // horizontal line 1
    ctx.moveTo(0, 400);   ctx.lineTo(600, 400);   // horizontal line 2
    ctx.stroke();
}

// Look at each square and draw an X or O if one is there
function drawPieces() {
    for (let i = 0; i < board.length; i++) {
        const x = (i % 3) * CELL_SIZE;              // left edge of the square
        const y = Math.floor(i / 3) * CELL_SIZE;    // top edge of the square
        if (board[i] === "X") drawX(x, y);
        if (board[i] === "O") drawO(x, y);
    }
}

// Draw an X inside the square that starts at (x, y)
function drawX(x, y) {
    ctx.strokeStyle = "#c0392b";    // red X
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x + 40, y + 40);   ctx.lineTo(x + 160, y + 160);
    ctx.moveTo(x + 160, y + 40);  ctx.lineTo(x + 40, y + 160);
    ctx.stroke();
}

// Draw an O inside the square that starts at (x, y)
function drawO(x, y) {
    ctx.strokeStyle = "#2f5f8f";    // blue O
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(x + 100, y + 100, 60, 0, Math.PI * 2);
    ctx.stroke();
}
