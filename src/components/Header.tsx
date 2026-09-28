'use client';

import React from 'react';
import {
  Calendar,
  RefreshCw,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Lock,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { formatDateToISO, parseISOToDate } from '../services/pmuApi';

interface HeaderProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalMeetings?: number;
  activeUserCode?: string | null;
  onOpenAdmin: () => void;
  onLogoutUser?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  onRefresh,
  isLoading,
  totalMeetings = 0,
  activeUserCode,
  onOpenAdmin,
  onLogoutUser,
}) => {
  const isoDate = formatDateToISO(currentDate);

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const parsed = parseISOToDate(e.target.value);
      onDateChange(parsed);
    }
  };

  const shiftDays = (delta: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    onDateChange(next);
  };

  const isToday = () => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const setToday = () => {
    onDateChange(new Date());
  };

  const formattedDisplayDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  return (
    <header className="sticky top-0 z-40 bg-[#021c13]/95 backdrop-blur-md border-b border-amber-500/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo & Titre */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-md shadow-amber-950/40">
                <div className="w-full h-full bg-[#032417] rounded-[10px] flex items-center justify-center text-amber-400">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black font-cinzel tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                    PARTANTS DONNÉES WAGUE
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                    Direct Turf
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80 font-medium capitalize">
                  {formattedDisplayDate} {totalMeetings > 0 && `• ${totalMeetings} réunions`}
                </p>
              </div>
            </div>

            {/* Actions rapides mobile : Admin & Refresh */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={onOpenAdmin}
                className="p-2 rounded-lg bg-emerald-950/80 border border-amber-500/30 text-amber-300 hover:bg-emerald-900 active:scale-95 transition-all shadow"
                title="Espace Administrateur"
              >
                <Lock className="w-4 h-4 text-amber-400" />
              </button>

              {onLogoutUser && (
                <button
                  onClick={onLogoutUser}
                  className="p-2 rounded-lg bg-red-950/80 border border-red-500/30 text-red-300 hover:bg-red-900 active:scale-95 transition-all shadow"
                  title="Changer de code"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                </button>
              )}

              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all shadow disabled:opacity-50"
                title="Actualiser les données"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation Date & Filtres */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 w-full md:w-auto">
            
            {/* Contrôle de Date */}
            <div className="flex items-center bg-[#01140e] border border-amber-500/30 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => shiftDays(-1)}
                className="p-1.5 rounded-lg hover:bg-emerald-900/60 text-slate-300 hover:text-amber-300 transition-colors"
                title="Jour précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative flex items-center px-2">
                <Calendar className="w-4 h-4 text-amber-400 mr-2 pointer-events-none" />
                <input
                  type="date"
                  value={isoDate}
                  onChange={handleDateInput}
                  className="bg-transparent text-xs font-bold text-amber-200 focus:outline-none cursor-pointer text-center font-mono"
                />
              </div>

              <button
                onClick={() => shiftDays(1)}
                className="p-1.5 rounded-lg hover:bg-emerald-900/60 text-slate-300 hover:text-amber-300 transition-colors"
                title="Jour suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bouton Aujourd'hui */}
            {!isToday() && (
              <button
                onClick={setToday}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-900/70 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-800 hover:text-white transition-all shadow"
              >
                Aujourd'hui
              </button>
            )}

            {/* Bouton Actualiser bureau */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isLoading ? 'Mise à jour...' : 'Actualiser'}</span>
            </button>

            {/* Code actif utilisateur & Bouton Admin Bureau */}
            <div className="hidden md:flex items-center gap-2">
              {activeUserCode && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 border border-amber-500/30 text-amber-300 text-xs font-bold shadow">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono">{activeUserCode}</span>
                </div>
              )}

              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#043322] to-[#022116] border border-amber-500/40 text-amber-300 hover:text-amber-200 hover:border-amber-400 text-xs font-bold transition-all shadow hover:shadow-amber-500/10"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </button>

              {onLogoutUser && (
                <button
                  onClick={onLogoutUser}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 hover:bg-red-900 text-xs font-bold transition-all shadow"
                  title="Se déconnecter"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
