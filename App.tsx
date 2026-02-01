import React, { useState, useEffect, useMemo } from 'react';
import { TRANSLATIONS } from './constants';
import { Language, Tournament, TournamentType } from './types';
import { generateFixtures, calculateStandings, calculateTeamStats } from './services/tournamentService';
import CreateTournament from './components/CreateTournament';
import Fixtures from './components/Fixtures';
import Standings from './components/Standings';
import Statistics from './components/Stats';
import { 
  Trophy, Calendar, BarChart2, Moon, Sun, Languages, 
  ArrowLeft, Trash2, CheckCircle, Plus, LayoutGrid, Archive, Clock
} from 'lucide-react';

type ViewState = 'dashboard' | 'create' | 'details';

function App() {
  // Global State
  const [lang, setLang] = useState<Language>('tr');
  const [darkMode, setDarkMode] = useState(false);
  
  // Data State
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  
  // Navigation State
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings' | 'stats'>('fixtures');

  // Translations helper
  const t = TRANSLATIONS[lang];

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load from local storage & Migration Logic
  useEffect(() => {
    const savedList = localStorage.getItem('abis_tournaments');
    const savedSingle = localStorage.getItem('abis_tournament');

    if (savedList) {
      try {
        setTournaments(JSON.parse(savedList));
      } catch (e) {
        console.error("Failed to load tournaments", e);
      }
    } else if (savedSingle) {
      // Migration: Single -> List
      try {
        const single = JSON.parse(savedSingle);
        setTournaments([single]);
        localStorage.setItem('abis_tournaments', JSON.stringify([single]));
        localStorage.removeItem('abis_tournament'); // Cleanup old key
      } catch (e) {
        console.error("Failed to migrate tournament", e);
      }
    }
  }, []);

  // Save to local storage whenever list changes
  useEffect(() => {
    if (tournaments.length > 0) {
      localStorage.setItem('abis_tournaments', JSON.stringify(tournaments));
    }
  }, [tournaments]);

  const activeTournament = useMemo(() => 
    tournaments.find(t => t.id === activeTournamentId), 
  [tournaments, activeTournamentId]);

  const handleStartTournament = (
    name: string,
    type: TournamentType,
    hasAwayGoals: boolean,
    isDoubleRound: boolean,
    players: string[]
  ) => {
    const newPlayers = players.map(p => ({ id: Math.random().toString(36).substr(2, 9), name: p }));
    const fixtures = generateFixtures(newPlayers, type, isDoubleRound);

    const newTournament: Tournament = {
      id: Date.now().toString(),
      settings: {
        name,
        type,
        hasAwayGoals,
        isDoubleRound
      },
      players: newPlayers,
      matches: fixtures,
      status: 'active',
      createdAt: Date.now()
    };
    
    setTournaments(prev => [newTournament, ...prev]);
    setActiveTournamentId(newTournament.id);
    setView('details');
    setActiveTab('fixtures');
  };

  const handleMatchUpdate = (matchId: string, homeScore: number, awayScore: number, homeTeam: string, awayTeam: string) => {
    if (!activeTournamentId) return;

    setTournaments(prev => prev.map(tour => {
      if (tour.id !== activeTournamentId) return tour;

      const updatedMatches = tour.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            isCompleted: true,
            home: { ...m.home, score: homeScore, footballTeam: homeTeam },
            away: { ...m.away, score: awayScore, footballTeam: awayTeam }
          };
        }
        return m;
      });

      return { ...tour, matches: updatedMatches };
    }));
  };

  const deleteTournament = () => {
    if (!activeTournamentId) return;
    if (window.confirm(t.resetConfirm)) {
      setTournaments(prev => prev.filter(t => t.id !== activeTournamentId));
      setView('dashboard');
      setActiveTournamentId(null);
    }
  };

  const finishTournament = () => {
    if (!activeTournamentId) return;
    if (window.confirm(t.finishConfirm)) {
      setTournaments(prev => prev.map(t => 
        t.id === activeTournamentId ? { ...t, status: 'completed' } : t
      ));
      // Stay on page but status updates
    }
  };

  const openTournament = (id: string) => {
    setActiveTournamentId(id);
    setView('details');
    setActiveTab('fixtures');
  };

  // Stats Logic
  const standings = useMemo(() => {
    if (!activeTournament) return [];
    return calculateStandings(activeTournament.players, activeTournament.matches, activeTournament.settings.type);
  }, [activeTournament]);

  const teamStats = useMemo(() => {
    if (!activeTournament) return [];
    return calculateTeamStats(activeTournament.matches);
  }, [activeTournament]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {view === 'details' && (
              <button 
                onClick={() => setView('dashboard')}
                className="p-2 -ml-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                title={t.backToDashboard}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            
            <div 
              onClick={() => setView('dashboard')}
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
            <button 
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition flex items-center space-x-1"
            >
              <Languages size={20} />
              <span className="text-xs font-semibold uppercase">{lang}</span>
            </button>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW: DASHBOARD */}
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="text-brand-500" />
                {t.dashboard}
              </h2>
              <button 
                onClick={() => setView('create')}
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
              
              {tournaments.filter(t => t.status === 'active').length === 0 ? (
                 <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 text-gray-500">
                    {t.noActiveTournaments}
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournaments.filter(t => t.status === 'active').map(tour => {
                    const completed = tour.matches.filter(m => m.isCompleted).length;
                    const total = tour.matches.length;
                    const percent = Math.round((completed / total) * 100);

                    return (
                      <div key={tour.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{tour.settings.name}</h4>
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
                              <div className="bg-brand-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
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

              {tournaments.filter(t => t.status === 'completed').length === 0 ? (
                 <div className="text-sm text-gray-400 dark:text-gray-600 italic">
                    {t.noArchivedTournaments}
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {tournaments.filter(t => t.status === 'completed').map(tour => (
                      <div key={tour.id} className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 opacity-75 hover:opacity-100 transition-opacity">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300">{tour.settings.name}</h4>
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
          </div>
        )}

        {/* VIEW: CREATE */}
        {view === 'create' && (
          <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
             <button 
                onClick={() => setView('dashboard')}
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
        {view === 'details' && activeTournament && (
          <div className="flex flex-col space-y-6 animate-in slide-in-from-right-4 duration-500">
            
            {/* Tournament Header Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <div className="flex items-center gap-3">
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeTournament.settings.name}</h2>
                   {activeTournament.status === 'completed' && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900">
                        {t.completed}
                      </span>
                   )}
                </div>
                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-medium">
                    {activeTournament.settings.type}
                  </span>
                  <span>
                    {activeTournament.settings.isDoubleRound ? t.doubleRound : t.singleRound}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                 {activeTournament.status === 'active' && (
                   <button 
                     onClick={finishTournament}
                     className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium transition"
                   >
                     <CheckCircle size={16} />
                     <span>{t.finishTournament}</span>
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
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-fit self-center sm:self-start">
               <button 
                onClick={() => setActiveTab('fixtures')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${activeTab === 'fixtures' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
               >
                 <Calendar size={18} />
                 <span>{t.fixtures}</span>
               </button>
               <button 
                onClick={() => setActiveTab('standings')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${activeTab === 'standings' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
               >
                 <Trophy size={18} />
                 <span>{t.standings}</span>
               </button>
               <button 
                onClick={() => setActiveTab('stats')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${activeTab === 'stats' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
               >
                 <BarChart2 size={18} />
                 <span>{t.stats}</span>
               </button>
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === 'fixtures' && (
                <Fixtures 
                  lang={lang} 
                  matches={activeTournament.matches} 
                  players={activeTournament.players}
                  onUpdateMatch={handleMatchUpdate}
                />
              )}
              {activeTab === 'standings' && (
                <Standings 
                  lang={lang} 
                  data={standings} 
                />
              )}
              {activeTab === 'stats' && (
                <Statistics 
                  lang={lang} 
                  teamStats={teamStats}
                />
              )}
            </div>

            {/* Mobile Actions Footer */}
             {activeTournament.status === 'active' && (
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

export default App;