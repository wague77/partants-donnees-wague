'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Reunion, Participant, SelectionPronostic } from '../types/pmu';
import {
  formatDateToJJMMAAAA,
  fetchProgramme,
  fetchParticipants,
  fetchPronostics,
  fetchPronosticsDetailles,
} from '../services/pmuApi';
import { enforceBlocklistCheck, cookies } from '../services/authService';
import { Header } from './Header';
import { MeetingSelector } from './MeetingSelector';
import { RaceSelector } from './RaceSelector';
import { RaceCard } from './RaceCard';
import { PronosticsBlock } from './PronosticsBlock';
import { ParticipantsList } from './ParticipantsList';
import { Footer } from './Footer';
import { AlertCircle, RefreshCw, CalendarOff } from 'lucide-react';

interface DashboardProps {
  userActiveCode: string | null;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userActiveCode,
  onLogout,
  onOpenAdmin,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [selectedMeetingNum, setSelectedMeetingNum] = useState<number | null>(null);
  const [selectedRaceNum, setSelectedRaceNum] = useState<number | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selection, setSelection] = useState<SelectionPronostic[]>([]);
  const [commentaire, setCommentaire] = useState<string | null>(null);

  const [isLoadingProgramme, setIsLoadingProgramme] = useState<boolean>(false);
  const [isLoadingRaceDetails, setIsLoadingRaceDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [raceErrorMessage, setRaceErrorMessage] = useState<string | null>(null);

  const verifyBlocklistOrEject = useCallback(() => {
    const check = enforceBlocklistCheck();
    if (!check.ok) {
      cookies().delete('app_access_token');
      onLogout();
      return false;
    }
    return true;
  }, [onLogout]);

  const activeMeeting = reunions.find((r) => r.numOfficiel === selectedMeetingNum) || null;
  const activeRace = activeMeeting?.courses?.find((c) => c.numOrdre === selectedRaceNum) || null;

  const loadProgramme = useCallback(async (date: Date) => {
    if (!verifyBlocklistOrEject()) return;

    setIsLoadingProgramme(true);
    setErrorMessage(null);
    const dateStr = formatDateToJJMMAAAA(date);

    try {
      const data = await fetchProgramme(dateStr);
      const listReunions = data?.programme?.reunions || [];

      setReunions(listReunions);

      if (listReunions.length > 0) {
        const firstWithCourses =
          listReunions.find((r) => r.courses && r.courses.length > 0) || listReunions[0];

        setSelectedMeetingNum(firstWithCourses.numOfficiel);

        if (firstWithCourses.courses && firstWithCourses.courses.length > 0) {
          setSelectedRaceNum(firstWithCourses.courses[0].numOrdre);
        } else {
          setSelectedRaceNum(null);
        }
      } else {
        setSelectedMeetingNum(null);
        setSelectedRaceNum(null);
        setParticipants([]);
        setSelection([]);
        setCommentaire(null);
      }
    } catch (err: unknown) {
      console.error('Erreur chargement programme données wague:', err);
      const msg = err instanceof Error ? err.message : 'Impossible de récupérer le programme.';
      if (msg.includes('401') || msg.includes('blocklist')) {
        cookies().delete('app_access_token');
        onLogout();
        return;
      }
      setErrorMessage(msg);
      setReunions([]);
      setSelectedMeetingNum(null);
      setSelectedRaceNum(null);
    } fontally: {
      setIsLoadingProgramme(false);
    }
  }, [verifyBlocklistOrEject, onLogout]);

  const loadRaceDetails = useCallback(
    async (dateStr: string, meetingNum: number, raceNum: number) => {
      if (!verifyBlocklistOrEject()) return;

      setIsLoadingRaceDetails(true);
      setRaceErrorMessage(null);

      try {
        const partsData = await fetchParticipants(dateStr, meetingNum, raceNum);
        setParticipants(partsData.participants || []);
      } catch (err: any) {
        if (err?.message?.includes('401') || err?.message?.includes('blocklist')) {
          cookies().delete('app_access_token');
          onLogout();
          return;
        }
        setParticipants([]);
        setRaceErrorMessage('Impossible de récupérer la liste des partants pour cette course.');
      }

      try {
        const pronoData = await fetchPronostics(dateStr, meetingNum, raceNum);
        const sel = pronoData.selection || [];
        if (sel.length === 0 && Array.isArray(pronoData.pronostics)) {
          const mapped = pronoData.pronostics.map((p, idx) => ({
            rang: p.rang ?? idx + 1,
            num_partant: p.num_partant ?? 0,
            cote_prob: p.cote_prob,
          }));
          setSelection(mapped);
        } else {
          setSelection(sel);
        }
      } catch {
        setSelection([]);
      }

      try {
        const detData = await fetchPronosticsDetailles(dateStr, meetingNum, raceNum);
        const txt =
          detData?.commentaire?.texte ||
          detData?.texte ||
          detData?.synthese ||
          null;
        setCommentaire(txt);
      } catch {
        setCommentaire(null);
      }

      setIsLoadingRaceDetails(false);
    },
    [verifyBlocklistOrEject, onLogout]
  );

  useEffect(() => {
    verifyBlocklistOrEject();
    loadProgramme(selectedDate);
  }, [selectedDate, loadProgramme, verifyBlocklistOrEject]);

  useEffect(() => {
    if (selectedMeetingNum !== null && selectedRaceNum !== null) {
      verifyBlocklistOrEject();
      const dateStr = formatDateToJJMMAAAA(selectedDate);
      loadRaceDetails(dateStr, selectedMeetingNum, selectedRaceNum);
    }
  }, [selectedDate, selectedMeetingNum, selectedRaceNum, loadRaceDetails, verifyBlocklistOrEject]);

  const handleSelectMeeting = (numOfficiel: number) => {
    if (!verifyBlocklistOrEject()) return;
    setSelectedMeetingNum(numOfficiel);
    const meeting = reunions.find((r) => r.numOfficiel === numOfficiel);
    if (meeting?.courses && meeting.courses.length > 0) {
      setSelectedRaceNum(meeting.courses[0].numOrdre);
    } else {
      setSelectedRaceNum(null);
    }
  };

  const handleSelectRace = (numOrdre: number) => {
    if (!verifyBlocklistOrEject()) return;
    setSelectedRaceNum(numOrdre);
  };

  const handleRefresh = () => {
    if (!verifyBlocklistOrEject()) return;
    if (selectedMeetingNum !== null && selectedRaceNum !== null) {
      const dateStr = formatDateToJJMMAAAA(selectedDate);
      loadProgramme(selectedDate);
      loadRaceDetails(dateStr, selectedMeetingNum, selectedRaceNum);
    } else {
      loadProgramme(selectedDate);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen">
      <div className="flex-1">
        <Header
          currentDate={selectedDate}
          onDateChange={(d) => {
            if (verifyBlocklistOrEject()) setSelectedDate(d);
          }}
          onRefresh={handleRefresh}
          isLoading={isLoadingProgramme || isLoadingRaceDetails}
          totalMeetings={reunions.length}
          activeUserCode={userActiveCode}
          onOpenAdmin={onOpenAdmin}
          onLogoutUser={onLogout}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {errorMessage && (
            <div className="rounded-xl p-4 bg-red-950/60 border border-red-500/40 text-red-200 flex items-start gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-red-100">Erreur de chargement du programme données wague</p>
                <p className="mt-0.5 text-xs text-red-300/90">{errorMessage}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-white border border-red-400/40"
                >
                  <RefreshCw className="w-3 h-3" /> Réessayer
                </button>
              </div>
            </div>
          )}

          {isLoadingProgramme && reunions.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-amber-400 font-bold text-[10px] uppercase text-center px-1">
                  Wague
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-amber-200">
                  Chargement du programme officiel données wague...
                </p>
                <p className="text-xs text-emerald-400/70">
                  Récupération des réunions et des cotes en direct
                </p>
              </div>
            </div>
          ) : reunions.length === 0 && !errorMessage ? (
            <div className="py-16 text-center rounded-2xl bg-[#022116]/60 border border-emerald-800/40 p-8 space-y-3">
              <CalendarOff className="w-12 h-12 text-amber-400/60 mx-auto" />
              <h3 className="text-lg font-bold text-amber-200">
                Aucune réunion trouvée pour cette date
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Le programme des courses n'est pas disponible pour le jour sélectionné. Choisissez
                la date d'aujourd'hui ou un autre jour de la semaine.
              </p>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs rounded-xl shadow-md hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                Aller à aujourd'hui
              </button>
            </div>
          ) : (
            <>
              <section aria-label="Sélection de réunion">
                <MeetingSelector
                  reunions={reunions}
                  selectedMeetingNum={selectedMeetingNum}
                  onSelectMeeting={handleSelectMeeting}
                />
              </section>

              {activeMeeting && (
                <section aria-label="Sélection de course">
                  <RaceSelector
                    courses={activeMeeting.courses || []}
                    selectedRaceNum={selectedRaceNum}
                    onSelectRace={handleSelectRace}
                  />
                </section>
              )}

              {activeMeeting && activeRace ? (
                <div className="space-y-6">
                  <RaceCard course={activeRace} reunion={activeMeeting} />

                  {raceErrorMessage && (
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{raceErrorMessage}</span>
                    </div>
                  )}

                  <PronosticsBlock
                    course={activeRace}
                    participants={participants}
                    selection={selection}
                    commentaire={commentaire}
                    isLoading={isLoadingRaceDetails}
                  />

                  <ParticipantsList
                    participants={participants}
                    isLoading={isLoadingRaceDetails}
                  />
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-[#021d14] border border-emerald-800/40 text-emerald-300 text-sm">
                  Veuillez sélectionner une course pour afficher les partants et le pronostic.
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Footer onOpenAdmin={onOpenAdmin} />
    </div>
  );
};
