# Grid Protocol Interface (Web)

The frontend client for the Tic-Tac-Toe Multiplayer Grid Protocol. Built with **Next.js 14**, **Tailwind CSS**, and **Socket.IO Client**.

## 🎨 Design Philosophy

This interface mimics a "Node Connection" utility rather than a traditional game. usage of:
-   **Monochromatic Palette**: Black, white, and shades of gray.
-   **Data-Centric Layout**: Active node lists, connection statuses, and raw score metrics.
-   **Interactive Feedback**: Micro-animations for connection states and moves.
-   **Grid Aesthetics**: Sharp borders, uppercase typography (Monospace & Sans), and high contrast.

## 📦 Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Styling**: Tailwind CSS
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

## 🛠 Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
