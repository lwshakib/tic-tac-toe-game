# Grid Protocol Server

The backend service for the Tic-Tac-Toe Multiplayer Grid Protocol. Built with **Bun** and **Socket.IO**, it creates a low-latency communication layer for game state synchronization.

## ⚡ Features

-   **Memory-First Storage**: Fast, in-memory room and player state management using JavaScript Maps.
-   **Event-Driven Architecture**: Uses Socket.IO events for all game actions (`make-move`, `join-room`, `reset-game`).
-   **Security**: Minimalist password validation for private ("locked") rooms.
-   **Broadcasts**: Real-time room list updates to all connected clients.

## 🛠 Tech Stack

-   **Runtime**: Bun
-   **Communication**: Socket.IO
-   **Language**: TypeScript

## 📡 API / Events

### Client -> Server

-   `create-room`: Initialize a new game room.
    -   Payload: `{ roomName, playerName, isPrivate, password }`
-   `join-room`: connect to an existing room.
    -   Payload: `{ roomId, playerName, password, isLinkJoin }`
-   `make-move`: Submit a move to the grid.
    -   Payload: `{ roomId, index }`
-   `reset-game`: Vote to reset the current match.
    -   Payload: `roomId`

### Server -> Client

-   `room-created`: Sent to the creator when a room is ready.
-   `room-updated`: Sent to room participants when state changes (move made, player joined, etc.).
-   `room-list`: Broadcast to all clients when the list of active rooms changes.
-   `error`: Sent to specific sockets when an action fails (e.g., wrong password, room full).

## ⚙️ Environment Configuration

The server uses the following environment variables:
- `PORT`: The port the server will listen on (default: `3001`).

To configure, copy `.env.example` to `.env` and adjust the values as needed.

## 🏃‍♂️ Development

```bash
# Install dependencies
bun install

# Start development server (watch mode)
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```
