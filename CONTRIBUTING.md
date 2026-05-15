# Contributing to Tic-Tac-Toe Multiplayer

Thank you for your interest in contributing! This project follows a standard open-source workflow.

## Development Workflow

### 1. Fork the Project
Click the "Fork" button at the top of the repository to create a copy in your own account.

### 2. Clone your Fork
```bash
git clone https://github.com/lwshakib/tic-tac-toe-game.git
cd tic-tac-toe-game
```

### 3. Set up Upstream Remote
Keep your fork in sync with the main repository:
```bash
git remote add upstream https://github.com/lwshakib/tic-tac-toe-game.git
```

### 4. Create a Feature Branch
Always create a branch for your changes:
```bash
git checkout -b feature/your-feature-name
```

### 5. Install and Build
Ensure you have `pnpm` installed:
```bash
pnpm install
pnpm build
```

### 6. Make Changes and Test
Run the development server to verify your changes:
```bash
pnpm dev
```

### 7. Commit and Push
Follow [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages:
```bash
git add .
git commit -m "feat: add amazing new feature"
git push origin feature/your-feature-name
```

### 8. Pull Request
Go to the original repository on GitHub and click "Compare & pull request". Provide a clear description of your changes.

## Syncing with Upstream
To update your local `main` branch with the latest changes from the original repository:
```bash
git checkout main
git pull upstream main
git push origin main
```

## Branching Strategy
- `main`: Production-ready code.
- `develop`: Integration branch for features.
- `feature/*`: New features.
- `fix/*`: Bug fixes.

## Code Standards
- Use TypeScript for all new code.
- Follow the existing project structure.
- Ensure all types are properly defined (no `any` where possible).
