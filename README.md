# Multiplayer Grid Protocol (Tic-Tac-Toe)

A minimalist, real-time multiplayer Tic-Tac-Toe application built with **Next.js**, **Socket.IO**, and **Bun**.

![License](https://img.shields.io/github/license/lwshakib/tic-tac-toe-game?style=flat-square)
![Status](https://img.shields.io/badge/status-active-success?style=flat-square)
![Bun](https://img.shields.io/badge/runtime-Bun-black?style=flat-square&logo=bun)
![Next.js](https://img.shields.io/badge/frontend-Next.js-black?style=flat-square&logo=next.js)
![Socket.io](https://img.shields.io/badge/realtime-Socket.io-black?style=flat-square&logo=socket.io)

## 📸 Demo

<div align="center">
  <img src="./assets/demos/app-demo-1.png" alt="Lobby View" width="48%">
  <img src="./assets/demos/app-demo-2.png" alt="Game View" width="48%">
</div>

## 🌟 Overview

This project reimagines the classic Tic-Tac-Toe game as a **"Multiplayer Grid Protocol"** with a distinct, brutalist/minimalist aesthetic. It features real-time gameplay, room management with privacy controls, and a persistent scoreboard for match sessions.

### Key Features

-   **Real-Time Gameplay**: Seamless moves and updates using Socket.IO.
-   **Room Management**:
    -   Create public or private rooms.
    -   Secure private rooms with access passwords.
    -   "Live Nodes" dashboard to see active rooms.
-   **Minimalist UI**: A monochrome, data-centric design language inspired by brutalist architecture.
-   **Session Tracking**: Persistent win counting and mutual re-link (rematch) functionality.
-   **Smart Join**: Direct specific room connection via ID or browsing the active node list.

## 🛠 Tech Stack

-   **Runtime**: [Bun](https://bun.sh/)
-   **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/)
-   **Backend**: [Socket.IO](https://socket.io/), [Node.js](https://nodejs.org/) (running on Bun)
-   **State Management**: React Hooks & Socket.IO events

## 🏗 Project Structure

```text
.
├── assets/             # Project assets and demos
├── server/             # Socket.IO backend service
│   ├── src/            # Server source code (fully documented)
│   ├── Dockerfile      # Container configuration for backend
│   └── package.json    # Backend dependencies
└── web/                # Next.js frontend application
    ├── app/            # Next.js App Router (fully documented)
    ├── Dockerfile      # Container configuration for frontend
    └── package.json    # Frontend dependencies
```

## 🚀 Getting Started

### Prerequisites

-   [Bun](https://bun.sh/) (v1.1.0 or later)
-   [Docker](https://www.docker.com/) (Optional, for containerized deployment)

### Local Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/lwshakib/tic-tac-toe-game.git
    cd tic-tac-toe-game
    ```

2.  **Setup Server**
    ```bash
    cd server
    bun install
    ```

3.  **Setup Web Client**
    ```bash
    cd ../web
    bun install
    ```

### Running Locally (Development)

For a smooth development experience, run both services in separate terminals.

**Terminal 1: Backend Server**
```bash
cd server
bun run dev
```
The server will start on `http://localhost:3001`.

**Terminal 2: Frontend Web Client**
```bash
cd web
# Optional: Set the socket URL if different from default
# export NEXT_PUBLIC_SOCKET_URL=http://your-ip:3001 
bun run dev
```
The client will start on `http://localhost:3000`.

---

## 🐳 Running with Docker

You can run both the server and the web application using the provided Dockerfiles.

### 1. Build and Run Server
```bash
cd server
docker build -t ttt-server .
docker run -p 3001:3001 ttt-server
```

### 2. Build and Run Web Client
Note: Ensure the `NEXT_PUBLIC_SOCKET_URL` points to your running server.
```bash
cd web
docker build -t ttt-web .
docker run -p 3000:3000 ttt-web
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's adding features, fixing bugs, or improving documentation, please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👤 Author

**lwshakib**

-   GitHub: [@lwshakib](https://github.com/lwshakib)
-   Website: [shakib.dev](https://shakib.dev)
