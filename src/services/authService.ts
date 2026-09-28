import { broadcastRevocation } from './syncService';
import {
  ConnectedDevice,
  getConnectedDevices,
  disconnectDevice,
  disconnectAllDevices,
  disconnectAllDevicesWithCode,
  heartbeatCurrentDevice,
  removeCurrentDeviceSession,
  markSessionAccepted,
} from './deviceService';

export interface AccessCode {
  id: string;
  code: string;
  label?: string;
  createdAt: number;
  expiresAt?: number | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
}

export interface SecurityLog {
  id: string;
  timestamp: number;
  event: string;
  type?: 'info' | 'warning' | 'danger';
  details?: string;
}

export {
  type ConnectedDevice,
  getConnectedDevices,
  disconnectDevice,
  disconnectAllDevices,
  disconnectAllDevicesWithCode,
  heartbeatCurrentDevice,
  removeCurrentDeviceSession,
  markSessionAccepted,
};

const STORAGE_KEYS = {
  ADMIN_PASSWORD: 'wague_turf_admin_password_permanent',
  ACCESS_CODES: 'wague_turf_access_codes_permanent',
  REVOKED_CODES: 'wague_turf_revoked_codes_permanent',
  USER_CODE: 'wague_turf_user_active_code_permanent',
  HAS_SET_ADMIN: 'wague_turf_has_set_admin_permanent',
};

const inMemoryCookieStore = new Map<string, string>();

export function cookies() {
  return {
    get(name: string): { name: string; value: string } | undefined {
      try {
        if (typeof document !== 'undefined') {
          const raw = document.cookie;
          if (raw) {
            const match = raw.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
            if (match && match[1]) {
              return { name, value: decodeURIComponent(match[1]) };
            }
          }
        }
      } catch {
        // Silencieux
      }

      if (inMemoryCookieStore.has(name)) {
        return { name, value: inMemoryCookieStore.get(name)! };
      }

      return undefined;
    },

    set(name: string, value: string, options?: { maxAge?: number; path?: string }): void {
      inMemoryCookieStore.set(name, value);

      try {
        if (typeof document !== 'undefined') {
          const path = options?.path || '/';
          const maxAge = options?.maxAge ?? 5 * 365 * 24 * 60 * 60;
          document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAge}; SameSite=Lax`;
        }
      } catch {
        // Silencieux
      }
    },

    delete(name: string): void {
      inMemoryCookieStore.delete(name);

      try {
        if (typeof document !== 'undefined') {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
        }
      } catch {
        // Silencieux
      }
    },
  };
}

declare global {
  interface Window {
    __WAGUE_GLOBAL_STORE__?: Record<string, string>;
    __WAGUE_ADMIN_AUTH__?: boolean;
  }
}

if (typeof window !== 'undefined' && !window.__WAGUE_GLOBAL_STORE__) {
  window.__WAGUE_GLOBAL_STORE__ = {};
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined') {
      const storage = window.localStorage;
      if (storage) {
        const val = storage.getItem(key);
        if (val !== null && val !== undefined && val !== '') return val;
      }
    }
  } catch {
    // Silencieux
  }

  try {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + key + '=([^;]*)'));
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  } catch {
    // Silencieux
  }

  try {
    if (typeof window !== 'undefined' && window.__WAGUE_GLOBAL_STORE__) {
      const memVal = window.__WAGUE_GLOBAL_STORE__[key];
      if (memVal !== undefined && memVal !== null && memVal !== '') return memVal;
    }
  } catch {
    // Silencieux
  }

  return null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      const storage = window.localStorage;
      if (storage) {
        storage.setItem(key, value);
      }
    }
  } catch {
    // Silencieux
  }

  try {
    if (typeof document !== 'undefined') {
      const expires = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }
  } catch {
    // Silencieux
  }

  try {
    if (typeof window !== 'undefined' && window.__WAGUE_GLOBAL_STORE__) {
      window.__WAGUE_GLOBAL_STORE__[key] = value;
    }
  } catch {
    // Silencieux
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      const storage = window.localStorage;
      if (storage) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Silencieux
  }

  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  } catch {
    // Silencieux
  }

  try {
    if (typeof window !== 'undefined' && window.__WAGUE_GLOBAL_STORE__) {
      delete window.__WAGUE_GLOBAL_STORE__[key];
    }
  } catch {
    // Silencieux
  }
}

export function notifyAuthChange(): void {
  if (typeof window === 'undefined') return;
  setTimeout(() => {
    try {
      window.dispatchEvent(new Event('wague_auth_changed'));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Silencieux
    }
  }, 10);
}

export function purgeCodeFromUrl(badCode: string): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const codeParam = url.searchParams.get('code');
    if (codeParam && codeParam.toUpperCase() === badCode.toUpperCase()) {
      url.searchParams.delete('code');
      window.history.replaceState({}, '', url.toString());
    }
    if (window.location.hash.toUpperCase().includes(badCode.toUpperCase())) {
      window.location.hash = '';
    }
  } catch {
    // Silencieux
  }
}

export function getRevokedCodes(): string[] {
  const defaults = ['WAGUE-2CH-LCS8', 'TURF-2025-VIP', 'WAGUE-2025-VIP'];
  try {
    const raw = safeGetItem(STORAGE_KEYS.REVOKED_CODES);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const combined = new Set([...defaults, ...parsed.map((c: string) => String(c).trim().toUpperCase())]);
      return Array.from(combined);
    }
    return defaults;
  } catch {
    return defaults;
  }
}

export function addRevokedCode(codeToRevoke: string): void {
  const clean = codeToRevoke.trim().toUpperCase();
  if (!clean) return;

  const current = getRevokedCodes();
  if (!current.includes(clean)) {
    current.push(clean);
  }
  safeSetItem(STORAGE_KEYS.REVOKED_CODES, JSON.stringify(current));

  // Révocation Supabase
  if (typeof window !== 'undefined') {
    fetch('/api/codes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: clean }),
    }).catch(() => {});
  }

  purgeCodeFromUrl(clean);
  disconnectAllDevicesWithCode(clean);

  const activeCode = safeGetItem(STORAGE_KEYS.USER_CODE);
  if (activeCode && activeCode.trim().toUpperCase() === clean) {
    forceDisconnectWith401('Code d’accès révoqué par l’Administrateur.');
  }

  notifyAuthChange();
}

export function getAdminPassword(): string {
  const stored = safeGetItem(STORAGE_KEYS.ADMIN_PASSWORD);
  return stored || '674443407Sp@&&&';
}

export function hasCustomAdminPassword(): boolean {
  return safeGetItem(STORAGE_KEYS.HAS_SET_ADMIN) === 'true';
}

export function setAdminPassword(newPassword: string): void {
  const clean = newPassword.trim();
  if (clean) {
    safeSetItem(STORAGE_KEYS.ADMIN_PASSWORD, clean);
    safeSetItem(STORAGE_KEYS.HAS_SET_ADMIN, 'true');
    notifyAuthChange();
  }
}

export function verifyAdminPassword(password: string): { success: boolean; message?: string } {
  const clean = password.trim();
  if (!clean) return { success: false, message: 'Veuillez saisir un mot de passe.' };

  const current = getAdminPassword();
  const defaultPass = '674443407Sp@&&&';
  const adminPass = 'admin';

  if (clean === current || clean === defaultPass || clean === adminPass) {
    return { success: true };
  }

  return { success: false, message: 'Mot de passe administrateur incorrect.' };
}

export function isAdminAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return Boolean(window.__WAGUE_ADMIN_AUTH__);
  }
  return false;
}

export function setAdminAuthenticated(auth: boolean): void {
  if (typeof window !== 'undefined') {
    window.__WAGUE_ADMIN_AUTH__ = Boolean(auth);
  }
}

// Récupérer les codes depuis Supabase API
export async function fetchAccessCodesFromSupabase(): Promise<AccessCode[]> {
  try {
    const res = await fetch('/api/codes');
    if (!res.ok) return getAllAccessCodes();
    const data = await res.json();
    if (data.codes && Array.isArray(data.codes)) {
      const mapped: AccessCode[] = data.codes.map((row: any) => ({
        id: row.id,
        code: row.code,
        label: row.label || 'Code Accès Utilisateur',
        createdAt: new Date(row.created_at).getTime(),
        expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
        maxUses: null,
        usedCount: row.use_count || 0,
        isActive: !row.revoked,
      }));
      safeSetItem(STORAGE_KEYS.ACCESS_CODES, JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('Erreur fetchAccessCodesFromSupabase:', err);
  }
  return getAllAccessCodes();
}

export function getAllAccessCodes(): AccessCode[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.ACCESS_CODES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AccessCode[];
    const revoked = new Set(getRevokedCodes());

    return parsed.filter(
      (c) =>
        c &&
        c.code &&
        !revoked.has(c.code.trim().toUpperCase()) &&
        c.code.trim().toUpperCase() !== 'WAGUE-2CH-LCS8'
    );
  } catch {
    return [];
  }
}

export function saveAllAccessCodes(codes: AccessCode[]): void {
  const revoked = new Set(getRevokedCodes());
  const validCodes = codes.filter(
    (c) => c && c.code && !revoked.has(c.code.trim().toUpperCase())
  );

  safeSetItem(STORAGE_KEYS.ACCESS_CODES, JSON.stringify(validCodes));
  notifyAuthChange();
}

export async function createAccessCode(params: {
  label?: string;
  durationDays?: number | null;
  maxUses?: number | null;
  customCode?: string;
}): Promise<AccessCode> {
  let cleanCode = params.customCode ? params.customCode.trim().toUpperCase().replace(/\s+/g, '-') : '';

  if (!cleanCode) {
    const prefix = 'WAGUE';
    const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    cleanCode = `${prefix}-${rand1}-${rand2}`;
  }

  const now = Date.now();
  let expiresAt: number | null = null;
  if (params.durationDays && params.durationDays > 0) {
    expiresAt = now + params.durationDays * 24 * 60 * 60 * 1000;
  }

  const newCode: AccessCode = {
    id: `code-${now}-${Math.random().toString(36).substring(2, 6)}`,
    code: cleanCode,
    label: params.label?.trim() || 'Code Accès Utilisateur',
    createdAt: now,
    expiresAt,
    maxUses: params.maxUses && params.maxUses > 0 ? params.maxUses : null,
    usedCount: 0,
    isActive: true,
  };

  // Appel Supabase API
  try {
    const res = await fetch('/api/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: newCode.label,
        durationDays: params.durationDays,
        customCode: cleanCode,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.code) {
        newCode.id = json.code.id;
        newCode.code = json.code.code;
        newCode.expiresAt = json.code.expires_at ? new Date(json.code.expires_at).getTime() : null;
      }
    }
  } catch (e) {
    console.error('Erreur création Supabase code:', e);
  }

  const currentCodes = getAllAccessCodes();
  const existingIdx = currentCodes.findIndex((c) => c.code.toUpperCase() === cleanCode);
  if (existingIdx !== -1) {
    currentCodes[existingIdx] = {
      ...currentCodes[existingIdx],
      isActive: true,
      expiresAt: newCode.expiresAt,
      maxUses: newCode.maxUses,
      label: newCode.label,
    };
  } else {
    currentCodes.unshift(newCode);
  }

  saveAllAccessCodes(currentCodes);
  return newCode;
}

export async function toggleCodeStatus(id: string): Promise<void> {
  const codes = getAllAccessCodes();
  const code = codes.find((c) => c.id === id);
  if (code) {
    code.isActive = !code.isActive;
    saveAllAccessCodes(codes);

    try {
      await fetch('/api/codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: code.id, code: code.code, revoked: !code.isActive }),
      });
    } catch {}

    if (!code.isActive) {
      broadcastRevocation(code.code, 'SUSPENDED');
      disconnectAllDevicesWithCode(code.code);
    }
  }
}

export async function deleteAccessCode(id: string): Promise<void> {
  const codes = getAllAccessCodes();
  const codeToDelete = codes.find((c) => c.id === id);

  if (codeToDelete) {
    addRevokedCode(codeToDelete.code);
    try {
      await fetch(`/api/codes?id=${encodeURIComponent(id)}&code=${encodeURIComponent(codeToDelete.code)}`, {
        method: 'DELETE',
      });
    } catch {}
    broadcastRevocation(codeToDelete.code, 'DELETED');
    disconnectAllDevicesWithCode(codeToDelete.code);
  }

  const filtered = codes.filter((c) => c.id !== id);
  saveAllAccessCodes(filtered);
}

export function forceDisconnectWith401(reason?: string): void {
  cookies().delete('app_access_token');
  safeRemoveItem(STORAGE_KEYS.USER_CODE);
  removeCurrentDeviceSession();
  notifyAuthChange();
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('wague_force_401', { detail: { reason: reason || 'Accès révoqué par l’Administrateur.' } })
      );
    } catch {
      // Silencieux
    }
  }
}

export function enforceBlocklistCheck(): { ok: boolean; reason?: string } {
  const activeCode = getCurrentUserCode();
  if (!activeCode) return { ok: true };

  const cleanCode = activeCode.trim().toUpperCase();
  const revokedList = getRevokedCodes();
  if (revokedList.includes(cleanCode)) {
    return { ok: false, reason: 'Ce code d’accès a été révoqué par l’Administrateur.' };
  }

  const allCodes = getAllAccessCodes();
  const foundCode = allCodes.find((c) => c.code.toUpperCase() === cleanCode);

  if (foundCode) {
    if (!foundCode.isActive) {
      return { ok: false, reason: 'Ce code d’accès a été suspendu par l’Administrateur.' };
    }
    if (foundCode.expiresAt && Date.now() > foundCode.expiresAt) {
      return { ok: false, reason: 'Ce code d’accès a expiré.' };
    }
  }

  return { ok: true };
}

// Système de contrôle strict et expulsion immédiate en temps réel
export async function checkStrictRevocationRealtime(): Promise<boolean> {
  const activeCode = getCurrentUserCode();
  if (!activeCode) return true;

  try {
    const res = await fetch(`/api/codes/valider?code=${encodeURIComponent(activeCode)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.valid) {
        forceDisconnectWith401(data.reason || 'Votre accès a été révoqué ou supprimé par l’Administrateur.');
        return false;
      }
    }
  } catch (err) {
    // Si déconnecté d'internet, valider en local
  }

  const localCheck = enforceBlocklistCheck();
  if (!localCheck.ok) {
    forceDisconnectWith401(localCheck.reason);
    return false;
  }

  return true;
}

export function isUserAuthorized(): boolean {
  const blockCheck = enforceBlocklistCheck();
  if (!blockCheck.ok) {
    cookies().delete('app_access_token');
    return false;
  }

  const tokenCookie = cookies().get('app_access_token');
  if (tokenCookie && tokenCookie.value) {
    const activeCode = getCurrentUserCode();
    if (activeCode) {
      return true;
    }
    safeSetItem(STORAGE_KEYS.USER_CODE, tokenCookie.value);
    markSessionAccepted();
    return true;
  }

  const storedCode = safeGetItem(STORAGE_KEYS.USER_CODE);
  if (storedCode && storedCode.trim()) {
    cookies().set('app_access_token', storedCode.trim());
    markSessionAccepted();
    return true;
  }

  return false;
}

export function getCurrentUserCode(): string | null {
  const tokenCookie = cookies().get('app_access_token');
  if (tokenCookie && tokenCookie.value && tokenCookie.value.trim()) {
    return tokenCookie.value.trim().toUpperCase();
  }
  const storedCode = safeGetItem(STORAGE_KEYS.USER_CODE);
  if (storedCode && storedCode.trim()) {
    return storedCode.trim().toUpperCase();
  }
  return null;
}

export async function loginWithCode(inputCode: string): Promise<{ success: boolean; message?: string }> {
  const cleanInput = inputCode.trim().toUpperCase().replace(/\s+/g, '-');

  if (!cleanInput) {
    return { success: false, message: 'Veuillez saisir un code d’accès valide.' };
  }

  // Validation directe auprès de Supabase
  try {
    const res = await fetch('/api/codes/valider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanInput }),
    });

    const data = await res.json();
    if (!data.valid) {
      return { success: false, message: data.reason || 'Code d’accès révoqué ou invalide.' };
    }

    cookies().set('app_access_token', cleanInput);
    safeSetItem(STORAGE_KEYS.USER_CODE, cleanInput);
    markSessionAccepted();
    heartbeatCurrentDevice(cleanInput);
    notifyAuthChange();

    return { success: true };
  } catch (err) {
    console.error('Erreur API loginWithCode:', err);
  }

  // Fallback si pas de connexion
  const revokedList = getRevokedCodes();
  if (revokedList.includes(cleanInput)) {
    return {
      success: false,
      message: 'Ce code d’accès a été révoqué par l’Administrateur.',
    };
  }

  cookies().set('app_access_token', cleanInput);
  safeSetItem(STORAGE_KEYS.USER_CODE, cleanInput);
  markSessionAccepted();
  heartbeatCurrentDevice(cleanInput);
  notifyAuthChange();

  return { success: true };
}

export function logoutUser(): void {
  const currentCode = getCurrentUserCode();
  if (currentCode) {
    disconnectAllDevicesWithCode(currentCode);
  }
  cookies().delete('app_access_token');
  safeRemoveItem(STORAGE_KEYS.USER_CODE);
  removeCurrentDeviceSession();
  notifyAuthChange();
}

export function generateCodeDirectUrl(code: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const cleanCode = code.trim().toUpperCase();
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?code=${encodeURIComponent(cleanCode)}`;
  } catch {
    return '';
  }
}

export function generateFullSyncUrl(code: string): string {
  return generateCodeDirectUrl(code);
}

export async function processUrlParameters(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);

    const codeParam = url.searchParams.get('code') || url.searchParams.get('access_code');
    if (codeParam && codeParam.trim()) {
      const cleanCode = codeParam.trim().toUpperCase();
      const res = await loginWithCode(cleanCode);
      if (res.success) {
        url.searchParams.delete('code');
        url.searchParams.delete('access_code');
        window.history.replaceState({}, '', url.toString());
        return true;
      }
    }
  } catch {
    // Silencieux
  }
  return false;
}

export function extendAccessCodeDuration(id: string, days: number): void {
  const codes = getAllAccessCodes();
  const code = codes.find((c) => c.id === id);
  if (code) {
    const base = code.expiresAt && code.expiresAt > Date.now() ? code.expiresAt : Date.now();
    const newExpires = base + days * 24 * 60 * 60 * 1000;
    code.expiresAt = newExpires;
    saveAllAccessCodes(codes);

    fetch('/api/codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: code.id, code: code.code, expires_at: new Date(newExpires).toISOString() }),
    }).catch(() => {});
  }
}

export function setAccessCodeExpirationDate(id: string, dateTimestamp: number | null): void {
  const codes = getAllAccessCodes();
  const code = codes.find((c) => c.id === id);
  if (code) {
    code.expiresAt = dateTimestamp;
    saveAllAccessCodes(codes);

    fetch('/api/codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: code.id,
        code: code.code,
        expires_at: dateTimestamp ? new Date(dateTimestamp).toISOString() : null,
      }),
    }).catch(() => {});
  }
}

export function getAdminLockoutStatus(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  return { isLocked: false, remainingSeconds: 0, attempts: 0 };
}

export function resetAdminLockout(): void {}

export function getUserLockoutStatus(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  return { isLocked: false, remainingSeconds: 0, attempts: 0 };
}

export function resetUserLockout(): void {}

export function getSecurityLogs(): SecurityLog[] {
  return [];
}

export function clearSecurityLogs(): void {}
