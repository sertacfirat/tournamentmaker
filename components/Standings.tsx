import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, StandingsRow } from '../types';

interface Props {
  lang: Language;
  data: StandingsRow[];
}

const Standings: React.FC<Props> = ({ lang, data }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold text-xs border-b border-gray-100 dark:border-slate-700">
              <th className="px-4 py-3 text-left w-10">#</th>
              <th className="px-4 py-3 text-left">{t.playerName}</th>
              <th className="px-4 py-3 text-center">{t.p}</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">{t.w}</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">{t.d}</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">{t.l}</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">{t.gf}</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">{t.ga}</th>
              <th className="px-4 py-3 text-center">{t.gd}</th>
              <th className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">{t.pts}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {data.map((row, index) => {
               // Dynamic classes for top ranks
               let rankClass = "text-gray-500 dark:text-gray-400";
               if (index === 0) rankClass = "text-yellow-500 font-bold";
               if (index === 1) rankClass = "text-gray-400 font-bold";
               if (index === 2) rankClass = "text-amber-700 font-bold";

               return (
                <tr key={row.playerId} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className={`px-4 py-3 text-center ${rankClass}`}>{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {row.playerName}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{row.played}</td>
                  <td className="px-4 py-3 text-center text-green-600 dark:text-green-400 hidden sm:table-cell font-medium">{row.won}</td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">{row.drawn}</td>
                  <td className="px-4 py-3 text-center text-red-500 hidden sm:table-cell">{row.lost}</td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden md:table-cell">{row.goalsFor}</td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden md:table-cell">{row.goalsAgainst}</td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-lg text-brand-600 dark:text-brand-400">
                    {row.points}
                  </td>
                </tr>
               );
            })}
            {data.length === 0 && (
                <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        {t.noMatches}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Standings;