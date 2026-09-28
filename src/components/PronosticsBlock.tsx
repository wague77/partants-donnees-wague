'use client';

import React, { useMemo } from 'react';
import { Course, Participant, SelectionPronostic } from '../types/pmu';
import { getUniqueCanonicalGames } from '../services/pmuApi';
import { Sparkles, MessageSquareQuote, CheckCircle2, Ticket } from 'lucide-react';

interface PronosticsBlockProps {
  course: Course;
  participants: Participant[];
  selection: SelectionPronostic[];
  commentaire?: string | null;
  isLoading: boolean;
}

export const PronosticsBlock: React.FC<PronosticsBlockProps> = ({
  course,
  participants,
  selection,
  commentaire,
  isLoading,
}) => {
  const participantsMap = useMemo(() => {
    const map = new Map<number, Participant>();
    participants.forEach((p) => {
      map.set(p.numPmu, p);
    });
    return map;
  }, [participants]);

  const hasSelection = Boolean(selection && selection.length > 0);
  const hasComment = Boolean(commentaire && commentaire.trim().length > 0);

  const uniqueGames = useMemo(() => {
    return getUniqueCanonicalGames(course.paris);
  }, [course.paris]);

  const betCombinations = useMemo(() => {
    if (!hasSelection || uniqueGames.length === 0) return [];

    return uniqueGames
      .map((game) => {
        const topHorses = selection.slice(0, game.horseCount).map((item) => {
          const participant = participantsMap.get(item.num_partant);
          return {
            num: item.num_partant,
            nom: participant?.nom || `N°${item.num_partant}`,
            cote: item.cote_prob ?? participant?.dernierRapportDirect?.rapport,
          };
        });

        return {
          id: game.id,
          displayName: game.displayName,
          horseCount: game.horseCount,
          horses: topHorses,
        };
      })
      .filter((combo) => combo.horses.length > 0);
  }, [hasSelection, uniqueGames, selection, participantsMap]);

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl bg-gradient-to-br from-[#03261a] to-[#01170e] border border-amber-500/30 p-6 shadow-xl animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded-full bg-amber-500/20" />
          <div className="h-5 w-48 bg-emerald-800/40 rounded" />
        </div>
        <div className="h-20 bg-emerald-900/20 rounded-xl mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-emerald-900/30 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasSelection && !hasComment) {
    return (
      <div className="w-full rounded-2xl bg-[#021f15] border border-emerald-800/40 p-5 text-center">
        <Sparkles className="w-6 h-6 text-amber-400/60 mx-auto mb-2" />
        <p className="text-sm font-semibold text-emerald-300">
          Pronostic données wague non disponible pour cette épreuve
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Les sélections et commentaires sont publiés par les experts données wague à l'approche de la course.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-[#042d1f] via-[#022116] to-[#01140e] border border-amber-500/40 p-4 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-60 h-24 bg-amber-400/10 blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between pb-3.5 border-b border-amber-500/20 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-md shadow-amber-950/40">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-amber-300 font-cinzel tracking-wider flex items-center gap-2">
              Pronostic Officiel Données Wague
            </h3>
            <p className="text-[11px] text-emerald-300/80 font-medium">
              Sélection experte et combinaisons recommandées
            </p>
          </div>
        </div>
        {hasSelection && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> {selection.length} sélectionnés
          </span>
        )}
      </div>

      {hasComment && (
        <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-[#011910]/90 border border-amber-500/20 text-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
            <MessageSquareQuote className="w-4 h-4 text-amber-400" />
            <span>L'avis des experts données wague</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-200/95 font-sans">
            {commentaire}
          </p>
        </div>
      )}

      {hasSelection && (
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Sélection classée par rang de préférence</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {selection.map((item, idx) => {
              const participant = participantsMap.get(item.num_partant);
              const cote = item.cote_prob ?? participant?.dernierRapportDirect?.rapport;
              const isFirst = idx === 0;

              return (
                <div
                  key={`sel-${item.num_partant}-${idx}`}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                    isFirst
                      ? 'bg-gradient-to-r from-amber-500/20 to-emerald-900/50 border-amber-400 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/40'
                      : 'bg-[#021810]/80 border-emerald-800/60 hover:border-amber-500/30'
                  }`}
                >
                  <span className="text-[10px] font-black text-emerald-400/70 w-3">
                    {item.rang || idx + 1}
                  </span>

                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-black font-black font-mono-numbers text-sm flex items-center justify-center shrink-0 shadow-md shadow-amber-950/60 ring-2 ring-amber-300/40">
                    {item.num_partant}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-100 truncate uppercase" title={participant?.nom}>
                      {participant?.nom || `N°${item.num_partant}`}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {cote !== undefined && cote !== null ? (
                        <span className="font-mono-numbers font-bold text-amber-300">
                          {Number(cote).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">NC</span>
                      )}
                      {participant?.driver && (
                        <span className="text-slate-400 truncate max-w-[80px]">
                          • {participant.driver}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {betCombinations.length > 0 && (
        <div className="pt-4 border-t border-emerald-800/40">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>Combinaisons par jeu proposé (1er de la sélection)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {betCombinations.map((combo) => (
              <div
                key={`combo-${combo.id}`}
                className="p-3 rounded-xl bg-[#021810]/90 border border-amber-500/25 flex flex-col justify-between hover:border-amber-400/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300 tracking-wide">
                    {combo.displayName}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400/80 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                    {combo.horseCount} {combo.horseCount > 1 ? 'chevaux' : 'cheval'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {combo.horses.map((horse, hIdx) => (
                    <div
                      key={`h-${combo.id}-${horse.num}-${hIdx}`}
                      className="inline-flex items-center gap-1.5 bg-[#03271b] border border-amber-500/30 px-2 py-1 rounded-lg"
                      title={horse.nom}
                    >
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black text-xs font-mono-numbers flex items-center justify-center shadow">
                        {horse.num}
                      </span>
                      <span className="text-[11px] font-bold text-slate-200 uppercase truncate max-w-[85px]">
                        {horse.nom}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
