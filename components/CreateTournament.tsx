import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, TournamentType } from '../types';
import { Plus, X, Users, Shield, PlayCircle } from 'lucide-react';

interface Props {
  lang: Language;
  onStart: (name: string, type: TournamentType, hasAwayGoals: boolean, isDoubleRound: boolean, players: string[]) => void;
  isDarkMode: boolean;
}

const CreateTournament: React.FC<Props> = ({ lang, onStart }) => {
  const t = TRANSLATIONS[lang];
  const [name, setName] = useState('');
  const [type, setType] = useState<TournamentType>(TournamentType.OneVsOne);
  const [hasAwayGoals, setHasAwayGoals] = useState(false);
  const [isDoubleRound, setIsDoubleRound] = useState(false);
  const [players, setPlayers] = useState<string[]>(['', '']); // Start with 2 empty slots

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const addPlayerSlot = () => {
    setPlayers([...players, '']);
  };

  const removePlayerSlot = (index: number) => {
    if (players.length <= 2) return;
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validPlayers = players.filter(p => p.trim() !== '');
    const minPlayers = type === TournamentType.TwoVsTwo ? 4 : 2;
    
    if (validPlayers.length < minPlayers) {
      alert(t.playerCountError);
      return;
    }
    
    onStart(name || `Tournament ${new Date().toLocaleDateString()}`, type, hasAwayGoals, isDoubleRound, validPlayers);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-brand-500 to-brand-700 dark:from-brand-900 dark:to-slate-900">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
           <Shield className="w-6 h-6" />
           <span>{t.createTournament}</span>
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Name & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.tournamentName}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Champions League"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.type}</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setType(TournamentType.OneVsOne)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${type === TournamentType.OneVsOne ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
              >
                1 vs 1
              </button>
              <button
                type="button"
                onClick={() => setType(TournamentType.TwoVsTwo)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${type === TournamentType.TwoVsTwo ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
              >
                2 vs 2
              </button>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.rounds}</label>
              <div className="flex flex-col space-y-2">
                 <label className="inline-flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                    <input 
                      type="radio" 
                      name="rounds" 
                      checked={!isDoubleRound}
                      onChange={() => setIsDoubleRound(false)}
                      className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{t.singleRound}</span>
                 </label>
                 <label className="inline-flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                    <input 
                      type="radio" 
                      name="rounds" 
                      checked={isDoubleRound}
                      onChange={() => setIsDoubleRound(true)}
                      className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{t.doubleRound}</span>
                 </label>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.awayGoals}</label>
              <div 
                onClick={() => setHasAwayGoals(!hasAwayGoals)}
                className={`cursor-pointer p-4 rounded-lg border transition-all flex items-center justify-between ${hasAwayGoals ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-slate-700'}`}
              >
                 <span className={`${hasAwayGoals ? 'text-brand-700 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {t.awayGoals}
                 </span>
                 <div className={`w-12 h-6 rounded-full p-1 transition-colors ${hasAwayGoals ? 'bg-brand-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${hasAwayGoals ? 'translate-x-6' : 'translate-x-0'}`} />
                 </div>
              </div>
           </div>
        </div>

        {/* Players */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <Users size={18} />
              <span>{t.players}</span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                (Min {type === TournamentType.TwoVsTwo ? 4 : 2})
              </span>
            </label>
            <button
              type="button"
              onClick={addPlayerSlot}
              className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium flex items-center space-x-1"
            >
              <Plus size={16} />
              <span>{t.addPlayer}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p, i) => (
              <div key={i} className="relative group">
                <input
                  type="text"
                  value={p}
                  onChange={(e) => handlePlayerChange(i, e.target.value)}
                  placeholder={`${t.enterName} ${i + 1}`}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
                {players.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePlayerSlot(i)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t.remove}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-lg shadow-brand-500/30 font-bold text-lg flex items-center justify-center space-x-2 transition-transform transform active:scale-[0.98]"
          >
            <PlayCircle size={24} />
            <span>{t.startTournament}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTournament;