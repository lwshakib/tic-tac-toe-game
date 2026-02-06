# Grid Protocol Interface (Web)

The frontend client for the Tic-Tac-Toe Multiplayer Grid Protocol. Built with **Next.js 16**, **Tailwind CSS 4**, and **Socket.IO Client**.

## 🎨 Design Philosophy

This interface follows a **Neo-Brutalist** aesthetic, mimicking a "Node Connection" utility rather than a traditional game. usage of:
-   **High-Contrast Monochrome**: Deep blacks and crisp whites with bold shadows.
-   **Neo-Brutalist Grids**: Heavy borders, non-standard layouts, and sharp corners.
-   **Data-Centric Layout**: Active node lists, connection statuses, and raw score metrics.
-   **High-End Micro-Animations**: Smooth transitions using Framer Motion (or CSS animations) for connection states and moves.
-   **Typography**: Bold, uppercase sans-serif and monospace fonts for a technical feel.

## 📦 Tech Stack

-   **Framework**: Next.js 16 (App Router)
-   **Styling**: Tailwind CSS 4
-   **State**: React Hooks + Socket.IO
-   **Icons**: Lucide React

## 🧩 Key Components

-   **Lobby**: The main dashboard.
    -   *Persona*: Set your specific user handle.
    -   *Connection*: Manual entry for specific Room IDs.
    -   *Initialization*: Room creation w/ privacy toggles.
    -   *Live Nodes*: Real-time list of available matches.
-   **Game Board**: The active grid protocol.
    -   *Scoreboard*: Persistent win tracking per session.
    -   *Grid*: Interactive 3x3 play area.
    -   *Re-Link*: Mutual consent system for restarting matches.

## ⚙️ Configuration

The web client uses the following environment variables:
- `NEXT_PUBLIC_SOCKET_URL`: The URL of the backend Socket.IO server.

Copy `.env.example` to `.env` to set up your local development environment.

## 🛠 Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
