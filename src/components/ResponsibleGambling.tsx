'use client';

import React from 'react';
import { ShieldAlert, PhoneCall } from 'lucide-react';

export const ResponsibleGambling: React.FC = () => {
  return (
    <aside
      aria-label="Jeu responsable"
      className="w-full bg-[#021810] border-t border-amber-500/20 py-4 px-4 sm:px-6"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-amber-200/90 font-medium">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-300">Jouer comporte des risques :</strong> endettement, dépendance…
          </span>
        </div>

        <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-amber-300 shadow-sm">
          <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Appelez le <strong className="font-bold text-amber-200 tracking-wider">09 74 75 13 13</strong>{' '}
            <span className="text-[11px] text-amber-400/80">(appel non surtaxé)</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
