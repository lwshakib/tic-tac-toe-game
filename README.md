# Tic-Tac-Toe Multiplayer

A premium, real-time multiplayer Tic-Tac-Toe game built with a modern tech stack. Features include persistent user accounts, private rooms with passwords, and a responsive, minimalist design.

<p align="center">
  <img src="./apps/web/public/lobby-demo.png" alt="Lobby View" width="48%">
  <img src="./apps/web/public/game-demo.png" alt="Game View" width="48%">
</p>

## Architecture

```mermaid
graph TD
    Client["Next.js Web App"]
    Server["Express & Socket.io Server"]
    DB[("PostgreSQL Database")]

    Client -- "REST API (Auth, Room List)" --> Server
    Client -- "WebSockets (Game Moves, Chat)" --> Server
    Server -- "Persistence" --> DB

    subgraph "Server Internals"
        Server -- "State Management" --> GameLogic["TicTacToeGame Class"]
        GameLogic -- "Auto-Save" --> DB
    end
```

## Features

- **Real-time Gameplay**: Low-latency moves using Socket.io.
- **Play with Computer**: Challenge an intelligent AI using the Minimax algorithm.
- **Persistent Accounts**: Register and login to track your identity across sessions.
- **Room Management**: Create public or private (password-protected) rooms.
- **Auto-Reconnect**: Automatically returns you to your active game if you refresh or navigate away.
- **Minimalist Design**: A clean, premium aesthetic built with Vanilla CSS.

## Tech Stack

- **Frontend**: Next.js, React, Lucide Icons.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: PostgreSQL.
- **Monorepo Management**: Turborepo, pnpm.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/lwshakib/tic-tac-toe-game.git
   cd tic-tac-toe-game
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Environment Setup**:
   Create a `.env` file in `apps/server`:

   ```env
   PORT=4000
   DATABASE_URL=postgres://user:password@localhost:5432/tictactoe
   NODE_ENV=development
   ```

   Create a `.env.local` file in `apps/web`:

   ```env
   NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
   ```

4. **Database Initialization**:
   Ensure your PostgreSQL server is running and create the database specified in your `DATABASE_URL`. The server will automatically attempt to handle table initialization if configured, or you can run provided migration scripts.

### Running the Project

Run both the frontend and backend simultaneously using Turbo:

```bash
pnpm dev
```

The web app will be available at [http://localhost:3000](http://localhost:3000) and the server at [http://localhost:4000](http://localhost:4000).

## Project Structure

- `apps/web`: Next.js frontend application.
- `apps/server`: Express and Socket.io backend application.
- `packages/`: Shared configurations and UI components (if applicable).

## License

MIT
