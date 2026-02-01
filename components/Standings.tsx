import React from "react";
import { TRANSLATIONS } from "../constants";
import { Language, StandingsRow } from "../types";

interface Props {
  lang: Language;
  data: StandingsRow[];
}

const Standings: React.FC<Props> = ({ lang, data }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] sm:text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-slate-700">
              <th className="px-1 py-2 sm:px-4 sm:py-3 text-center w-6 sm:w-10">
                #
              </th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-left sticky left-0 bg-gray-50 dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] sm:static sm:bg-transparent sm:shadow-none z-10">
                {t.playerName}
              </th>
              <th className="px-1 py-2 sm:px-4 sm:py-3 text-center">{t.p}</th>
              <th className="px-1 py-2 sm:px-4 sm:py-3 text-center">{t.w}</th>
              <th className="px-1 py-2 sm:px-4 sm:py-3 text-center">{t.d}</th>
              <th className="px-1 py-2 sm:px-4 sm:py-3 text-center">{t.l}</th>
              <th className="px-1 py-2 sm:px-4 sm:py-3 text-center">{t.gf}</th>
              <th className="px-1 py-2 sm:px-4 sm:py-3 text-center">{t.ga}</th>
              <th className="px-1 py-2 sm:px-4 sm:py-3 text-center">{t.gd}</th>
              <th className="px-1 py-2 sm:px-4 sm:py-3 text-center font-bold text-gray-900 dark:text-white">
                {t.pts}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {data.map((row, index) => {
              // Dynamic classes for top ranks
              let rankClass = "text-gray-500 dark:text-gray-400";
              if (index === 0) rankClass = "text-yellow-500 font-bold";
              if (index === 1) rankClass = "text-gray-400 font-bold";
              if (index === 2) rankClass = "text-amber-700 font-bold";

              // Truncate player name for mobile
              const displayName =
                row.playerName.length > 7
                  ? row.playerName.substring(0, 7) + "..."
                  : row.playerName;

              return (
                <tr
                  key={row.playerId}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td
                    className={`px-1 py-2 sm:px-4 sm:py-3 text-center ${rankClass}`}
                  >
                    {index + 1}
                  </td>
                  <td
                    title={row.playerName}
                    className="px-2 py-2 sm:px-4 sm:py-3 font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] sm:static sm:bg-transparent sm:shadow-none whitespace-nowrap"
                  >
                    <span className="sm:hidden">{displayName}</span>
                    <span className="hidden sm:inline">{row.playerName}</span>
                  </td>
                  <td className="px-1 py-2 sm:px-4 sm:py-3 text-center text-gray-600 dark:text-gray-300">
                    {row.played}
                  </td>
                  <td className="px-1 py-2 sm:px-4 sm:py-3 text-center text-green-600 dark:text-green-400 font-medium">
                    {row.won}
                  </td>
                  <td className="px-1 py-2 sm:px-4 sm:py-3 text-center text-gray-500">
                    {row.drawn}
                  </td>
                  <td className="px-1 py-2 sm:px-4 sm:py-3 text-center text-red-500">
                    {row.lost}
                  </td>
                  <td className="px-1 py-2 sm:px-4 sm:py-3 text-center text-gray-500">
                    {row.goalsFor}
                  </td>
                  <td className="px-1 py-2 sm:px-4 sm:py-3 text-center text-gray-500">
                    {row.goalsAgainst}
                  </td>
                  <td className="px-1 py-2 sm:px-4 sm:py-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                    {row.goalDifference > 0
                      ? `+${row.goalDifference}`
                      : row.goalDifference}
                  </td>
                  <td className="px-1 py-2 sm:px-4 sm:py-3 text-center font-bold text-sm sm:text-lg text-brand-600 dark:text-brand-400">
                    {row.points}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
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
