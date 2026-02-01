# ABİS Tournament Tracker

ABİS Tournament Tracker is a modern, responsive web application designed to manage football tournaments (FIFA, PES, or real-life). It specializes in fair fixture generation for **1v1** and **2v2** game modes, featuring advanced statistics, automated standings calculation, and a unique balancing algorithm for uneven player counts.

## 🌟 Key Features

*   **Multi-Tournament Management:** Dashboard to view active and archived tournaments.
*   **Flexible Game Modes:** Support for 1v1 and 2v2 tournaments.
*   **Fixture Generation:**
    *   Round-robin logic for 1v1.
    *   **Advanced Pairing Algorithm** for 2v2 (ensures partner variety).
    *   **Ghost Match (Balancing) System:** Automatically creates balancing matches for players with fewer games in 2v2 modes without affecting opponent stats.
*   **Detailed Statistics:**
    *   Live Standings (P, W, D, L, GF, GA, GD, Pts).
    *   Team Performance tracking (Win rates of chosen football clubs).
    *   Most Wins leaderboards.
*   **User Experience:**
    *   Dark/Light mode support.
    *   Bilingual (Turkish/English).
    *   Mobile-responsive design.
    *   Data persistence (LocalStorage).

## 🚀 Quick Start

This project is built with **React 19**, **TypeScript**, and **Tailwind CSS**.

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### Installation (Local Development)

1.  Clone the repository or download the source code.
2.  Install dependencies (if using a bundler like Vite - Recommended):
    ```bash
    npm create vite@latest abis-tracker -- --template react-ts
    # Move source files into the src/ folder
    npm install lucide-react
    npm run dev
    ```

## 📂 Project Structure

*   `components/`: UI components (Fixtures, Standings, CreateTournament, etc.).
*   `services/`: Core logic (Fixture generation algorithm, Stats calculation).
*   `types.ts`: TypeScript interfaces and type definitions.
*   `constants.ts`: Translation strings and configuration constants.

## 🤝 Contributing

See `DEVELOPMENT.md` for detailed architectural guidelines and logic explanations intended for developers and AI agents.
