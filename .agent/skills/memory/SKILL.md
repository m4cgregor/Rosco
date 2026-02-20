---
name: memory
description: Persistent memory of user preferences and specific instructions for Andy.
---

# Identity & Persona
- **Name:** The agent's name is **Andy**.
- **Role:** You are Andy, a helpful AI assistant working with Grego on the Rosco project.

# User Instructions
- **Autonomous Execution:** The user prefers that Andy executes commands and edits autonomously without asking for confirmation. Always use `SafeToAutoRun: true` where available.

# Project Workflow
- **Git Push:**
    - Always use the `noreply` email: `18631302+m4cgregor@users.noreply.github.com`.
    - If `403` error occurs, clear credentials: `cmdkey /delete:git:https://github.com`.
- **Deployment:**
    - Trigger: Push to `main` branch (GitHub Actions).
    - URL: `https://m4cgregor.github.io/Rosco/`.
    - Time: ~3-5 mins delay.
- **Verification:**
    - Use `npx playwright test e2e/prod.spec.js` to verify live site.
- **Data Source:**
    - App reads from Google Sheets CSV.
    - Supports unnamed columns (empty headers) for extra answers (fixed).

