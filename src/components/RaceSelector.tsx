'use client';

import React from 'react';
import { Course } from '../types/pmu';
import { formatDepartureTime } from '../services/pmuApi';
import { Clock, Star } from 'lucide-react';

interface RaceSelectorProps {
  courses: Course[];
  selectedRaceNum: number | null;
  onSelectRace: (numOrdre: number) => void;
}

export const RaceSelector: React.FC<RaceSelectorProps> = ({
  courses,
  selectedRaceNum,
  onSelectRace,
}) => {
  if (!courses || courses.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-sm text-emerald-300">
        Aucune course programmée pour cette réunion.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Courses ({courses.length})</span>
        </h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {courses.map((course) => {
          const isSelected = course.numOrdre === selectedRaceNum;
          const time = formatDepartureTime(course.heureDepart);
          const hasQuinte = course.paris?.some((p) => p.codePari?.toUpperCase().includes('QUINTE'));

          return (
            <button
              key={`course-${course.numOrdre}`}
              onClick={() => onSelectRace(course.numOrdre)}
              className={`flex-shrink-0 relative group flex flex-col p-2.5 rounded-xl border text-left transition-all duration-200 min-w-[105px] sm:min-w-[125px] ${
                isSelected
                  ? 'bg-gradient-to-b from-[#064e3b] to-[#022116] border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-950/50 scale-[1.02]'
                  : 'bg-[#021d13]/70 hover:bg-[#043322] border-emerald-800/60 hover:border-amber-500/40 text-slate-300'
              }`}
            >
              {hasQuinte && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black rounded-full flex items-center gap-0.5 shadow">
                  <Star className="w-2.5 h-2.5 fill-current" /> Q+
                </span>
              )}

              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`font-black text-sm px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-amber-400 text-black font-mono-numbers'
                      : 'bg-emerald-950 text-amber-300 border border-emerald-700/50 font-mono-numbers'
                  }`}
                >
                  C{course.numOrdre}
                </span>
                <span
                  className={`text-xs font-mono-numbers font-bold ${
                    isSelected ? 'text-amber-200' : 'text-slate-300'
                  }`}
                >
                  {time}
                </span>
              </div>

              <span className="text-[11px] font-medium text-slate-300 truncate w-full" title={course.libelle}>
                {course.libelle}
              </span>

              <div className="flex items-center justify-between text-[10px] text-emerald-400/80 mt-1 font-medium">
                <span>{course.distance ? `${course.distance}m` : ''}</span>
                <span>{course.nombreDeclaresPartants ? `${course.nombreDeclaresPartants} part.` : ''}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
