import {
  ProgrammeResponse,
  ParticipantsResponse,
  PronosticsResponse,
  PronosticsDetaillesResponse,
  Pari,
} from '../types/pmu';
import { enforceBlocklistCheck, cookies } from './authService';

const PMU_BASE_URL = 'https://offline.turfinfo.api.pmu.fr/rest/client/7/programme';

async function callPmuApi<T>(rawUrlOrSubpath: string): Promise<T> {
  const blockCheck = enforceBlocklistCheck();
  if (!blockCheck.ok) {
    cookies().delete('app_access_token');
    throw new Error('401 Unauthorized: Session révoquée sur la blocklist (app_access_token coupé directement).');
  }

  const cleanSubpath = rawUrlOrSubpath
    .replace('https://offline.turfinfo.api.pmu.fr/rest/client/7/programme', '')
    .replace(/^\/+/, '');

  const url = typeof window !== 'undefined'
    ? `/api/pmu/${cleanSubpath}`
    : `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${cleanSubpath}`;

  const customFetch = typeof window !== 'undefined' ? (window as any)?.nova?.fetch : undefined;
  const fetchFn = typeof customFetch === 'function' ? customFetch : fetch;

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (fetchErr: any) {
    if (typeof window !== 'undefined' && url.startsWith('/api/pmu/')) {
      try {
        const directUrl = `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${cleanSubpath}`;
        response = await fetchFn(directUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
      } catch {
        throw new Error(`Erreur de connexion aux données PMU: ${fetchErr?.message || 'Failed to fetch'}`);
      }
    } else {
      throw new Error(`Erreur de connexion aux données PMU: ${fetchErr?.message || 'Failed to fetch'}`);
    }
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Aucune donnée trouvée pour cette requête (404).`);
    }
    throw new Error(`Erreur réseau données wague (${response.status} : ${response.statusText || 'Inconnu'})`);
  }

  const data = await response.json();
  return data as T;
}

export function formatDateToJJMMAAAA(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}${m}${y}`;
}

export function formatDateToISO(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
}

export function parseISOToDate(isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export async function fetchProgramme(dateJJMMAAAA: string): Promise<ProgrammeResponse> {
  const url = `${PMU_BASE_URL}/${dateJJMMAAAA}`;
  return await callPmuApi<ProgrammeResponse>(url);
}

export async function fetchParticipants(
  dateJJMMAAAA: string,
  numReunion: number,
  numCourse: number
): Promise<ParticipantsResponse> {
  const url = `${PMU_BASE_URL}/${dateJJMMAAAA}/R${numReunion}/C${numCourse}/participants`;
  return await callPmuApi<ParticipantsResponse>(url);
}

export async function fetchPronostics(
  dateJJMMAAAA: string,
  numReunion: number,
  numCourse: number
): Promise<PronosticsResponse> {
  const url = `${PMU_BASE_URL}/${dateJJMMAAAA}/R${numReunion}/C${numCourse}/pronostics`;
  return await callPmuApi<PronosticsResponse>(url);
}

export async function fetchPronosticsDetailles(
  dateJJMMAAAA: string,
  numReunion: number,
  numCourse: number
): Promise<PronosticsDetaillesResponse> {
  const url = `${PMU_BASE_URL}/${dateJJMMAAAA}/R${numReunion}/C${numCourse}/pronostics-detailles`;
  return await callPmuApi<PronosticsDetaillesResponse>(url);
}

export function cleanBetCode(code: string): string {
  if (!code) return '';
  return code.replace(/^E_/, '').trim().toUpperCase();
}

export function getBetDisplayName(rawCode: string): string {
  const code = cleanBetCode(rawCode);
  const mapping: Record<string, string> = {
    SIMPLE_GAGNANT: 'Simple Gagnant',
    SIMPLE_PLACE: 'Simple Placé',
    COUPLE_GAGNANT: 'Couplé Gagnant',
    COUPLE_PLACE: 'Couplé Placé',
    COUPLE_ORDRE: 'Couplé Ordre',
    DEUX_SUR_QUATRE: '2 sur 4',
    '2_SUR_4': '2 sur 4',
    '2SUR4': '2 sur 4',
    TRIO: 'Trio',
    TRIO_ORDRE: 'Trio Ordre',
    TIERCE: 'Tiercé',
    SUPER_QUATRE: 'Super 4',
    SUPER_4: 'Super 4',
    SUPER4: 'Super 4',
    QUARTE_PLUS: 'Quarté+',
    QUARTE: 'Quarté+',
    MULTI: 'Multi',
    MULTI_EN_4: 'Multi',
    QUINTE_PLUS: 'Quinté+',
    QUINTE: 'Quinté+',
    PICK5: 'Pick 5',
    PICK_5: 'Pick 5',
    MINI_MULTI: 'Mini Multi',
  };

  return mapping[code] || code.replace(/_/g, ' ');
}

export interface CanonicalGameType {
  id: string;
  displayName: string;
  horseCount: number;
  priority: number;
}

export function getCanonicalGameFromCode(rawCode: string): CanonicalGameType | null {
  const code = cleanBetCode(rawCode);

  if (code.includes('SIMPLE')) {
    return { id: 'SIMPLE', displayName: 'Simple Gagnant / Placé', horseCount: 1, priority: 1 };
  }
  if (code.includes('COUPLE')) {
    return { id: 'COUPLE', displayName: 'Couplé', horseCount: 2, priority: 2 };
  }
  if (code.includes('DEUX_SUR_QUATRE') || code.includes('2_SUR_4') || code.includes('2SUR4')) {
    return { id: '2_SUR_4', displayName: '2 sur 4', horseCount: 2, priority: 3 };
  }
  if (code.includes('TIERCE')) {
    return { id: 'TIERCE', displayName: 'Tiercé', horseCount: 3, priority: 4 };
  }
  if (code.includes('TRIO')) {
    return { id: 'TRIO', displayName: 'Trio', horseCount: 3, priority: 5 };
  }
  if (code.includes('QUARTE')) {
    return { id: 'QUARTE', displayName: 'Quarté+', horseCount: 4, priority: 6 };
  }
  if (code.includes('MULTI')) {
    return { id: 'MULTI', displayName: 'Multi en 4', horseCount: 4, priority: 7 };
  }
  if (code.includes('SUPER')) {
    return { id: 'SUPER_4', displayName: 'Super 4', horseCount: 4, priority: 8 };
  }
  if (code.includes('QUINTE')) {
    return { id: 'QUINTE', displayName: 'Quinté+', horseCount: 5, priority: 9 };
  }
  if (code.includes('PICK5') || code.includes('PICK_5')) {
    return { id: 'PICK_5', displayName: 'Pick 5', horseCount: 5, priority: 10 };
  }

  return null;
}

export function getUniqueCanonicalGames(paris?: Pari[]): CanonicalGameType[] {
  if (!paris || !Array.isArray(paris)) return [];

  const map = new Map<string, CanonicalGameType>();

  paris.forEach((pari) => {
    const game = getCanonicalGameFromCode(pari.codePari);
    if (game && !map.has(game.id)) {
      map.set(game.id, game);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.priority - b.priority);
}

export function getUniqueBetBadges(paris?: Pari[]): string[] {
  if (!paris || !Array.isArray(paris)) return [];
  const set = new Set<string>();

  paris.forEach((p) => {
    const name = getBetDisplayName(p.codePari);
    if (name) {
      set.add(name);
    }
  });

  return Array.from(set);
}

export function formatDepartureTime(heureDepart: number | string | undefined): string {
  if (!heureDepart) return '--:--';

  if (typeof heureDepart === 'number') {
    const date = new Date(heureDepart);
    if (!isNaN(date.getTime())) {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  }

  if (typeof heureDepart === 'string') {
    if (heureDepart.includes(':') && heureDepart.length <= 8) {
      return heureDepart.substring(0, 5);
    }
    const parsed = Date.parse(heureDepart);
    if (!isNaN(parsed)) {
      const date = new Date(parsed);
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  }

  return String(heureDepart);
}

export function formatDiscipline(discipline: string | undefined): { label: string; icon: string } {
  if (!discipline) return { label: 'Course', icon: '🏇' };
  const d = discipline.toUpperCase();

  if (d.includes('ATTELE')) return { label: 'Trot Attelé', icon: '🦽' };
  if (d.includes('MONTE')) return { label: 'Trot Monté', icon: '🏇' };
  if (d.includes('PLAT')) return { label: 'Plat', icon: '🐎' };
  if (d.includes('HAIE')) return { label: 'Haies', icon: '🚧' };
  if (d.includes('STEEPLE')) return { label: 'Steeple-Chase', icon: '🌲' };
  if (d.includes('CROSS')) return { label: 'Cross-Country', icon: '⛰️' };
  if (d.includes('OBSTACLE')) return { label: 'Obstacle', icon: '🚧' };
  if (d.includes('TROT')) return { label: 'Trot', icon: '🦽' };

  return { label: discipline, icon: '🏇' };
}
