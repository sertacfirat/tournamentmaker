# Development Documentation & AI Instruction Set

This document serves as the primary technical reference for developers and AI agents (e.g., Antigravity, Cursor, Copilot) working on the **ABİS Tournament Tracker**. It outlines the architecture, data models, and critical business logic.

---

## 🛠 Tech Stack

*   **Framework:** React 19 (Functional Components, Hooks)
*   **Language:** TypeScript (Strict Mode)
*   **Styling:** Tailwind CSS (via CDN or PostCSS)
*   **Icons:** Lucide React
*   **State Management:** React Local State + LocalStorage Persistence
*   **Build Tool:** Vite (Recommended for local dev)

---

## 🧠 Core Architecture & Logic

### 1. Data Models (`types.ts`)
The application relies on a strictly typed system.
*   **`Tournament`**: The root object containing `settings`, `players`, and `matches`.
*   **`Match`**: Represents a single fixture.
    *   Contains `home` and `away` objects of type `MatchTeam`.
*   **`MatchTeam`**:
    *   `playerIds`: Array of strings (1 ID for 1v1, 2 IDs for 2v2).
    *   `footballTeam`: The real-life team (e.g., "Real Madrid").
    *   `isGhost`: **CRITICAL**. Boolean flag. If `true`, this team is a "filler" to help the opponent reach their match count quota. Stats are **NOT** recorded for ghost teams.

### 2. Service Layer (`services/tournamentService.ts`)

This is the brain of the application.

#### A. Fixture Generation (`generateFixtures`)
*   **1v1 Logic:** Uses standard Round Robin (Berger Table) algorithm. Handles odd number of players by adding a dummy "Bye".
*   **2v2 Logic (Complex):**
    1.  Generates all possible unique pairs of players.
    2.  Shuffles pairs to ensure randomness.
    3.  Selects matchups where no player appears on both sides.
    4.  **Greedy Selection:** Ensures pairs don't play too many matches consecutively or repeatedly against the same logic.

#### B. The "Ghost Match" Algorithm (Balancing)
In 2v2 tournaments with specific player counts (e.g., 6 players), mathematically, not everyone can play an equal number of games in a standard loop.
1.  **Detection:** The system calculates `gamesPlayed` for every player after generating standard fixtures.
2.  **Identification:** Identifies players who are `underplayed` (have fewer matches than the max).
3.  **Pairing:** Groups underplayed players together into a team.
4.  **Opponent Selection:** Selects a random pair from the rest of the pool to play against them.
5.  **Ghost Flagging:** The opponent team is marked as `isGhost: true`.
    *   **Result:** The underplayed team gets stats (Win/Loss/Points). The Ghost team plays for fun; their stats are ignored to prevent inflating their points unfairly.

#### C. Statistics (`calculateStandings`)
*   Iterates through all `completed` matches.
*   **Rule:** If a side has `isGhost: true`, skip processing stats for that side.
*   **Sorting:** Points > Goal Difference > Goals For.

### 3. Component Hierarchy
*   **`App.tsx`**: Main Controller. Handles routing (`Dashboard` vs `Details`), global state, theme, and language.
*   **`Fixtures.tsx`**: Displays match list.
    *   *Note:* `TeamInput` component is extracted outside to prevent focus loss during re-renders.
    *   Displays 👻 icon for Ghost teams.
*   **`Standings.tsx`**: Render-only component for the league table.
*   **`Stats.tsx`**: Visualizes data (e.g., "Most Winning Teams").

---

## 🤖 AI Agent Instructions (Prompt Context)

When asking an AI agent to modify this codebase, prefix your request with the following context:

> "You are working on the ABİS Tournament Tracker. The project uses React 19, TypeScript, and Tailwind.
>
> **Critical Rules:**
> 1. **Ghost Matches:** When modifying fixture logic or UI, always respect the `isGhost` flag in `MatchTeam`. Ghost teams must never receive points or stats updates.
> 2. **Immutability:** State updates in `App.tsx` must be immutable. Use `prev.map(...)` patterns.
> 3. **Persistence:** Data is saved to `localStorage` key `abis_tournaments`.
> 4. **UI/UX:** Maintain the 'Modern/Clean' aesthetic. Use Lucide icons for visual cues.
> 5. **Translations:** All text must be added to `constants.ts` under `TRANSLATIONS` for both 'tr' and 'en'."

---

## 💻 Local Development Setup (Vite)

To run this project locally with full feature support:

1.  **Initialize Project:**
    ```bash
    npm create vite@latest abis-tracker -- --template react-ts
    cd abis-tracker
    npm install
    npm install lucide-react
    ```

2.  **Migrate Files:**
    *   Copy `App.tsx`, `types.ts`, `constants.ts` to `src/`.
    *   Copy `components/` and `services/` folders to `src/`.
    *   Update `src/main.tsx` (or `index.tsx`) to mount `App`.

3.  **Tailwind Setup:**
    ```bash
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```
    *   Update `tailwind.config.js`:
        ```js
        export default {
          content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
          darkMode: 'class',
          theme: {
            extend: {
              colors: {
                brand: { 50: '#f0f9ff', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 900: '#0c4a6e' }
              }
            },
          },
          plugins: [],
        }
        ```
    *   Add `@tailwind base; @tailwind components; @tailwind utilities;` to `src/index.css`.

4.  **Run:**
    ```bash
    npm run dev
    ```
