'use client';

import React from 'react';
import { Course, Reunion } from '../types/pmu';
import {
  formatDepartureTime,
  formatDiscipline,
  getUniqueBetBadges,
} from '../services/pmuApi';
import { Clock, Ruler, Users, Award, ShieldCheck } from 'lucide-react';

interface RaceCardProps {
  course: Course;
  reunion: Reunion;
}

export const RaceCard: React.FC<RaceCardProps> = ({ course, reunion }) => {
  const time = formatDepartureTime(course.heureDepart);
  const disciplineInfo = formatDiscipline(course.discipline);
  const hippo = reunion.hippodrome?.libelleCourt || `R${reunion.numOfficiel}`;
  const uniqueBets = getUniqueBetBadges(course.paris);

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-[#043323] via-[#022116] to-[#01140d] border border-amber-500/30 p-4 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-emerald-800/40">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs sm:text-sm tracking-wide shadow">
            R{reunion.numOfficiel} · C{course.numOrdre}
          </span>
          <span className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wider">
            {hippo}
          </span>
          {course.statut && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
              {course.statut.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {course.montantTotalOffert && course.montantTotalOffert > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-950/50 border border-amber-500/30 px-3 py-1 rounded-lg">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Allocation : {course.montantTotalOffert.toLocaleString('fr-FR')} €</span>
          </div>
        )}
      </div>

      <div className="my-4">
        <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide font-cinzel">
          {course.libelle}
        </h2>
        {course.conditions && (
          <p className="text-xs text-slate-300/80 mt-1 line-clamp-2 italic">
            {course.conditions}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#021810]/80 border border-emerald-800/50">
          <div className="w-9 h-9 rounded-lg bg-emerald-950 flex items-center justify-center text-amber-400 border border-emerald-700/40">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block font-semibold">
              Départ
            </span>
            <span className="text-sm sm:text-base font-black text-amber-300 font-mono-numbers">
              {time}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#021810]/80 border border-emerald-800/50">
          <div className="w-9 h-9 rounded-lg bg-emerald-950 flex items-center justify-center text-amber-400 border border-emerald-700/40">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block font-semibold">
              Distance
            </span>
            <span className="text-sm sm:text-base font-black text-white font-mono-numbers">
              {course.distance ? `${course.distance.toLocaleString('fr-FR')} m` : '--'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#021810]/80 border border-emerald-800/50">
          <div className="w-9 h-9 rounded-lg bg-emerald-950 flex items-center justify-center text-amber-400 border border-emerald-700/40 text-lg">
            {disciplineInfo.icon}
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block font-semibold">
              Discipline
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[110px] block">
              {disciplineInfo.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#021810]/80 border border-emerald-800/50">
          <div className="w-9 h-9 rounded-lg bg-emerald-950 flex items-center justify-center text-amber-400 border border-emerald-700/40">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block font-semibold">
              Partants
            </span>
            <span className="text-sm sm:text-base font-black text-amber-300 font-mono-numbers">
              {course.nombreDeclaresPartants || '--'} déclarés
            </span>
          </div>
        </div>
      </div>

      {uniqueBets.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-emerald-800/40 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider flex items-center gap-1 mr-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Paris :
          </span>
          {uniqueBets.map((betName, idx) => {
            const isQuinte = betName.toUpperCase().includes('QUINTE');
            const isTierce = betName.toUpperCase().includes('TIERCE') || betName.toUpperCase().includes('TRIO');
            return (
              <span
                key={`${betName}-${idx}`}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                  isQuinte
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-bold'
                    : isTierce
                    ? 'bg-emerald-900/60 text-amber-200 border-amber-500/30'
                    : 'bg-emerald-950/70 text-slate-300 border-emerald-800/60'
                }`}
              >
                {betName}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
