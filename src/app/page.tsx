'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  isUserAuthorized,
  getCurrentUserCode,
  logoutUser,
  forceDisconnectWith401,
  enforceBlocklistCheck,
  cookies,
  processUrlParameters,
  heartbeatCurrentDevice,
  checkStrictRevocationRealtime,
} from '../services/authService';
import {
  checkIfCurrentDeviceWasDisconnected,
} from '../services/deviceService';
import {
  setupCrossDeviceSyncListener,
} from '../services/syncService';
import { AccessGate } from '../components/AccessGate';
import { Dashboard } from '../components/Dashboard';
import { AdminModal } from '../components/AdminModal';

export default function Home() {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [userActiveCode, setUserActiveCode] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [revocationAlert, setRevocationAlert] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const checkStatus = useCallback(async () => {
    const blockCheck = enforceBlocklistCheck();
    if (!blockCheck.ok) {
      cookies().delete('app_access_token');
      setIsAuthorized(false);
      setUserActiveCode(null);
      setRevocationAlert('401 Non autorisé : Ce code a été révoqué par l’Administrateur.');
      return;
    }

    const deviceCheck = checkIfCurrentDeviceWasDisconnected();
    if (deviceCheck.disconnected) {
      forceDisconnectWith401(deviceCheck.reason || 'Appareil révoqué.');
      setIsAuthorized(false);
      setUserActiveCode(null);
      setRevocationAlert('401 Non autorisé : Votre appareil a été déconnecté par l’Administrateur.');
      return;
    }

    const isStrictValid = await checkStrictRevocationRealtime();
    if (!isStrictValid) {
      setIsAuthorized(false);
      setUserActiveCode(null);
      setRevocationAlert('401 Non autorisé : Votre accès a été révoqué ou supprimé dans la base Supabase.');
      return;
    }

    const authorized = isUserAuthorized();
    if (!authorized) {
      cookies().delete('app_access_token');
      setIsAuthorized(false);
      setUserActiveCode(null);
    } else {
      const code = getCurrentUserCode();
      setUserActiveCode(code);
      setIsAuthorized(true);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);

    processUrlParameters();
    checkStatus();

    const handleAuthChange = () => checkStatus();
    const handleStorageChange = () => checkStatus();

    const handleForce401 = (e: Event) => {
      const customEv = e as CustomEvent<{ reason?: string }>;
      setIsAuthorized(false);
      setUserActiveCode(null);
      setRevocationAlert(customEv.detail?.reason || '401 Unauthorized : Session immédiatement fermée.');
    };

    const handleDisconnectDevice = (e: Event) => {
      const customEv = e as CustomEvent<{ deviceId?: string; code?: string }>;
      const devCheck = checkIfCurrentDeviceWasDisconnected();
      if (devCheck.disconnected) {
        forceDisconnectWith401(devCheck.reason);
        setIsAuthorized(false);
        setUserActiveCode(null);
        setRevocationAlert('401 Non autorisé : Cet appareil a été déconnecté par l’Administrateur.');
      }
    };

    const handleDisconnectAll = () => {
      forceDisconnectWith401('Tous les appareils ont été déconnectés par l’Administrateur.');
      setIsAuthorized(false);
      setUserActiveCode(null);
      setRevocationAlert('401 Non autorisé : Déconnexion générale déclenchée par l’Administrateur.');
    };

    const handleDisconnectCode = (e: Event) => {
      const customEv = e as CustomEvent<{ code?: string }>;
      const currentCode = getCurrentUserCode();
      if (currentCode && customEv.detail?.code && currentCode.toUpperCase() === customEv.detail.code.toUpperCase()) {
        forceDisconnectWith401('Ce code d’accès a été suspendu ou révoqué par l’Administrateur.');
        setIsAuthorized(false);
        setUserActiveCode(null);
        setRevocationAlert('401 Non autorisé : Ce code a été révoqué par l’Administrateur.');
      }
    };

    window.addEventListener('wague_auth_changed', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wague_force_401', handleForce401);
    window.addEventListener('wague_disconnect_device', handleDisconnectDevice);
    window.addEventListener('wague_disconnect_all_devices', handleDisconnectAll);
    window.addEventListener('wague_disconnect_code', handleDisconnectCode);

    const cleanupSync = setupCrossDeviceSyncListener((revokedCode, reason) => {
      const currentCode = getCurrentUserCode();
      if (currentCode && currentCode.toUpperCase() === revokedCode.toUpperCase()) {
        forceDisconnectWith401(reason);
        setIsAuthorized(false);
        setUserActiveCode(null);
        setRevocationAlert(`401 Non autorisé : ${reason}`);
      }
    });

    const interval = setInterval(() => {
      checkStatus();
    }, 2500);

    return () => {
      window.removeEventListener('wague_auth_changed', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wague_force_401', handleForce401);
      window.removeEventListener('wague_disconnect_device', handleDisconnectDevice);
      window.removeEventListener('wague_disconnect_all_devices', handleDisconnectAll);
      window.removeEventListener('wague_disconnect_code', handleDisconnectCode);
      cleanupSync();
      clearInterval(interval);
    };
  }, [checkStatus]);

  useEffect(() => {
    if (!isAuthorized || !userActiveCode) return;

    heartbeatCurrentDevice(userActiveCode);

    const interval = setInterval(() => {
      heartbeatCurrentDevice(userActiveCode);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthorized, userActiveCode]);

  const handleLogout = () => {
    logoutUser();
    setIsAuthorized(false);
    setUserActiveCode(null);
    setRevocationAlert(null);
  };

  const handleAccessSuccess = () => {
    setRevocationAlert(null);
    checkStatus();
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#021c13] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#021c13] text-slate-100 flex flex-col selection:bg-amber-400 selection:text-black">
      {revocationAlert && (
        <div className="bg-red-950/90 border-b border-red-500/80 px-4 py-3 text-center text-xs font-bold text-red-200 flex items-center justify-center gap-2 shadow-lg z-50">
          <span>{revocationAlert}</span>
          <button
            onClick={() => setRevocationAlert(null)}
            className="ml-2 px-2 py-0.5 rounded bg-red-900 hover:bg-red-800 text-white text-[10px]"
          >
            Fermer
          </button>
        </div>
      )}

      {!isAuthorized ? (
        <AccessGate
          onSuccess={handleAccessSuccess}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
        />
      ) : (
        <Dashboard
          userActiveCode={userActiveCode}
          onLogout={handleLogout}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
        />
      )}

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onCodesUpdated={() => checkStatus()}
      />
    </div>
  );
}
