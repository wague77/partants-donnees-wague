'use client';

import React, { useState } from 'react';
import { loginWithCode } from '../services/authService';
import {
  KeyRound,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Lock,
  HelpCircle,
  CreditCard,
  ExternalLink,
  ClipboardPaste,
} from 'lucide-react';
import { ResponsibleGambling } from './ResponsibleGambling';

interface AccessGateProps {
  onSuccess: () => void;
  onOpenAdmin: () => void;
}

export const AccessGate: React.FC<AccessGateProps> = ({ onSuccess, onOpenAdmin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginWithCode(code);
      setIsLoading(false);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Code d’accès invalide ou non reconnu.');
      }
    } catch {
      setIsLoading(false);
      setError('Erreur lors de la validation du code.');
    }
  };

  const handlePasteCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const clean = text.trim().toUpperCase().replace(/\s+/g, '-');
          setCode(clean);
          setError(null);
        }
      }
    } catch {
      // Silencieux
    }
  };

  return (
    <div className="min-h-screen bg-[#03170f] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* Barre supérieure */}
      <header className="px-6 py-4 border-b border-amber-500/20 bg-[#021c13]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80 animate-ping" />
            <span className="font-cinzel text-sm sm:text-base font-black tracking-wider text-amber-300">
              PARTANTS DONNÉES WAGUE
            </span>
          </div>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-amber-500/30 text-amber-300 hover:text-amber-200 hover:border-amber-400 text-xs font-semibold transition-all shadow"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Espace Administrateur</span>
          </button>
        </div>
      </header>

      {/* Carte centrale de déverrouillage */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#043322] via-[#022116] to-[#01140e] border border-amber-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
          {/* Ornements dorés lumineux */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Badge icône d'accès */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 mx-auto mb-5 shadow-xl shadow-amber-950/60">
            <div className="w-full h-full bg-[#022116] rounded-[14px] flex items-center justify-center text-amber-400">
              <KeyRound className="w-8 h-8 text-amber-300" />
            </div>
          </div>

          {/* Titres */}
          <h2 className="text-xl sm:text-2xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 tracking-wide">
            Espace Turf Réservé
          </h2>
          <p className="text-xs sm:text-sm text-emerald-300/80 mt-1.5 font-medium">
            Saisissez votre code d’accès généré par l’administrateur pour débloquer les partants et pronostics en direct données wague.
          </p>

          {/* Formulaire de code */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="accessCode"
                  className="block text-xs font-bold uppercase tracking-wider text-amber-300/90"
                >
                  Code d'accès membre
                </label>
                <button
                  type="button"
                  onClick={handlePasteCode}
                  className="text-[11px] text-emerald-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Coller</span>
                </button>
              </div>

              <div className="relative">
                <input
                  id="accessCode"
                  type="text"
                  placeholder="Entrez le code créé par l'Admin..."
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                  className="w-full bg-[#01140d] text-amber-200 font-mono font-bold text-sm tracking-widest placeholder-slate-600 px-4 py-3 rounded-xl border border-amber-500/40 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-inner text-center uppercase"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Bouton d'accès */}
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-sm tracking-wide shadow-lg shadow-amber-950/50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Accéder maintenant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Bouton de paiement */}
          <div className="mt-4 pt-3 border-t border-emerald-900/60">
            <div className="text-[11px] font-semibold text-emerald-300/90 mb-2 uppercase tracking-wider">
              Pas encore de code d'accès ?
            </div>

            <a
              href="https://www.westernunion.com/fr/en/mobile-wallet.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#ffde00] hover:bg-[#ffe633] text-black font-black text-xs sm:text-sm tracking-wide shadow-md shadow-black/50 active:scale-95 transition-all flex items-center justify-center gap-2 border border-yellow-400 group"
            >
              <CreditCard className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
              <span>Effectuer le paiement (Western Union Mobile Wallet)</span>
              <ExternalLink className="w-3.5 h-3.5 text-black/80" />
            </a>

            <p className="text-[11px] text-slate-400 text-center mt-2 leading-relaxed">
              Payez votre abonnement en ligne et recevez votre code d’accès immédiat.
            </p>
          </div>

          {/* Info sécurité et lien Espace Admin */}
          <div className="mt-5 pt-4 border-t border-emerald-800/50 flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Accès réservé avec code généré par l'administrateur</span>
            </div>

            <div className="p-3 rounded-xl bg-[#021810]/80 border border-amber-500/20 text-left w-full space-y-1">
              <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Vous êtes l’administrateur ?
              </p>
              <p className="text-[11px] text-slate-300/90 leading-relaxed">
                Connectez-vous à l’Espace Administrateur avec votre mot de passe pour générer vos codes et liens de partage.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-xs text-amber-300 hover:text-amber-200 underline transition-colors font-bold flex items-center gap-1.5 mt-1"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ouvrir l’Espace Administrateur</span>
            </button>
          </div>
        </div>
      </main>

      {/* Mention de Jeu Responsable */}
      <ResponsibleGambling />
    </div>
  );
};
