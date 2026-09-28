import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface CloudState {
  revokedCodes: string[];
  blockedCodes: string[];
  disconnectedDevices: string[];
  codes: Array<{
    id: string;
    code: string;
    isActive: boolean;
    expiresAt?: number | null;
  }>;
  lastUpdated: number;
}

// Emplacement temporaire du fichier cloud sur le serveur
const TEMP_FILE_PATH = path.join('/tmp', 'wague_cloud_auth_store.json');

// Memory cache fallback
let memoryState: CloudState = {
  revokedCodes: ['WAGUE-2CH-LCS8', 'TURF-2025-VIP', 'WAGUE-2025-VIP'],
  blockedCodes: [],
  disconnectedDevices: [],
  codes: [],
  lastUpdated: Date.now(),
};

function readCloudState(): CloudState {
  try {
    if (fs.existsSync(TEMP_FILE_PATH)) {
      const content = fs.readFileSync(TEMP_FILE_PATH, 'utf-8');
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.revokedCodes)) {
          memoryState = parsed;
        }
      }
    }
  } catch {
    // Fallback mémoire
  }
  return memoryState;
}

function writeCloudState(newState: Partial<CloudState>): CloudState {
  const current = readCloudState();

  // Identifier les codes explicitement réactivés par l'Admin
  let activeCodeStrings: string[] = [];
  if (newState.codes && Array.isArray(newState.codes)) {
    activeCodeStrings = newState.codes
      .filter((c) => c.isActive && (!c.expiresAt || c.expiresAt > Date.now()))
      .map((c) => c.code.trim().toUpperCase());
  }

  // Retirer les codes réactivés des listes de blocage / révocation
  const filteredCurrentRevoked = current.revokedCodes.filter(
    (c) => !activeCodeStrings.includes(c)
  );

  let newRevoked = (newState.revokedCodes || []).map((c) => c.trim().toUpperCase());
  let newBlocked = (newState.blockedCodes || []).map((c) => c.trim().toUpperCase());

  // Si des codes explicites sont envoyés, recalculer la liste exacte des bloqués
  let updatedBlockedCodes = newState.blockedCodes
    ? newBlocked
    : current.blockedCodes.filter((c) => !activeCodeStrings.includes(c));

  const updated: CloudState = {
    ...current,
    ...newState,
    revokedCodes: Array.from(
      new Set([...filteredCurrentRevoked, ...newRevoked])
    ).filter((c) => !activeCodeStrings.includes(c)),
    blockedCodes: Array.from(new Set(updatedBlockedCodes)).filter(
      (c) => !activeCodeStrings.includes(c)
    ),
    disconnectedDevices: Array.from(
      new Set([
        ...current.disconnectedDevices,
        ...(newState.disconnectedDevices || []),
      ])
    ),
    lastUpdated: Date.now(),
  };

  if (newState.codes) {
    updated.codes = newState.codes;
  }

  memoryState = updated;

  try {
    fs.writeFileSync(TEMP_FILE_PATH, JSON.stringify(updated), 'utf-8');
  } catch {
    // Silencieux si système de fichier /tmp restreint
  }

  return memoryState;
}

// GET /api/sync?code=XYZ&device_id=123
export async function GET(req: NextRequest) {
  const state = readCloudState();
  const url = new URL(req.url);
  const code = url.searchParams.get('code')?.trim().toUpperCase();
  const deviceId = url.searchParams.get('device_id');

  // Si une vérification spécifique d'un code est demandée par un appareil client
  if (code) {
    // 1. Si le code est dans la liste détaillée et qu'il est ACTIF et non expiré -> Toujours autorisé !
    const matched = state.codes.find((c) => c.code.toUpperCase() === code);
    if (matched && matched.isActive && (!matched.expiresAt || matched.expiresAt > Date.now())) {
      return NextResponse.json({
        authorized: true,
        codeDetails: matched,
        lastUpdated: state.lastUpdated,
      });
    }

    // 2. Est-ce que le code est révoqué ou supprimé ?
    if (state.revokedCodes.includes(code)) {
      return NextResponse.json({
        authorized: false,
        status: 'DELETED',
        reason: 'Ce code d’accès a été révoqué ou supprimé par l’Administrateur.',
        lastUpdated: state.lastUpdated,
      });
    }

    // 3. Est-ce que le code est explicitement bloqué / suspendu ?
    if (state.blockedCodes.includes(code) || (matched && !matched.isActive)) {
      return NextResponse.json({
        authorized: false,
        status: 'SUSPENDED',
        reason: 'Ce code d’accès a été suspendu par l’Administrateur.',
        lastUpdated: state.lastUpdated,
      });
    }

    // 4. Est-ce que le code a expiré ?
    if (matched && matched.expiresAt && Date.now() > matched.expiresAt) {
      return NextResponse.json({
        authorized: false,
        status: 'EXPIRED',
        reason: 'Ce code d’accès a expiré.',
        lastUpdated: state.lastUpdated,
      });
    }

    // 5. Est-ce que l'appareil spécifique a été déconnecté par l'Admin ?
    if (deviceId && state.disconnectedDevices.includes(deviceId)) {
      return NextResponse.json({
        authorized: false,
        status: 'DEVICE_DISCONNECTED',
        reason: 'Votre appareil a été déconnecté par l’Administrateur.',
        lastUpdated: state.lastUpdated,
      });
    }
  }

  return NextResponse.json({
    authorized: true,
    state,
  });
}

// POST /api/sync (Appelé par l'Admin pour synchroniser révocations, blocages et déblocages)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = writeCloudState(body);

    return NextResponse.json({
      success: true,
      state: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erreur de synchronisation' },
      { status: 400 }
    );
  }
}
