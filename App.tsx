import React, { useState, useEffect, useMemo } from "react";
import { TRANSLATIONS } from "./constants";
import { Language, Tournament, TournamentType } from "./types";
import {
  generateFixtures,
  calculateStandings,
  calculateTeamStats,
} from "./services/tournamentService";
import CreateTournament from "./components/CreateTournament";
import Fixtures from "./components/Fixtures";
import Standings from "./components/Standings";
import Statistics from "./components/Stats";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { db } from "./src/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Trophy,
  Calendar,
  BarChart2,
  Moon,
  Sun,
  Languages,
  ArrowLeft,
  Trash2,
  CheckCircle,
  Plus,
  LayoutGrid,
  Archive,
  Clock,
  LogOut,
  User,
  AlertCircle,
} from "lucide-react";

type ViewState = "dashboard" | "create" | "details";

function AppContent() {
  const { user, logout, loading, deleteAccount, resendVerification } =
    useAuth();

  // Global State
  const [lang, setLang] = useState<Language>("tr");
  // Auto-Theme Logic (Initialize)
  const [darkMode, setDarkMode] = useState(() => {
    // 1. Check LocalStorage
    const saved = localStorage.getItem("abis_theme");
    if (saved) {
      return saved === "dark";
    }
    // 2. Check System Preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return true;
    }
    return false;
  });

  // Data State
  // Data State
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  // Track which user the current data belongs to.
  // This prevents overwriting a new user's cloud data with the previous user's local state during the login transition.
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  // Navigation State
  const [view, setView] = useState<ViewState>("dashboard");
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "fixtures" | "standings" | "stats"
  >("fixtures");

  // Translations helper
  const t = TRANSLATIONS[lang];

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("abis_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("abis_theme", "light");
    }
  }, [darkMode]);

  // Load Data (Firestore or LocalStorage)
  useEffect(() => {
    const loadData = async () => {
      // If auth is still loading, wait.
      if (loading) return;

      const currentUid = user ? user.uid : "guest";

      if (user) {
        // Load from Firestore
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setTournaments(docSnap.data().tournaments || []);
          } else {
            // New user or no data yet?
            setTournaments([]);
          }
        } catch (error) {
          console.error("Error loading from Firestore:", error);
        }
      } else {
        // Fallback to LocalStorage
        const savedList = localStorage.getItem("abis_tournaments");
        if (savedList) {
          try {
            setTournaments(JSON.parse(savedList));
          } catch (e) {
            console.error("Failed to load tournaments", e);
          }
        } else {
          setTournaments([]);
        }
      }

      // Confirm that the data in state now belongs to this user
      setLoadedUserId(currentUid);
    };

    loadData();
  }, [user, loading]);

  // Save Data (Firestore or LocalStorage)
  useEffect(() => {
    const currentUid = user ? user.uid : "guest";

    // CRITICAL: Only save if the data currently in state was actually loaded for THIS user.
    if (loadedUserId !== currentUid) return;

    const saveData = async () => {
      if (user) {
        try {
          await setDoc(doc(db, "users", user.uid), { tournaments });
        } catch (error) {
          console.error("Error saving to Firestore:", error);
        }
      } else {
        localStorage.setItem("abis_tournaments", JSON.stringify(tournaments));
      }
    };

    saveData();
  }, [tournaments, user, loadedUserId]);

  const activeTournament = useMemo(
    () => tournaments.find((t) => t.id === activeTournamentId),
    [tournaments, activeTournamentId],
  );

  const handleStartTournament = (
    name: string,
    type: TournamentType,
    hasAwayGoals: boolean,
    isDoubleRound: boolean,
    players: string[],
  ) => {
    // SECURITY CODE:

    // 1. Email Verification Check
    if (user && !user.emailVerified) {
      alert("Please verify your email address before creating a tournament.");
      return;
    }

    // 2. Rate Limit Check (5 tournaments per day)
    const today = new Date().toISOString().split("T")[0];
    const todayTournaments = tournaments.filter((t) => {
      const tDate = new Date(t.createdAt).toISOString().split("T")[0];
      return tDate === today;
    });

    if (todayTournaments.length >= 5) {
      alert("Daily tournament limit exceeded (max 5).");
      return;
    }

    const newPlayers = players.map((p) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: p,
    }));
    const fixtures = generateFixtures(newPlayers, type, isDoubleRound);

    const newTournament: Tournament = {
      id: Date.now().toString(),
      settings: {
        name,
        type,
        hasAwayGoals,
        isDoubleRound,
      },
      players: newPlayers,
      matches: fixtures,
      status: "active",
      createdAt: Date.now(),
    };

    setTournaments((prev) => [newTournament, ...prev]);
    setActiveTournamentId(newTournament.id);
    setView("details");
    setActiveTab("fixtures");
  };

  const handleMatchUpdate = (
    matchId: string,
    homeScore: number,
    awayScore: number,
    homeTeam: string,
    awayTeam: string,
  ) => {
    if (!activeTournamentId) return;

    setTournaments((prev) =>
      prev.map((tour) => {
        if (tour.id !== activeTournamentId) return tour;

        const updatedMatches = tour.matches.map((m) => {
          if (m.id === matchId) {
            return {
              ...m,
              isCompleted: true,
              home: { ...m.home, score: homeScore, footballTeam: homeTeam },
              away: { ...m.away, score: awayScore, footballTeam: awayTeam },
            };
          }
          return m;
        });

        return { ...tour, matches: updatedMatches };
      }),
    );
  };

  const deleteTournament = () => {
    if (!activeTournamentId) return;
    if (window.confirm(t.resetConfirm)) {
      setTournaments((prev) => prev.filter((t) => t.id !== activeTournamentId));
      setView("dashboard");
      setActiveTournamentId(null);
    }
  };

  const finishTournament = () => {
    if (!activeTournamentId) return;
    if (window.confirm(t.finishConfirm)) {
      setTournaments((prev) =>
        prev.map((t) =>
          t.id === activeTournamentId ? { ...t, status: "completed" } : t,
        ),
      );
    }
  };

  const openTournament = (id: string) => {
    setActiveTournamentId(id);
    setView("details");
    setActiveTab("fixtures");
  };

  const standings = useMemo(() => {
    if (!activeTournament) return [];
    return calculateStandings(
      activeTournament.players,
      activeTournament.matches,
      activeTournament.settings.type,
    );
  }, [activeTournament]);

  const teamStats = useMemo(() => {
    if (!activeTournament) return [];
    return calculateTeamStats(activeTournament.matches);
  }, [activeTournament]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500">
        Loading...
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gray-50 dark:bg-slate-900">
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/30">
                A
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-200">
                {t.appTitle}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLang(lang === "tr" ? "en" : "tr")}
                className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <Languages size={20} />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </header>
        <Login lang={lang} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {view === "details" && (
              <button
                onClick={() => setView("dashboard")}
                className="p-2 -ml-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                title={t.backToDashboard}
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <div
              onClick={() => setView("dashboard")}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/30">
                A
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-200 hidden sm:block">
                {t.appTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              <User size={14} className="mr-2" />
              {user.email}
            </div>

            <button
              onClick={() => setLang(lang === "tr" ? "en" : "tr")}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition flex items-center space-x-1"
            >
              <Languages size={20} />
              <span className="text-xs font-semibold uppercase hidden sm:block">
                {lang}
              </span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={logout}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Security Warnings */}
      {user && !user.emailVerified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200 text-sm">
              <AlertCircle size={16} />
              <span>
                Please verify your email address to create tournaments. (
                {user.email})
              </span>
            </div>
            {/* 
                We would add a resend button here, but we need to expose it from AuthContext first 
                or just let them do it from a profile page. For now, this is a banner.
            */}
          </div>
        </div>
      )}

      {/* Security Warnings */}
      {user && !user.emailVerified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200 text-sm">
              <AlertCircle size={16} />
              <span>
                Please verify your email address to create tournaments. (
                {user.email})
              </span>
            </div>
            <button
              onClick={() => {
                resendVerification().then(() =>
                  alert("Verification email sent!"),
                );
              }}
              className="text-xs font-bold text-yellow-700 dark:text-yellow-300 hover:underline"
            >
              Resend Email
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW: DASHBOARD */}
        {view === "dashboard" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="text-brand-500" />
                {t.dashboard}
              </h2>
              <button
                onClick={() => setView("create")}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-brand-500/30 flex items-center space-x-2 transition-transform transform active:scale-95"
              >
                <Plus size={20} />
                <span>{t.newTournament}</span>
              </button>
            </div>

            {/* Active Tournaments */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                <Clock size={16} />
                {t.activeTournaments}
              </h3>

              {tournaments.filter((t) => t.status === "active").length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 text-gray-500">
                  {t.noActiveTournaments}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournaments
                    .filter((t) => t.status === "active")
                    .map((tour) => {
                      const completed = tour.matches.filter(
                        (m) => m.isCompleted,
                      ).length;
                      const total = tour.matches.length;
                      const percent = Math.round((completed / total) * 100);

                      return (
                        <div
                          key={tour.id}
                          className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                                {tour.settings.name}
                              </h4>
                              <span className="text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full">
                                {tour.settings.type}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(tour.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>

                          <button
                            onClick={() => openTournament(tour.id)}
                            className="w-full py-2 bg-gray-50 dark:bg-slate-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-300 font-medium rounded-lg transition-colors"
                          >
                            {t.resume}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* History */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                <Archive size={16} />
                {t.history}
              </h3>

              {tournaments.filter((t) => t.status === "completed").length ===
              0 ? (
                <div className="text-sm text-gray-400 dark:text-gray-600 italic">
                  {t.noArchivedTournaments}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournaments
                    .filter((t) => t.status === "completed")
                    .map((tour) => (
                      <div
                        key={tour.id}
                        className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 opacity-75 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-700 dark:text-gray-300">
                            {tour.settings.name}
                          </h4>
                          <span className="text-xs bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                            {new Date(tour.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                          {tour.players.length} Players • {tour.settings.type}
                        </div>
                        <button
                          onClick={() => openTournament(tour.id)}
                          className="w-full py-2 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-400 font-medium rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        >
                          {t.view}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Account Management */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-8 mt-12">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                <User size={16} />
                Account
              </h3>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Delete Account
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Permanently delete your account and all tournament data.
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete your account? This will erase ALL your data permanently.",
                      )
                    ) {
                      try {
                        await deleteAccount();
                      } catch (e) {
                        alert(
                          "Failed to delete account. You may need to re-login first.",
                        );
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CREATE */}
        {view === "create" && (
          <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setView("dashboard")}
              className="mb-4 flex items-center space-x-1 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              <ArrowLeft size={16} />
              <span>{t.cancel}</span>
            </button>
            <CreateTournament
              lang={lang}
              onStart={handleStartTournament}
              isDarkMode={darkMode}
            />
          </div>
        )}

        {/* VIEW: DETAILS (TOURNAMENT) */}
        {view === "details" && activeTournament && (
          <div className="flex flex-col space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Tournament Header Info */}
            {/* Tournament Header - EXPERIMENTAL COMPACT DESIGN */}
            {(() => {
              // Calculate Stats dynamically
              const totalMatches = activeTournament.matches.length;
              const completedMatches = activeTournament.matches.filter(
                (m) => m.isCompleted,
              ).length;
              const progress = Math.round(
                (completedMatches / totalMatches) * 100,
              );

              // Calculate Leader
              const standings = calculateStandings(
                activeTournament.players,
                activeTournament.matches,
                activeTournament.settings.type,
              );
              const leader = standings.length > 0 ? standings[0] : null;
              const hasStarted = completedMatches > 0;

              return (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
                  {/* Top Row: Title & Actions */}
                  <div className="relative flex flex-col items-center justify-center mb-6">
                    {/* Actions (Absolute Right or Top Right) */}
                    <div className="absolute right-0 top-0 flex items-center gap-2">
                      {activeTournament.status === "active" && (
                        <button
                          onClick={finishTournament}
                          className="p-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg transition"
                          title={t.finishTournament}
                        >
                          <CheckCircle size={20} />
                        </button>
                      )}
                      <button
                        onClick={deleteTournament}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title={t.reset}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    {/* Centered Title */}
                    <div className="text-center pt-2 px-10">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                        {activeTournament.settings.name}
                        {activeTournament.status === "completed" && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900">
                            {t.completed}
                          </span>
                        )}
                      </h2>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                          {activeTournament.settings.type}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                          {activeTournament.settings.isDoubleRound
                            ? t.doubleRound
                            : t.singleRound}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                          {new Date(
                            activeTournament.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row - Single Line */}
                  <div className="flex flex-row flex-wrap items-center justify-center sm:justify-between gap-x-8 gap-y-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    {/* Stat 1: Matches */}
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-0.5">
                        Matches
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {completedMatches}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          / {totalMatches}
                        </span>
                      </div>
                    </div>

                    {/* Stat 2: Progress */}
                    <div className="flex flex-col items-center sm:items-start min-w-[100px]">
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-0.5">
                        Progress
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full w-20">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                          {progress}%
                        </span>
                      </div>
                    </div>

                    {/* Stat 3: Leader */}
                    <div className="flex flex-col items-center sm:items-start">
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-0.5">
                        Leader
                      </span>
                      {hasStarted && leader ? (
                        <div className="flex items-center gap-1.5">
                          <Trophy size={14} className="text-yellow-500" />
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-gray-900 dark:text-white text-sm max-w-[100px] truncate">
                              {leader.playerName}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              ({leader.points} pts)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">-</span>
                      )}
                    </div>

                    {/* Stat 4: Goals (Desktop Only) */}
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-0.5">
                        Goals
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {activeTournament.matches.reduce(
                          (acc, m) =>
                            acc + (m.home.score || 0) + (m.away.score || 0),
                          0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4 bg-gray-100 dark:bg-slate-800/50 p-1.5 rounded-xl self-center w-full max-w-md">
              <button
                onClick={() => setActiveTab("fixtures")}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === "fixtures" ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50"}`}
              >
                <Calendar size={20} className="mb-0.5" />
                <span>{t.fixtures}</span>
              </button>
              <button
                onClick={() => setActiveTab("standings")}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === "standings" ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50"}`}
              >
                <Trophy size={20} className="mb-0.5" />
                <span>{t.standings}</span>
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === "stats" ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50"}`}
              >
                <BarChart2 size={20} className="mb-0.5" />
                <span>{t.stats}</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === "fixtures" && (
                <Fixtures
                  lang={lang}
                  matches={activeTournament.matches}
                  players={activeTournament.players}
                  onUpdateMatch={handleMatchUpdate}
                />
              )}
              {activeTab === "standings" && (
                <Standings lang={lang} data={standings} />
              )}
              {activeTab === "stats" && (
                <Statistics lang={lang} teamStats={teamStats} />
              )}
            </div>

            {/* Mobile Actions Footer */}
            {activeTournament.status === "active" && (
              <div className="sm:hidden flex justify-center mt-6">
                <button
                  onClick={finishTournament}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl font-bold transition shadow-sm border border-green-200 dark:border-green-800"
                >
                  <CheckCircle size={18} />
                  <span>{t.finishTournament}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
