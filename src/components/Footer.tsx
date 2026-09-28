'use client';

import React from 'react';
import { ResponsibleGambling } from './ResponsibleGambling';
import { Radio } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400/80 border-t border-emerald-900/60 gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Service officiel données wague Turf Info.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAdmin}
            className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-medium"
          >
            Panneau Administrateur
          </button>
          <span className="text-slate-600">•</span>
          <p className="text-[11px] text-slate-500">
            Aide aux paris hippiques
          </p>
        </div>
      </div>
      <ResponsibleGambling />
    </footer>
  );
};
