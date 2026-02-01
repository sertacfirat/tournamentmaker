import React, { useState } from "react";
import { TRANSLATIONS, POPULAR_TEAMS } from "../constants";
import { Language, Match, Player, MatchTeam } from "../types";
import { Edit2, CheckCircle2, Search, Ghost } from "lucide-react";

interface TeamInputProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
}

// Moved outside main component to prevent re-creation on render (fixes focus loss)
const TeamInput: React.FC<TeamInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (val.length > 0) {
      setSuggestions(
        POPULAR_TEAMS.filter((t) =>
          t.toLowerCase().includes(val.toLowerCase()),
        ),
      );
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm focus:ring-1 focus:ring-brand-500 outline-none dark:text-white"
          placeholder={placeholder}
        />
        <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg mt-1 max-h-32 overflow-y-auto shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => {
                onChange(s);
                setSuggestions([]);
              }}
              className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer dark:text-gray-200"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface Props {
  lang: Language;
  matches: Match[];
  players: Player[];
  onUpdateMatch: (
    id: string,
    hScore: number,
    aScore: number,
    hTeam: string,
    aTeam: string,
  ) => void;
}

const Fixtures: React.FC<Props> = ({
  lang,
  matches,
  players,
  onUpdateMatch,
}) => {
  const t = TRANSLATIONS[lang];
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Edit State
  const [hScore, setHScore] = useState<string>("");
  const [aScore, setAScore] = useState<string>("");
  const [hTeam, setHTeam] = useState("");
  const [aTeam, setATeam] = useState("");

  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.name || "Unknown";

  const openEdit = (match: Match) => {
    setEditingMatch(match);
    setHScore(match.home.score !== null ? match.home.score.toString() : "");
    setAScore(match.away.score !== null ? match.away.score.toString() : "");
    setHTeam(match.home.footballTeam || "");
    setATeam(match.away.footballTeam || "");
  };

  const handleSave = () => {
    if (!editingMatch || hScore === "" || aScore === "") return;
    onUpdateMatch(
      editingMatch.id,
      parseInt(hScore),
      parseInt(aScore),
      hTeam || "Unknown FC",
      aTeam || "Unknown FC",
    );
    setEditingMatch(null);
  };

  const filteredMatches = matches;

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
        {t.noMatches}
      </div>
    );
  }

  // Helper for rendering player names with ghost icon
  const TeamDisplay = ({
    team,
    align,
  }: {
    team: MatchTeam;
    align: "left" | "right";
  }) => (
    <div className={`flex flex-col items-${align} text-${align} w-full`}>
      <div
        className={`flex items-center gap-1 sm:gap-2 ${align === "right" ? "flex-row-reverse sm:flex-row" : "flex-row"}`}
      >
        {team.isGhost && (
          <div title={t.ghostMatch}>
            <Ghost size={14} className="text-gray-400" />
          </div>
        )}
        <div
          className={`font-semibold text-sm sm:text-lg leading-tight truncate w-full ${team.isGhost ? "text-gray-400 dark:text-gray-500 line-through decoration-transparent" : "text-gray-900 dark:text-gray-100"}`}
        >
          {team.playerIds.map((id) => getPlayerName(id)).join(" & ")}
        </div>
      </div>
      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate w-full">
        {team.footballTeam}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {filteredMatches.map((match) => (
        <div
          key={match.id}
          onClick={() => openEdit(match)}
          className={`group relative bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer ${match.isCompleted ? "opacity-80 hover:opacity-100" : ""}`}
        >
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
            {/* Home Side */}
            <div className="flex-1 w-full min-w-0">
              <TeamDisplay team={match.home} align="right" />
            </div>

            {/* Score / VS */}
            <div className="flex flex-col items-center justify-center px-1 sm:px-2 shrink-0">
              {match.isCompleted ? (
                <div className="text-xl sm:text-3xl font-bold font-mono tracking-widest text-brand-600 dark:text-brand-400 whitespace-nowrap">
                  {match.home.score} - {match.away.score}
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-400">
                  VS
                </div>
              )}
              <div className="mt-1 text-[8px] sm:text-[10px] uppercase font-bold text-gray-300 dark:text-slate-600 tracking-wider">
                {t.round} {match.round}
              </div>
            </div>

            {/* Away Side */}
            <div className="flex-1 w-full min-w-0">
              <TeamDisplay team={match.away} align="left" />
            </div>

            {/* Edit Hint Icon */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 size={14} className="text-brand-500" />
            </div>
          </div>
        </div>
      ))}

      {/* Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-600 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                {t.enterScore}
              </h3>
              <span className="text-xs font-mono bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                {t.round} {editingMatch.round}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Home Input Group */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 font-bold text-center text-brand-700 dark:text-brand-300">
                  {editingMatch.home.isGhost && <Ghost size={16} />}
                  <span>
                    {editingMatch.home.playerIds
                      .map((id) => getPlayerName(id))
                      .join(" & ")}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <TeamInput
                      value={hTeam}
                      onChange={setHTeam}
                      label={t.home}
                      placeholder={t.selectTeam}
                    />
                  </div>
                  <div className="w-full sm:w-20">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 text-center">
                      {t.scoreInput}
                    </label>
                    <input
                      type="number"
                      value={hScore}
                      onChange={(e) => setHScore(e.target.value)}
                      className="w-full p-2 text-center text-xl font-bold border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-gray-300 dark:text-slate-600">
                <div className="h-px bg-current w-full"></div>
                <span className="px-2 text-xs font-bold uppercase">VS</span>
                <div className="h-px bg-current w-full"></div>
              </div>

              {/* Away Input Group */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 font-bold text-center text-red-700 dark:text-red-300">
                  {editingMatch.away.isGhost && <Ghost size={16} />}
                  <span>
                    {editingMatch.away.playerIds
                      .map((id) => getPlayerName(id))
                      .join(" & ")}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <TeamInput
                      value={aTeam}
                      onChange={setATeam}
                      label={t.away}
                      placeholder={t.selectTeam}
                    />
                  </div>
                  <div className="w-full sm:w-20">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 text-center">
                      {t.scoreInput}
                    </label>
                    <input
                      type="number"
                      value={aScore}
                      onChange={(e) => setAScore(e.target.value)}
                      className="w-full p-2 text-center text-xl font-bold border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {(editingMatch.home.isGhost || editingMatch.away.isGhost) && (
                <div className="text-xs text-center text-gray-400 italic flex items-center justify-center gap-1">
                  <Ghost size={14} />
                  {t.ghostMatch}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex space-x-3">
              <button
                onClick={() => setEditingMatch(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-600 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-500/20 transition flex items-center justify-center space-x-2"
              >
                <CheckCircle2 size={18} />
                <span>{t.save}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fixtures;
