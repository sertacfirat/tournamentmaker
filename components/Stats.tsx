import React from "react";
import { TRANSLATIONS } from "../constants";
import { Language, TeamStat } from "../types";
import { TrendingUp } from "lucide-react";

interface Props {
  lang: Language;
  teamStats: TeamStat[];
}

const Statistics: React.FC<Props> = ({ lang, teamStats }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Most Wins Chart / List */}
      <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
          <TrendingUp className="text-brand-500" size={20} />
          <span>{t.mostWins}</span>
        </h3>

        {teamStats.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t.noMatches}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamStats.slice(0, 9).map((team, idx) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 flex items-center justify-between border border-gray-100 dark:border-slate-700"
              >
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">
                    {team.teamName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {team.played} {t.p}, {t.winRate}: {team.winRate}%
                  </div>
                </div>
                <div className="text-xl font-bold text-brand-600 dark:text-brand-400">
                  {team.won} {t.w}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
