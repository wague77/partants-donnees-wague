/**
 * Service de gestion et suivi des appareils connectés en temps réel
 * Permet à l'Administrateur de vérifier tous les appareils connectés
 * et de les déconnecter individuellement ou globalement d'un simple clic.
 */

export interface ConnectedDevice {
  deviceId: string;
  code: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName: string;
  browser: string;
  os: string;
  firstConnectedAt: number;
  lastActiveAt: number;
  isOnline: boolean;
}

const STORAGE_KEYS = {
  DEVICE_ID: 'wague_current_device_id',
  CONNECTED_DEVICES: 'wague_connected_devices_list',
  FORCE_DISCONNECT_ALL: 'wague_force_disconnect_all_timestamp',
  FORCE_DISCONNECT_DEVICES: 'wague_force_disconnect_device_ids',
};

declare global {
  interface Window {
    __WAGUE_DEVICES_STORE__?: Record<string, string>;
  }
}

if (typeof window !== 'undefined' && !window.__WAGUE_DEVICES_STORE__) {
  window.__WAGUE_DEVICES_STORE__ = {};
}

function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const v = window.localStorage.getItem(key);
      if (v !== null && v !== undefined && v !== '') return v;
    }
  } catch {
    // Silencieux
  }

  try {
    if (typeof window !== 'undefined' && window.__WAGUE_DEVICES_STORE__) {
      const mem = window.__WAGUE_DEVICES_STORE__[key];
      if (mem) return mem;
    }
  } catch {
    // Silencieux
  }

  return null;
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Silencieux
  }

  try {
    if (typeof window !== 'undefined' && window.__WAGUE_DEVICES_STORE__) {
      window.__WAGUE_DEVICES_STORE__[key] = value;
    }
  } catch {
    // Silencieux
  }
}

/**
 * Obtient ou génère l'identifiant unique de cet appareil
 */
export function getOrCreateDeviceId(): string {
  let devId = safeGet(STORAGE_KEYS.DEVICE_ID);
  if (!devId) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    devId = `DEV-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    safeSet(STORAGE_KEYS.DEVICE_ID, devId);
  }
  return devId;
}

/**
 * Analyse les informations de l'appareil (Mobile, Tablette, PC)
 */
export function getDeviceInfo(): {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName: string;
  browser: string;
  os: string;
} {
  if (typeof navigator === 'undefined') {
    return {
      deviceType: 'desktop',
      deviceName: 'Appareil Web',
      browser: 'Navigateur',
      os: 'Système',
    };
  }

  const ua = navigator.userAgent || '';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iPhone|iPod/i.test(ua)) {
    deviceType = 'mobile';
  }

  let os = 'Système';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone/i.test(ua)) os = 'iPhone (iOS)';
  else if (/iPad/i.test(ua)) os = 'iPad (iPadOS)';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'Mac (macOS)';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Navigateur';
  if (/Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';

  const typeName =
    deviceType === 'mobile' ? 'Smartphone' : deviceType === 'tablet' ? 'Tablette' : 'Ordinateur';
  const deviceName = `${typeName} ${os} (${browser})`;

  return { deviceType, deviceName, browser, os };
}

/**
 * Récupère tous les appareils enregistrés
 */
export function getConnectedDevices(): ConnectedDevice[] {
  try {
    const raw = safeGet(STORAGE_KEYS.CONNECTED_DEVICES);
    if (!raw) return [];
    const list = JSON.parse(raw) as ConnectedDevice[];
    if (!Array.isArray(list)) return [];

    const now = Date.now();
    return list.map((dev) => ({
      ...dev,
      isOnline: now - dev.lastActiveAt < 45000,
    }));
  } catch {
    return [];
  }
}

/**
 * Sauvegarde la liste des appareils
 */
function saveConnectedDevices(devices: ConnectedDevice[]): void {
  try {
    safeSet(STORAGE_KEYS.CONNECTED_DEVICES, JSON.stringify(devices));
  } catch {
    // Silencieux
  }
}

/**
 * Enregistre ou met à jour le statut (battement de cœur) de l'appareil courant
 */
export function heartbeatCurrentDevice(activeCode: string): void {
  if (!activeCode || typeof window === 'undefined') return;

  const currentDevId = getOrCreateDeviceId();
  const info = getDeviceInfo();
  const now = Date.now();

  const devices = getConnectedDevices();
  const existingIdx = devices.findIndex((d) => d.deviceId === currentDevId);

  if (existingIdx !== -1) {
    devices[existingIdx].lastActiveAt = now;
    devices[existingIdx].code = activeCode.toUpperCase();
    devices[existingIdx].isOnline = true;
    devices[existingIdx].deviceName = info.deviceName;
    devices[existingIdx].deviceType = info.deviceType;
  } else {
    devices.unshift({
      deviceId: currentDevId,
      code: activeCode.toUpperCase(),
      deviceType: info.deviceType,
      deviceName: info.deviceName,
      browser: info.browser,
      os: info.os,
      firstConnectedAt: now,
      lastActiveAt: now,
      isOnline: true,
    });
  }

  const trimmed = devices.slice(0, 30);
  saveConnectedDevices(trimmed);
}

/**
 * Retire un appareil de la session quand il se déconnecte volontairement
 */
export function removeCurrentDeviceSession(): void {
  try {
    const currentDevId = getOrCreateDeviceId();
    const devices = getConnectedDevices();
    const filtered = devices.filter((d) => d.deviceId !== currentDevId);
    saveConnectedDevices(filtered);
  } catch {
    // Silencieux
  }
}

/**
 * ACTION ADMIN : Déconnecte un appareil spécifique
 */
export function disconnectDevice(deviceId: string): void {
  const devices = getConnectedDevices();
  const target = devices.find((d) => d.deviceId === deviceId);
  const updated = devices.filter((d) => d.deviceId !== deviceId);
  saveConnectedDevices(updated);

  try {
    const rawBlacklist = safeGet(STORAGE_KEYS.FORCE_DISCONNECT_DEVICES);
    let blacklist: string[] = rawBlacklist ? JSON.parse(rawBlacklist) : [];
    if (!blacklist.includes(deviceId)) {
      blacklist.push(deviceId);
      safeSet(STORAGE_KEYS.FORCE_DISCONNECT_DEVICES, JSON.stringify(blacklist.slice(-50)));
    }
  } catch {
    // Silencieux
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('wague_disconnect_device', { detail: { deviceId, code: target?.code } })
      );
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Silencieux
    }
  }
}

/**
 * ACTION ADMIN : Déconnecte TOUS les appareils clients connectés en un clic
 */
export function disconnectAllDevices(): void {
  const now = Date.now();
  safeSet(STORAGE_KEYS.FORCE_DISCONNECT_ALL, String(now));
  saveConnectedDevices([]);

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('wague_disconnect_all_devices', { detail: { timestamp: now } })
      );
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('wague_auth_changed'));
    } catch {
      // Silencieux
    }
  }
}

/**
 * ACTION ADMIN : Déconnecte tous les appareils utilisant un code spécifique
 */
export function disconnectAllDevicesWithCode(code: string): void {
  const cleanCode = code.trim().toUpperCase();
  const devices = getConnectedDevices();
  const matching = devices.filter((d) => d.code.toUpperCase() === cleanCode);

  matching.forEach((dev) => {
    disconnectDevice(dev.deviceId);
  });

  const remaining = devices.filter((d) => d.code.toUpperCase() !== cleanCode);
  saveConnectedDevices(remaining);

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('wague_disconnect_code', { detail: { code: cleanCode } })
      );
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('wague_auth_changed'));
    } catch {
      // Silencieux
    }
  }
}

/**
 * Vérifie si l'appareil courant a reçu un ordre de déconnexion de l'administrateur
 */
export function checkIfCurrentDeviceWasDisconnected(): {
  disconnected: boolean;
  reason?: string;
} {
  const currentDevId = getOrCreateDeviceId();

  try {
    const rawBlacklist = safeGet(STORAGE_KEYS.FORCE_DISCONNECT_DEVICES);
    if (rawBlacklist) {
      const blacklist: string[] = JSON.parse(rawBlacklist);
      if (blacklist.includes(currentDevId)) {
        return {
          disconnected: true,
          reason: 'Votre appareil a été déconnecté par l’Administrateur.',
        };
      }
    }
  } catch {
    // Silencieux
  }

  try {
    const forceAllRaw = safeGet(STORAGE_KEYS.FORCE_DISCONNECT_ALL);
    if (forceAllRaw) {
      const forceAllTime = Number(forceAllRaw);
      const lastSessionCheck = Number(safeGet('wague_last_session_accepted_time') || '0');
      if (forceAllTime > lastSessionCheck && Date.now() - forceAllTime < 600000) {
        return {
          disconnected: true,
          reason: 'Tous les appareils connectés ont été déconnectés par l’Administrateur.',
        };
      }
    }
  } catch {
    // Silencieux
  }

  return { disconnected: false };
}

/**
 * Marque l'acceptation de la session courante pour cet appareil
 */
export function markSessionAccepted(): void {
  safeSet('wague_last_session_accepted_time', String(Date.now()));
  try {
    const currentDevId = getOrCreateDeviceId();
    const raw = safeGet(STORAGE_KEYS.FORCE_DISCONNECT_DEVICES);
    if (raw) {
      const list: string[] = JSON.parse(raw);
      const filtered = list.filter((id) => id !== currentDevId);
      safeSet(STORAGE_KEYS.FORCE_DISCONNECT_DEVICES, JSON.stringify(filtered));
    }
  } catch {
    // Silencieux
  }
}
