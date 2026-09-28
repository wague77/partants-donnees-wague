/**
 * Service de Synchronisation et Révocation en Temps Réel Multi-Appareils via Serveur API Cloud
 */

const BROADCAST_CHANNEL_NAME = 'wague_turf_cross_device_sync_channel';
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

export interface RevocationEvent {
  code: string;
  status: 'SUSPENDED' | 'DELETED' | 'ACTIVE';
  timestamp: number;
}

const receivedRevocations = new Map<string, { status: string; timestamp: number }>();

// Synchroniser tout l'état de l'administration vers le serveur cloud /api/sync
export async function syncFullStateToCloud(params: {
  revokedCodes?: string[];
  blockedCodes?: string[];
  disconnectedDevices?: string[];
  codes?: Array<{ id: string; code: string; isActive: boolean; expiresAt?: number | null }>;
}): Promise<void> {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch {
    // Silencieux
  }
}

// Diffuser la révocation d'un code vers les autres onglets et le serveur cloud
export async function broadcastRevocation(code: string, status: 'SUSPENDED' | 'DELETED' | 'ACTIVE'): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const event: RevocationEvent = {
    code: cleanCode,
    status,
    timestamp: Date.now(),
  };

  receivedRevocations.set(cleanCode, { status, timestamp: event.timestamp });

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch {
      // Silencieux
    }
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('wague_last_revocation_event', JSON.stringify(event));
    }
  } catch {
    // Silencieux
  }

  // Synchronisation avec l'API Cloud serveur /api/sync
  try {
    const payload: any = {};
    if (status === 'DELETED') {
      payload.revokedCodes = [cleanCode];
    } else if (status === 'SUSPENDED') {
      payload.blockedCodes = [cleanCode];
    }
    await syncFullStateToCloud(payload);
  } catch {
    // Silencieux
  }
}

// Vérification auprès du serveur Cloud si un code ou un appareil est révoqué
export async function checkRemoteRevocation(
  code: string,
  deviceId?: string
): Promise<{ isRevoked: boolean; reason?: string }> {
  const cleanCode = code.trim().toUpperCase();

  // 1. Vérification rapide locale (pour cet onglet)
  const localEvent = receivedRevocations.get(cleanCode);
  if (localEvent) {
    if (localEvent.status === 'SUSPENDED') {
      return { isRevoked: true, reason: 'Ce code a été suspendu par l’Administrateur.' };
    }
    if (localEvent.status === 'DELETED') {
      return { isRevoked: true, reason: 'Ce code a été supprimé par l’Administrateur.' };
    }
  }

  // 2. Vérification auprès de l'API Serveur Cloud (/api/sync)
  try {
    const url = `/api/sync?code=${encodeURIComponent(cleanCode)}${deviceId ? `&device_id=${encodeURIComponent(deviceId)}` : ''}`;
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' });

    if (res.ok) {
      const data = await res.json();
      if (data && data.authorized === false) {
        receivedRevocations.set(cleanCode, {
          status: data.status || 'DELETED',
          timestamp: Date.now(),
        });
        return {
          isRevoked: true,
          reason: data.reason || 'Ce code d’accès a été fermé par l’Administrateur.',
        };
      }
    }
  } catch {
    // Silencieux si hors-ligne
  }

  return { isRevoked: false };
}

// Écouteur en temps réel Cloud & Multi-Appareils (Interrogation du serveur API toutes les 1.5 secondes)
export function setupCrossDeviceSyncListener(
  onRevocationDetected: (revokedCode: string, reason: string) => void,
  getCurrentUserCodeFn?: () => string | null,
  getDeviceIdFn?: () => string | null
): () => void {
  const handleBroadcast = (event: MessageEvent) => {
    try {
      const data = event.data as RevocationEvent;
      if (data && data.code && (data.status === 'SUSPENDED' || data.status === 'DELETED')) {
        receivedRevocations.set(data.code, { status: data.status, timestamp: data.timestamp });
        const reason =
          data.status === 'SUSPENDED'
            ? 'Ce code a été suspendu par l’Administrateur.'
            : 'Ce code a été supprimé par l’Administrateur.';
        onRevocationDetected(data.code, reason);
      }
    } catch {
      // Silencieux
    }
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.addEventListener('message', handleBroadcast);
    } catch {
      // Silencieux
    }
  }

  const handleStorage = (e: StorageEvent) => {
    try {
      if (e.key === 'wague_last_revocation_event' && e.newValue) {
        const data = JSON.parse(e.newValue) as RevocationEvent;
        if (data && data.code && (data.status === 'SUSPENDED' || data.status === 'DELETED')) {
          receivedRevocations.set(data.code, { status: data.status, timestamp: data.timestamp });
          const reason =
            data.status === 'SUSPENDED'
              ? 'Ce code a été suspendu par l’Administrateur.'
              : 'Ce code a été supprimé par l’Administrateur.';
          onRevocationDetected(data.code, reason);
        }
      }
    } catch {
      // Silencieux
    }
  };

  try {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }
  } catch {
    // Silencieux
  }

  // Interrogation permanente du serveur Cloud API
  const cloudPollInterval = setInterval(async () => {
    try {
      const activeCode = getCurrentUserCodeFn ? getCurrentUserCodeFn() : null;
      if (!activeCode) return;

      const deviceId = getDeviceIdFn ? getDeviceIdFn() : undefined;
      const remoteCheck = await checkRemoteRevocation(activeCode, deviceId || undefined);

      if (remoteCheck.isRevoked) {
        onRevocationDetected(activeCode, remoteCheck.reason || 'Accès fermé par l’Administrateur.');
      }
    } catch {
      // Silencieux
    }
  }, 1500);

  return () => {
    clearInterval(cloudPollInterval);
    if (broadcastChannel) {
      try {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      } catch {
        // Silencieux
      }
    }
    try {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    } catch {
      // Silencieux
    }
  };
}
