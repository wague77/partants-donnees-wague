'use client';

import React from 'react';
import { Reunion } from '../types/pmu';
import { MapPin, Flag } from 'lucide-react';

interface MeetingSelectorProps {
  reunions: Reunion[];
  selectedMeetingNum: number | null;
  onSelectMeeting: (numOfficiel: number) => void;
}

export const MeetingSelector: React.FC<MeetingSelectorProps> = ({
  reunions,
  selectedMeetingNum,
  onSelectMeeting,
}) => {
  if (!reunions || reunions.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Réunions du jour ({reunions.length})</span>
        </h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin no-scrollbar">
        {reunions.map((reunion) => {
          const isSelected = reunion.numOfficiel === selectedMeetingNum;
          const courseCount = reunion.courses?.length || 0;
          const hippoName = reunion.hippodrome?.libelleCourt || `R${reunion.numOfficiel}`;
          const paysName = reunion.pays?.libelle;

          return (
            <button
              key={`reunion-${reunion.numOfficiel}`}
              onClick={() => onSelectMeeting(reunion.numOfficiel)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 border text-left ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-900 via-[#064e3b] to-emerald-950 border-amber-400 shadow-md shadow-amber-950/40 text-amber-100 ring-1 ring-amber-400/40 scale-[1.02]'
                  : 'bg-[#032015]/80 hover:bg-[#063323] border-emerald-800/60 hover:border-amber-500/40 text-slate-300'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-sm'
                    : 'bg-emerald-950 text-amber-400/90 border border-emerald-700/50'
                }`}
              >
                R{reunion.numOfficiel}
              </span>

              <div className="flex flex-col">
                <span className="font-bold text-xs sm:text-sm tracking-wide uppercase truncate max-w-[140px] sm:max-w-[180px]">
                  {hippoName}
                </span>
                <span className="text-[10px] text-emerald-300/80 flex items-center gap-1 font-medium">
                  <span>{courseCount} courses</span>
                  {paysName && paysName.toUpperCase() !== 'FRANCE' && (
                    <span className="inline-flex items-center gap-0.5 text-amber-300/70">
                      • <Flag className="w-2.5 h-2.5 inline" /> {paysName}
                    </span>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
