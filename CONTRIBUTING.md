# Contributing to Multiplayer Grid Protocol (Tic-Tac-Toe)

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to this project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Project Structure

This is a monorepo consisting of:
- `server/`: The Socket.IO backend.
- `web/`: The Next.js frontend.
- `assets/`: Project assets including demo images.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

-   **Use a clear and descriptive title** for the issue to identify the problem.
-   **Describe the exact steps which reproduce the problem** in as many details as possible.
-   **Provide specific examples** to demonstrate the steps. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples.
-   **Describe the behavior you observed** after following the steps and point out what exactly is the problem with that behavior.
-   **Explain which behavior you expected to see instead** and why.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

-   **Use a clear and descriptive title** for the issue to identify the suggestion.
-   **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
-   **Provide specific examples** to demonstrate the steps.
-   **Describe the current behavior** and **explain which behavior you expected to see instead** and why.

### Pull Requests

1.  Fork the repo and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  If you've changed APIs, update the documentation.
4.  Ensure the test suite passes.
5.  Make sure your code lints.
6.  Issue that pull request!

## Styleguides

### Git Commit Messages

-   Use the present tense ("Add feature" not "Added feature")
-   Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
-   Limit the first line to 72 characters or less
-   **Be detailed**: Provide context on what was changed and why in the message body.
-   Reference issues and pull requests liberally after the first line.

### Coding Guidelines

**General**
-   We use **TypeScript** for everything. Please ensure all new code is strictly typed.
-   We use **Bun** for package management and running scripts.

**Frontend (Web)**
-   We strictly adhere to a **Minimalist/Brutalist** design aesthetic.
-   **No primary colors**. Use Black, White, and Grays.
-   **Uppercase typography** for headers and labels.
-   **Sharp corners** (no rounded-full buttons unless explicitly requested).
-   **Mobile-first** responsive design.
-   Components should be functional and "Node-like" in naming conventions where possible.

**Backend (Server)**
-   Keep the in-memory store simple.
-   Ensure all events are strictly typed in the interfaces.

## Attribution

This guide is based on the **contributing-gen**. [Make your own](https://github.com/bttger/contributing-gen)!
