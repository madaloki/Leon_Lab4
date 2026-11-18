Intro to Web Development - Lab 4
Michael Leon
Two Player Tic-Tac-Toe (Node.js + Express + WebSockets)
===========================================================

LINK TO PLAY
  On this computer:      http://localhost:3000
  Phone / other computer on the same Wi-Fi:
                         http://<my-IPv4-address>:3000
                         (find it with "ipconfig" -> IPv4 Address, e.g. http://192.168.1.25:3000)

HOW TO RUN
  1. Open PowerShell in this folder
  2. npm.cmd install        (first time only - downloads express and ws)
  3. node server.js         (shows "Server running on port 3000")
  4. Open http://localhost:3000 in two browser windows (or a computer and a phone)
       1st window = Player X, 2nd = Player O, anyone after = Spectator
  5. Ctrl + C stops the server
  If a phone can't connect: click "Allow" when Windows Firewall asks about Node.js.

FILES
  server.js           Node server: Express serves the page, WebSockets keep players in sync,
                      server holds the board and checks every move
  package.json        Project info and libraries (express, ws)
  package-lock.json   Exact library versions
  public/index.html   Page layout
  public/style.css    Blue theme (same as Projects 4 and 5), board shrinks to fit phones
  public/client.js    Connects to the server, draws the board, sends clicks

