'use client';

import React, { useState, useMemo } from 'react';
import { Participant } from '../types/pmu';
import { Search, ArrowUpDown, ShieldAlert, Sparkles } from 'lucide-react';

interface ParticipantsListProps {
  participants: Participant[];
  isLoading: boolean;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'num' | 'cote' | 'nom'>('num');
  const [filterNonPartants, setFilterNonPartants] = useState(false);

  const filteredAndSortedParticipants = useMemo(() => {
    let list = [...participants];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.nom?.toLowerCase().includes(q) ||
          p.driver?.toLowerCase().includes(q) ||
          p.entraineur?.toLowerCase().includes(q) ||
          String(p.numPmu).includes(q)
      );
    }

    if (filterNonPartants) {
      list = list.filter((p) => p.statut !== 'NON_PARTANT');
    }

    list.sort((a, b) => {
      if (a.statut === 'NON_PARTANT' && b.statut !== 'NON_PARTANT') return 1;
      if (a.statut !== 'NON_PARTANT' && b.statut === 'NON_PARTANT') return -1;

      if (sortBy === 'num') {
        return a.numPmu - b.numPmu;
      }
      if (sortBy === 'cote') {
        const coteA = a.dernierRapportDirect?.rapport ?? 9999;
        const coteB = b.dernierRapportDirect?.rapport ?? 9999;
        return coteA - coteB;
      }
      if (sortBy === 'nom') {
        return (a.nom || '').localeCompare(b.nom || '');
      }
      return 0;
    });

    return list;
  }, [participants, searchTerm, sortBy, filterNonPartants]);

  const stats = useMemo(() => {
    const total = participants.length;
    const nonPartants = participants.filter((p) => p.statut === 'NON_PARTANT').length;
    const partantsReels = total - nonPartants;
    return { total, nonPartants, partantsReels };
  }, [participants]);

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl bg-[#021f16] border border-amber-500/20 p-6 space-y-4 animate-pulse">
        <div className="h-6 w-52 bg-emerald-800/40 rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-emerald-950/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!participants || participants.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-[#021f16] border border-emerald-800/40 p-8 text-center">
        <p className="text-emerald-300 font-semibold">
          Aucun partant déclaré pour cette course pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#021c13] border border-amber-500/25">
        <div className="flex items-center gap-3">
          <h3 className="text-sm sm:text-base font-black text-amber-300 font-cinzel tracking-wider uppercase flex items-center gap-2">
            <span>Partants officiels</span>
            <span className="text-xs font-mono-numbers px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {stats.partantsReels}
            </span>
          </h3>
          {stats.nonPartants > 0 && (
            <span className="text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              {stats.nonPartants} non-partant{stats.nonPartants > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-amber-400/80 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cheval, driver, entraîneur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#01140d] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-emerald-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#01140d] p-1 rounded-lg border border-emerald-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 ml-1" />
            <button
              onClick={() => setSortBy('num')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                sortBy === 'num'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-slate-300 hover:text-amber-200'
              }`}
            >
              N°
            </button>
            <button
              onClick={() => setSortBy('cote')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                sortBy === 'cote'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-slate-300 hover:text-amber-200'
              }`}
            >
              Cote
            </button>
            <button
              onClick={() => setSortBy('nom')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                sortBy === 'nom'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-slate-300 hover:text-amber-200'
              }`}
            >
              Nom
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filteredAndSortedParticipants.map((p) => {
          const isNonPartant = p.statut === 'NON_PARTANT';
          const cote = p.dernierRapportDirect?.rapport;
          const isFavorite = cote !== undefined && cote > 0 && cote <= 4.0;

          const sexeCode = p.sexe ? p.sexe.charAt(0).toUpperCase() : '';
          const ageSexe = [sexeCode, p.age ? `${p.age} ans` : ''].filter(Boolean).join(' • ');

          return (
            <div
              key={`participant-${p.numPmu}`}
              className={`group rounded-xl border p-3 sm:p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isNonPartant
                  ? 'bg-slate-900/50 border-slate-800/80 opacity-60 text-slate-500'
                  : isFavorite
                  ? 'bg-gradient-to-r from-[#03291c] via-[#021f15] to-[#01160e] border-amber-500/40 hover:border-amber-400 shadow-sm'
                  : 'bg-[#021b12]/90 border-emerald-800/50 hover:border-amber-500/30 hover:bg-[#032418]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black font-mono-numbers text-base sm:text-lg shrink-0 shadow-md ${
                    isNonPartant
                      ? 'bg-slate-800 text-slate-500 border border-slate-700'
                      : 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-black ring-2 ring-amber-300/40 shadow-amber-950/60'
                  }`}
                >
                  {p.numPmu}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm sm:text-base font-extrabold uppercase tracking-wide truncate ${
                        isNonPartant
                          ? 'line-through text-slate-500'
                          : 'text-slate-100 group-hover:text-amber-200'
                      }`}
                    >
                      {p.nom}
                    </span>

                    {isNonPartant ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-700/60">
                        NON-PARTANT
                      </span>
                    ) : (
                      isFavorite && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Sparkles className="w-2.5 h-2.5" /> Favori
                        </span>
                      )
                    )}

                    {p.deferre && !isNonPartant && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                        title={p.deferre}
                      >
                        {p.deferre.includes('POSTERIEURS') && p.deferre.includes('ANTERIEURS')
                          ? 'D4'
                          : p.deferre.includes('ANTERIEURS')
                          ? 'DA'
                          : p.deferre.includes('POSTERIEURS')
                          ? 'DP'
                          : 'D'}
                      </span>
                    )}

                    {p.oeilleres && !isNonPartant && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60"
                        title={p.oeilleres}
                      >
                        Œ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-emerald-400/80 mt-0.5 font-medium">
                    {ageSexe && <span>{ageSexe}</span>}
                    {p.placeCorde !== undefined && p.placeCorde !== null && (
                      <span>• Corde {p.placeCorde}</span>
                    )}
                    {p.handicapPoids !== undefined && p.handicapPoids !== null && (
                      <span>• {p.handicapPoids / 10} kg</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-900/50">
                <div className="min-w-[120px]">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-semibold block">
                    Driver / Jockey
                  </span>
                  <span
                    className={`font-semibold truncate block max-w-[140px] ${
                      isNonPartant ? 'text-slate-500' : 'text-slate-200'
                    }`}
                    title={p.driver}
                  >
                    {p.driver || '--'}
                  </span>
                </div>

                <div className="min-w-[120px]">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-semibold block">
                    Entraîneur
                  </span>
                  <span
                    className={`font-medium truncate block max-w-[140px] ${
                      isNonPartant ? 'text-slate-500' : 'text-slate-300'
                    }`}
                    title={p.entraineur}
                  >
                    {p.entraineur || '--'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 min-w-[110px]">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-semibold block">
                    Musique
                  </span>
                  <span
                    className={`font-mono-numbers font-medium text-xs tracking-tight ${
                      isNonPartant ? 'text-slate-600' : 'text-amber-200/90'
                    }`}
                    title="Performances récentes"
                  >
                    {p.musique || 'Inédit'}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-900/50 shrink-0">
                <span className="text-[10px] uppercase tracking-wider text-emerald-500/80 font-semibold sm:hidden">
                  Cote Directe
                </span>
                <div className="text-right">
                  {isNonPartant ? (
                    <span className="text-xs font-bold text-slate-500 font-mono-numbers">--</span>
                  ) : cote !== undefined && cote !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-base sm:text-lg font-black font-mono-numbers text-amber-300">
                        {Number(cote).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-amber-500/80 font-bold">/1</span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">NC</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
