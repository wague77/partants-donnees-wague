'use client';

import React, { useState, useEffect } from 'react';
import {
  AccessCode,
  getAllAccessCodes,
  fetchAccessCodesFromSupabase,
  createAccessCode,
  toggleCodeStatus,
  deleteAccessCode,
  verifyAdminPassword,
  setAdminPassword,
  getAdminPassword,
  isAdminAuthenticated,
  setAdminAuthenticated,
  generateFullSyncUrl,
  generateCodeDirectUrl,
  ConnectedDevice,
  getConnectedDevices,
  disconnectDevice,
  disconnectAllDevices,
  extendAccessCodeDuration,
  setAccessCodeExpirationDate,
  getAdminLockoutStatus,
  resetAdminLockout,
  getUserLockoutStatus,
  resetUserLockout,
  getSecurityLogs,
  clearSecurityLogs,
  SecurityLog,
} from '../services/authService';
import {
  ShieldCheck,
  Lock,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Power,
  X,
  Clock,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Share2,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Radio,
  UserX,
  Calendar,
  Search,
  CheckCircle2,
  Ban,
  Activity,
  ShieldAlert,
  Sliders,
  ChevronRight,
  TrendingUp,
  History,
  Unlock,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodesUpdated?: () => void;
}

type TabType = 'overview' | 'codes' | 'create' | 'devices' | 'security';

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onCodesUpdated,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [adminLockout, setAdminLockout] = useState(() => getAdminLockoutStatus());
  const [userLockout, setUserLockout] = useState(() => getUserLockoutStatus());

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Codes & Appareils
  const [codes, setCodes] = useState<AccessCode[]>(() => getAllAccessCodes());
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>(() => getConnectedDevices());
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => getSecurityLogs());
  const [deviceActionMsg, setDeviceActionMsg] = useState<string | null>(null);

  // Recherche & Filtres codes
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'expired'>('all');

  // Copie d'éléments
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedDirectLinkId, setCopiedDirectLinkId] = useState<string | null>(null);
  const [syncCopied, setSyncCopied] = useState(false);

  // Formulaire création
  const [newLabel, setNewLabel] = useState('');
  const [newDuration, setNewDuration] = useState<number | ''>('');
  const [customExpirationDate, setCustomExpirationDate] = useState('');
  const [newMaxUses, setNewMaxUses] = useState<number | ''>('');
  const [customCode, setCustomCode] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Modal Modification Expiration
  const [editingCode, setEditingCode] = useState<AccessCode | null>(null);
  const [editDateValue, setEditDateValue] = useState('');

  // Mot de passe Admin
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [currentSavedPassword, setCurrentSavedPassword] = useState<string>(() => getAdminPassword());
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(isAdminAuthenticated());
      setCodes(getAllAccessCodes());
      fetchAccessCodesFromSupabase().then((data) => setCodes(data));
      setConnectedDevices(getConnectedDevices());
      setCurrentSavedPassword(getAdminPassword());
      setSecurityLogs(getSecurityLogs());
      setAdminLockout(getAdminLockoutStatus());
      setUserLockout(getUserLockoutStatus());

      const interval = setInterval(() => {
        setConnectedDevices(getConnectedDevices());
        setAdminLockout(getAdminLockoutStatus());
        setUserLockout(getUserLockoutStatus());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const refreshData = async () => {
    const listCodes = await fetchAccessCodesFromSupabase();
    setCodes(listCodes);
    setConnectedDevices(getConnectedDevices());
    setCurrentSavedPassword(getAdminPassword());
    setSecurityLogs(getSecurityLogs());
    setAdminLockout(getAdminLockoutStatus());
    setUserLockout(getUserLockoutStatus());
    onCodesUpdated?.();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const res = verifyAdminPassword(inputPassword);
    setAdminLockout(getAdminLockoutStatus());

    if (res.success) {
      setAdminAuthenticated(true);
      setIsAuthenticated(true);
      setInputPassword('');
      refreshData();
    } else {
      setAuthError(res.message || 'Mot de passe administrateur incorrect.');
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setInputPassword('');
  };

  const handleDisconnectSingleDevice = (deviceId: string, deviceName: string) => {
    if (window.confirm(`Voulez-vous déconnecter immédiatement cet appareil (${deviceName}) ?`)) {
      disconnectDevice(deviceId);
      setDeviceActionMsg(`Appareil ${deviceName} déconnecté avec succès.`);
      setConnectedDevices(getConnectedDevices());
      setTimeout(() => setDeviceActionMsg(null), 4000);
      onCodesUpdated?.();
    }
  };

  const handleDisconnectAllDevices = () => {
    if (
      window.confirm(
        '⚠️ Êtes-vous sûr de vouloir DÉCONNECTER TOUS LES APPAREILS CONNECTÉS ? Tous les utilisateurs en cours seront immédiatement expulsés vers la page de verrouillage.'
      )
    ) {
      disconnectAllDevices();
      setDeviceActionMsg('Tous les appareils ont été déconnectés avec succès !');
      setConnectedDevices([]);
      setTimeout(() => setDeviceActionMsg(null), 5000);
      onCodesUpdated?.();
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccessMessage(null);

    let durationDays: number | null = null;
    if (newDuration !== '') {
      durationDays = Number(newDuration);
    }

    const generated = await createAccessCode({
      label: newLabel || undefined,
      durationDays,
      maxUses: newMaxUses ? Number(newMaxUses) : null,
      customCode: customCode || undefined,
    });

    // Si une date personnalisée explicite a été choisie
    if (customExpirationDate) {
      const expTimestamp = new Date(customExpirationDate).getTime();
      if (!isNaN(expTimestamp)) {
        setAccessCodeExpirationDate(generated.id, expTimestamp);
      }
    }

    setNewLabel('');
    setNewDuration('');
    setCustomExpirationDate('');
    setNewMaxUses('');
    setCustomCode('');
    setFormSuccessMessage(`Code membre "${generated.code}" créé et enregistré avec succès !`);
    await refreshData();
    setActiveTab('codes');

    setTimeout(() => {
      setFormSuccessMessage(null);
    }, 5000);
  };

  const handleToggleStatus = async (codeId: string) => {
    await toggleCodeStatus(codeId);
    await refreshData();
  };

  const handleDelete = async (codeId: string) => {
    if (
      window.confirm(
        'Voulez-vous vraiment SUPPRIMER définitivement ce code d’accès ? Tous les appareils l’utilisant seront immédiatement déconnectés.'
      )
    ) {
      await deleteAccessCode(codeId);
      await refreshData();
    }
  };

  const handleExtendDuration = (codeId: string, days: number) => {
    extendAccessCodeDuration(codeId, days);
    refreshData();
  };

  const handleOpenEditExpiration = (code: AccessCode) => {
    setEditingCode(code);
    if (code.expiresAt) {
      // Format YYYY-MM-DDTHH:mm for datetime-local
      const date = new Date(code.expiresAt);
      const iso = date.toISOString().slice(0, 16);
      setEditDateValue(iso);
    } else {
      setEditDateValue('');
    }
  };

  const handleSaveExpirationDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;

    if (!editDateValue) {
      setAccessCodeExpirationDate(editingCode.id, null);
    } else {
      const timestamp = new Date(editDateValue).getTime();
      if (!isNaN(timestamp)) {
        setAccessCodeExpirationDate(editingCode.id, timestamp);
      }
    }

    setEditingCode(null);
    refreshData();
  };

  const handleCopyCode = (code: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
    } catch {
      // Silencieux
    }
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyDirectLink = (code: string, id: string) => {
    const link = generateCodeDirectUrl(code);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).catch(() => {});
      }
    } catch {
      // Silencieux
    }
    setCopiedDirectLinkId(id);
    setTimeout(() => setCopiedDirectLinkId(null), 2500);
  };

  const handleCopyFullSyncUrl = () => {
    const fullUrl = generateFullSyncUrl('');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl).catch(() => {});
      }
    } catch {
      // Silencieux
    }
    setSyncCopied(true);
    setTimeout(() => setSyncCopied(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg(null);

    const clean = newAdminPassword.trim();
    if (clean.length < 3) {
      setPasswordChangeMsg({
        text: 'Le mot de passe doit comporter au moins 3 caractères.',
        isError: true,
      });
      return;
    }

    if (clean !== confirmAdminPassword.trim()) {
      setPasswordChangeMsg({
        text: 'Les deux mots de passe saisis ne correspondent pas.',
        isError: true,
      });
      return;
    }

    setAdminPassword(clean);
    setCurrentSavedPassword(clean);
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    setPasswordChangeMsg({
      text: `Nouveau mot de passe Administrateur sauvegardé avec succès !`,
      isError: false,
    });

    setTimeout(() => setPasswordChangeMsg(null), 4000);
  };

  const handleResetAdminLock = () => {
    resetAdminLockout();
    refreshData();
  };

  const handleResetUserLock = () => {
    resetUserLockout();
    refreshData();
  };

  const handleClearLogs = () => {
    clearSecurityLogs();
    refreshData();
  };

  if (!isOpen) return null;

  const onlineDevices = connectedDevices.filter((d) => d.isOnline);
  const activeCodesCount = codes.filter(
    (c) => c.isActive && (!c.expiresAt || c.expiresAt > Date.now())
  ).length;
  const blockedCodesCount = codes.filter((c) => !c.isActive).length;
  const expiredCodesCount = codes.filter((c) => c.expiresAt && c.expiresAt <= Date.now()).length;

  // Filtrage des codes
  const filteredCodes = codes.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.label && c.label.toLowerCase().includes(searchQuery.toLowerCase()));

    const isExpired = c.expiresAt && Date.now() > c.expiresAt;
    if (statusFilter === 'active') return matchesSearch && c.isActive && !isExpired;
    if (statusFilter === 'blocked') return matchesSearch && !c.isActive;
    if (statusFilter === 'expired') return matchesSearch && isExpired;
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl bg-[#02140d] border border-amber-500/40 shadow-2xl overflow-hidden text-slate-100">
        {/* EN-TÊTE FIXE DU PORTAIL */}
        <header className="px-5 py-4 bg-gradient-to-r from-[#032115] via-[#021810] to-black border-b border-amber-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-lg shadow-amber-950/50">
              <div className="w-full h-full bg-[#021810] rounded-[14px] flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-cinzel text-amber-300 tracking-wide">
                  PORTAIL DE GESTION ADMINISTRATEUR
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                  Wague Turf V2.5
                </span>
              </div>
              <p className="text-xs text-emerald-400/80">
                Gestion avancée des abonnés, révocations, prolongations & sécurité anti-intrusion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/70 border border-red-800/50 text-red-300 hover:text-white hover:bg-red-900 text-xs font-bold transition-all shadow"
                title="Déconnexion Administrateur"
              >
                <Power className="w-3.5 h-3.5 text-red-400" />
                <span>Déconnexion</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-emerald-950/80 text-slate-300 hover:text-amber-300 hover:bg-emerald-900 border border-emerald-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* CONTENU PRINCIPAL MODAL */}
        {!isAuthenticated ? (
          /* FORMULAIRE DE CONNEXION ADMIN AVEC SÉCURITÉ 2 TENTATIVES */
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#032217]/90 border border-amber-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                {adminLockout.isLocked ? (
                  <ShieldAlert className="w-8 h-8 text-red-400 animate-bounce" />
                ) : (
                  <Lock className="w-8 h-8 text-amber-400" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-amber-200 font-cinzel">
                  Authentification Administrateur
                </h3>
                <p className="text-xs text-emerald-300/80 mt-1">
                  Accès sécurisé réservé à la gestion des accès Turf.
                </p>
              </div>

              {adminLockout.isLocked ? (
                <div className="p-4 rounded-2xl bg-red-950/90 border-2 border-red-500 text-left space-y-3 shadow-xl animate-pulse">
                  <div className="flex items-center gap-2 text-red-300 font-bold text-xs uppercase tracking-wide">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Sécurité Activée : 2 tentatives échouées</span>
                  </div>
                  <p className="text-xs text-red-200 leading-relaxed">
                    Le portail administrateur est <strong>bloqué pendant 5 minutes</strong> pour empêcher les tentatives d'intrusion.
                  </p>
                  <div className="pt-2 border-t border-red-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-red-300 font-medium">Déverrouillage dans :</span>
                    <span className="font-mono text-base font-black text-amber-300 bg-black/60 px-2.5 py-1 rounded-lg border border-amber-500/40">
                      {Math.floor(adminLockout.remainingSeconds / 60)}m {adminLockout.remainingSeconds % 60}s
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4 text-left">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                        Mot de passe Administrateur
                      </label>
                      <span className="text-[10px] text-amber-400/80 font-medium">
                        Max 2 tentatives
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Saisissez le mot de passe Admin..."
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        className="w-full bg-[#01140d] text-sm text-slate-100 placeholder-slate-500 px-4 py-3 rounded-xl border border-amber-500/40 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 pr-10 tracking-wide font-medium"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {authError && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 mt-2 italic flex items-center gap-1">
                      💡 Mot de passe initial : <code className="text-amber-300 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/20">admin</code>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-extrabold text-sm shadow-lg shadow-amber-950/50 hover:from-amber-300 hover:to-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>Déverrouiller l'Espace Admin</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* TABLEAU DE BORD DE GESTION COMPLETE ADMIN */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* BARRE D'ONGLETS DE NAVIGATION */}
            <nav className="px-4 py-2.5 bg-[#021810] border-b border-amber-500/20 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md'
                    : 'text-slate-300 hover:text-amber-300 hover:bg-emerald-950/80'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Aperçu & Stats</span>
              </button>

              <button
                onClick={() => setActiveTab('codes')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  activeTab === 'codes'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md'
                    : 'text-slate-300 hover:text-amber-300 hover:bg-emerald-950/80'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Codes & Abonnés ({codes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  activeTab === 'create'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md'
                    : 'text-slate-300 hover:text-amber-300 hover:bg-emerald-950/80'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Créer un Code</span>
              </button>

              <button
                onClick={() => setActiveTab('devices')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  activeTab === 'devices'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md'
                    : 'text-slate-300 hover:text-amber-300 hover:bg-emerald-950/80'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Appareils ({onlineDevices.length} en ligne)</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  activeTab === 'security'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md'
                    : 'text-slate-300 hover:text-amber-300 hover:bg-emerald-950/80'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Sécurité & Blocages</span>
                {(adminLockout.isLocked || userLockout.isLocked) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            </nav>

            {/* MESSAGE D'ALERTE ACTIONS RAPIDES */}
            {deviceActionMsg && (
              <div className="m-4 p-3.5 rounded-2xl bg-red-950/90 border border-red-500 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-pulse shrink-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{deviceActionMsg}</span>
                </div>
                <button
                  onClick={() => setDeviceActionMsg(null)}
                  className="text-slate-300 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* CORPS DE L'ONGLET SÉLECTIONNÉ */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* --- TAB 1: APERÇU & STATS --- */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Cartes de statistiques clés */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#032a1c] to-[#021810] border border-amber-500/30 shadow-lg">
                      <div className="flex items-center justify-between text-emerald-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Codes</span>
                        <Key className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-black text-amber-300">{codes.length}</div>
                      <p className="text-[11px] text-slate-400 mt-1">Codes générés au total</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#032a1c] to-[#021810] border border-emerald-500/40 shadow-lg">
                      <div className="flex items-center justify-between text-emerald-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Actifs</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-black text-emerald-300">{activeCodesCount}</div>
                      <p className="text-[11px] text-slate-400 mt-1">Accès fonctionnels</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#032a1c] to-[#021810] border border-red-500/40 shadow-lg">
                      <div className="flex items-center justify-between text-red-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Bloqués</span>
                        <Ban className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="text-2xl font-black text-red-300">{blockedCodesCount}</div>
                      <p className="text-[11px] text-slate-400 mt-1">Code(s) suspendu(s)</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#032a1c] to-[#021810] border border-amber-500/30 shadow-lg">
                      <div className="flex items-center justify-between text-amber-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">En Ligne</span>
                        <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                      </div>
                      <div className="text-2xl font-black text-amber-300">{onlineDevices.length}</div>
                      <p className="text-[11px] text-slate-400 mt-1">Appareil(s) en direct</p>
                    </div>
                  </div>

                  {/* Bannière d'accès direct synchronisé */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#033322] via-[#022116] to-[#01160d] border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                        <Share2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-amber-300">
                          Partager le Lien Membre Direct
                        </h4>
                        <p className="text-xs text-emerald-200/90 mt-0.5">
                          Envoyez ce lien aux membres pour une connexion instantanée sans avoir à saisir le code.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyFullSyncUrl}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 active:scale-95"
                    >
                      {syncCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Lien copié !</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          <span>Copier le lien synchronisé</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Raccourcis d'actions rapides */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-[#021b12] border border-emerald-800/60 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Action Rapide : Créer un abonné</span>
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Générez un nouveau code membre avec expiration personnalisée ou durée illimitée en 2 clics.
                      </p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="px-4 py-2 rounded-xl bg-emerald-950 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <span>Créer un code membre</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#021b12] border border-emerald-800/60 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Sécurité : Protection 2 tentatives</span>
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Chaque tentative incorrecte est bloquée après 2 erreurs. Vous pouvez débloquer manuellement si nécessaire.
                      </p>
                      <button
                        onClick={() => setActiveTab('security')}
                        className="px-4 py-2 rounded-xl bg-emerald-950 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <span>Gérer la sécurité</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 2: GESTION DES CODES & MEMBRES (BLOQUER, SUPPRIMER, PROLONGER, EDITER EXPIRATION) --- */}
              {activeTab === 'codes' && (
                <div className="space-y-4">
                  {/* BARRE DE RECHERCHE ET FILTRES DE STATUT */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#021b12] border border-amber-500/30">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher par code ou nom de bénéficiaire..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#01140d] text-xs text-slate-100 placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-emerald-800 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          statusFilter === 'all'
                            ? 'bg-amber-400 text-black'
                            : 'bg-emerald-950 text-slate-300 hover:text-amber-300'
                        }`}
                      >
                        Tous ({codes.length})
                      </button>
                      <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          statusFilter === 'active'
                            ? 'bg-amber-400 text-black'
                            : 'bg-emerald-950 text-slate-300 hover:text-amber-300'
                        }`}
                      >
                        Actifs ({activeCodesCount})
                      </button>
                      <button
                        onClick={() => setStatusFilter('blocked')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          statusFilter === 'blocked'
                            ? 'bg-amber-400 text-black'
                            : 'bg-emerald-950 text-slate-300 hover:text-amber-300'
                        }`}
                      >
                        Bloqués ({blockedCodesCount})
                      </button>
                      <button
                        onClick={() => setStatusFilter('expired')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          statusFilter === 'expired'
                            ? 'bg-amber-400 text-black'
                            : 'bg-emerald-950 text-slate-300 hover:text-amber-300'
                        }`}
                      >
                        Expirés ({expiredCodesCount})
                      </button>
                    </div>
                  </div>

                  {/* LISTE DES CODES MEMBRES */}
                  {filteredCodes.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#021810] border border-emerald-800/40 text-center text-xs text-slate-400 space-y-2">
                      <Key className="w-8 h-8 text-slate-600 mx-auto" />
                      <p>Aucun code d’accès ne correspond à votre filtre de recherche.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCodes.map((code) => {
                        const isExpired = code.expiresAt && Date.now() > code.expiresAt;
                        const isExhausted =
                          code.maxUses !== null &&
                          code.maxUses !== undefined &&
                          code.usedCount >= code.maxUses;
                        const isCopied = copiedCodeId === code.id;
                        const isDirectLinkCopied = copiedDirectLinkId === code.id;

                        return (
                          <div
                            key={code.id}
                            className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all shadow-md ${
                              !code.isActive
                                ? 'bg-red-950/40 border-red-900/60 text-slate-300'
                                : isExpired || isExhausted
                                ? 'bg-amber-950/20 border-amber-800/40'
                                : 'bg-[#021e14] border-amber-500/30 hover:border-amber-400/60'
                            }`}
                          >
                            {/* DETAILS CODE & LIBELLÉ */}
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="font-mono font-black text-sm sm:text-base text-amber-300 tracking-wider bg-black/50 px-3 py-2 rounded-xl border border-amber-500/40 flex items-center gap-2.5 shrink-0">
                                <span>{code.code}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(code.code, code.id)}
                                  className="p-1 rounded hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors"
                                  title="Copier le code"
                                >
                                  {isCopied ? (
                                    <Check className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>

                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-black text-slate-100 truncate">
                                    {code.label || 'Code d’accès membre'}
                                  </span>

                                  {!code.isActive ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                                      <Ban className="w-3 h-3 text-red-400" />
                                      <span>Bloqué / Suspendu</span>
                                    </span>
                                  ) : isExpired ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-400" />
                                      <span>Expiré</span>
                                    </span>
                                  ) : isExhausted ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
                                      Quota Atteint
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>Actif</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                                  <span>Créé le {new Date(code.createdAt).toLocaleDateString('fr-FR')}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-medium text-amber-300/90">
                                    <Calendar className="w-3 h-3" />
                                    Expiration :{' '}
                                    {code.expiresAt
                                      ? new Date(code.expiresAt).toLocaleString('fr-FR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : 'Illimitée (sans fin)'}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Utilisé : {code.usedCount} {code.maxUses ? `/ ${code.maxUses}` : 'fois'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* BOUTONS DE GESTION (BLOQUER, SUPPRIMER, PROLONGER, DATES) */}
                            <div className="flex flex-wrap items-center gap-2 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-emerald-900/50">
                              {/* Raccourcis de prolongation rapide */}
                              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-amber-500/20">
                                <span className="text-[10px] font-bold text-emerald-300 px-1.5 flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-amber-400" /> Prolonger:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleExtendDuration(code.id, 7)}
                                  className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-amber-300 hover:text-white text-[10px] font-black transition-colors"
                                  title="Prolonger de +7 jours"
                                >
                                  +7j
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExtendDuration(code.id, 30)}
                                  className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-amber-300 hover:text-white text-[10px] font-black transition-colors"
                                  title="Prolonger de +30 jours (1 mois)"
                                >
                                  +30j
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExtendDuration(code.id, 365)}
                                  className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-amber-300 hover:text-white text-[10px] font-black transition-colors"
                                  title="Prolonger de +1 an"
                                >
                                  +1an
                                </button>
                              </div>

                              {/* Modifier la date d'expiration */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditExpiration(code)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 hover:text-white hover:bg-emerald-900 flex items-center gap-1 transition-colors"
                                title="Définir une date d'expiration exacte"
                              >
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                <span>Changer date</span>
                              </button>

                              {/* Copier le lien direct */}
                              <button
                                type="button"
                                onClick={() => handleCopyDirectLink(code.code, code.id)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-950/70 border border-amber-500/40 text-amber-300 hover:bg-amber-900 flex items-center gap-1 transition-colors"
                                title="Copier le lien direct membre"
                              >
                                {isDirectLinkCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Lien copié</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>Lien membre</span>
                                  </>
                                )}
                              </button>

                              {/* Bloquer / Débloquer */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(code.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                  code.isActive
                                    ? 'bg-red-950/80 text-red-200 border-red-700/80 hover:bg-red-900 hover:text-white'
                                    : 'bg-emerald-950 text-emerald-300 border-emerald-600 hover:bg-emerald-900'
                                }`}
                                title={
                                  code.isActive
                                    ? 'Bloquer immédiatement le code et déconnecter tous ses appareils'
                                    : 'Débloquer et réactiver ce code'
                                }
                              >
                                {code.isActive ? 'Bloquer' : 'Débloquer'}
                              </button>

                              {/* Supprimer */}
                              <button
                                type="button"
                                onClick={() => handleDelete(code.id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/50 border border-transparent hover:border-red-900/60 transition-colors"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 3: CRÉER UN CODE D'ACCÈS --- */}
              {activeTab === 'create' && (
                <div className="p-6 rounded-3xl bg-[#021c13] border border-amber-500/30 space-y-6 shadow-xl">
                  <div className="flex items-center gap-3 pb-4 border-b border-emerald-900/60">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-amber-300 font-cinzel">
                        Création d'un Nouveau Code Membre
                      </h3>
                      <p className="text-xs text-emerald-300/80">
                        Générez des accès sur-mesure pour vos clients et abonnés Turf.
                      </p>
                    </div>
                  </div>

                  {formSuccessMessage && (
                    <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-lg">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{formSuccessMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleGenerateCode} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                          Bénéficiaire / Libellé
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Abonné VIP Jean Dupont"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          className="w-full bg-[#01140d] text-xs text-slate-100 placeholder-slate-500 px-4 py-3 rounded-xl border border-emerald-800 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                          Code Personnalisé (Optionnel)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: TURF-VIP-2026 (ou laisser vide)"
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value)}
                          className="w-full bg-[#01140d] text-xs text-amber-200 font-mono placeholder-slate-500 px-4 py-3 rounded-xl border border-emerald-800 focus:border-amber-400 focus:outline-none uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                          Durée Prédéfinie
                        </label>
                        <select
                          value={newDuration}
                          onChange={(e) => {
                            setNewDuration(e.target.value === '' ? '' : Number(e.target.value));
                            if (e.target.value !== '') setCustomExpirationDate('');
                          }}
                          className="w-full bg-[#01140d] text-xs text-slate-100 px-4 py-3 rounded-xl border border-emerald-800 focus:border-amber-400 focus:outline-none"
                        >
                          <option value="">Illimité (Accès permanent)</option>
                          <option value="1">1 jour (24 heures)</option>
                          <option value="7">7 jours (1 semaine)</option>
                          <option value="30">30 jours (1 mois)</option>
                          <option value="90">90 jours (3 mois)</option>
                          <option value="365">365 jours (1 an)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                          OU Date d'expiration Précise
                        </label>
                        <input
                          type="datetime-local"
                          value={customExpirationDate}
                          onChange={(e) => {
                            setCustomExpirationDate(e.target.value);
                            if (e.target.value) setNewDuration('');
                          }}
                          className="w-full bg-[#01140d] text-xs text-slate-100 px-4 py-3 rounded-xl border border-emerald-800 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                          Nombre d'utilisations autorisées
                        </label>
                        <select
                          value={newMaxUses}
                          onChange={(e) => setNewMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-[#01140d] text-xs text-slate-100 px-4 py-3 rounded-xl border border-emerald-800 focus:border-amber-400 focus:outline-none"
                        >
                          <option value="">Utilisations Illimitées (Multi-appareils)</option>
                          <option value="1">1 seule fois</option>
                          <option value="2">2 fois</option>
                          <option value="5">5 fois</option>
                          <option value="10">10 fois</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black text-sm shadow-xl hover:from-amber-300 hover:to-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>Générer & Enregistrer le Code Membre</span>
                    </button>
                  </form>
                </div>
              )}

              {/* --- TAB 4: SURVEILLANCE APPAREILS --- */}
              {activeTab === 'devices' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#021c13] border-2 border-emerald-500/50 shadow-lg">
                    <div className="flex items-center gap-3">
                      <Radio className="w-6 h-6 text-emerald-400 animate-pulse shrink-0" />
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wide flex items-center gap-2">
                          <span>Surveillance Temps Réel des Appareils</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-bold">
                            {onlineDevices.length} connecté(s)
                          </span>
                        </h3>
                        <p className="text-xs text-emerald-300/80">
                          Consultez la liste des téléphones et PC connectés au site en ce moment même.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDisconnectAllDevices}
                      className="px-4 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/60 text-red-200 hover:text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 shrink-0"
                    >
                      <Power className="w-4 h-4" />
                      <span>Déconnecter TOUS les appareils</span>
                    </button>
                  </div>

                  {connectedDevices.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#01140d] border border-emerald-900/60 text-center text-xs text-slate-400">
                      Aucun appareil connecté. Dès qu'un membre se connecte avec un code, son appareil apparaîtra ici.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {connectedDevices.map((dev) => {
                        const elapsedSec = Math.floor((Date.now() - dev.lastActiveAt) / 1000);
                        const isVeryRecent = elapsedSec < 60;

                        return (
                          <div
                            key={dev.deviceId}
                            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-all ${
                              dev.isOnline
                                ? 'bg-[#022418] border-emerald-500/40 shadow-md'
                                : 'bg-slate-900/40 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                                  dev.isOnline
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {dev.deviceType === 'mobile' ? (
                                  <Smartphone className="w-5 h-5" />
                                ) : dev.deviceType === 'tablet' ? (
                                  <Tablet className="w-5 h-5" />
                                ) : (
                                  <Monitor className="w-5 h-5" />
                                )}
                              </div>

                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                                    {dev.deviceName}
                                  </span>

                                  {dev.isOnline ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                      En ligne
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                                      Inactif
                                    </span>
                                  )}

                                  <span className="font-mono text-xs font-bold text-amber-300 bg-black/50 px-2 py-0.5 rounded-lg border border-amber-500/30">
                                    {dev.code}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-400">
                                  Connecté le {new Date(dev.firstConnectedAt).toLocaleTimeString('fr-FR')} •{' '}
                                  {isVeryRecent ? (
                                    <span className="text-emerald-300 font-semibold">Actif à l'instant</span>
                                  ) : (
                                    `Dernière activité il y a ${Math.floor(elapsedSec / 60)} min`
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleDisconnectSingleDevice(dev.deviceId, dev.deviceName)}
                                className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                              >
                                <UserX className="w-3.5 h-3.5 text-red-400" />
                                <span>Expulser cet appareil</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 5: SÉCURITÉ & PROTECTION BLOCAGE 2 TENTATIVES --- */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* PROTECTION BLOCAGE 2 TENTATIVES */}
                  <div className="p-6 rounded-3xl bg-[#021c13] border border-amber-500/40 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3 pb-3 border-b border-emerald-900/60">
                      <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
                      <div>
                        <h3 className="text-base font-black text-amber-300 font-cinzel">
                          Système Anti-Intrusion (Blocage après 2 tentatives)
                        </h3>
                        <p className="text-xs text-emerald-300/80">
                          Supervision automatique des tentatives de connexion invalides.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* STATUT LOCKOUT ADMIN */}
                      <div className="p-4 rounded-2xl bg-[#01140d] border border-emerald-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                          <span>Sécurité Espace Administrateur</span>
                          <span className="font-mono text-emerald-400">{adminLockout.attempts}/2 tentatives</span>
                        </div>
                        {adminLockout.isLocked ? (
                          <div className="p-3 rounded-xl bg-red-950 border border-red-500 text-red-200 text-xs font-bold flex items-center justify-between">
                            <span>🔒 Bloqué pendant {adminLockout.remainingSeconds}s</span>
                            <button
                              type="button"
                              onClick={handleResetAdminLock}
                              className="px-2 py-1 rounded bg-amber-400 text-black font-extrabold text-[10px]"
                            >
                              Débloquer
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Accès Admin normal (aucun blocage)</span>
                          </div>
                        )}
                      </div>

                      {/* STATUT LOCKOUT USER */}
                      <div className="p-4 rounded-2xl bg-[#01140d] border border-emerald-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                          <span>Sécurité Espace Membre</span>
                          <span className="font-mono text-emerald-400">{userLockout.attempts}/2 tentatives</span>
                        </div>
                        {userLockout.isLocked ? (
                          <div className="p-3 rounded-xl bg-red-950 border border-red-500 text-red-200 text-xs font-bold flex items-center justify-between">
                            <span>🔒 Bloqué pendant {userLockout.remainingSeconds}s</span>
                            <button
                              type="button"
                              onClick={handleResetUserLock}
                              className="px-2 py-1 rounded bg-amber-400 text-black font-extrabold text-[10px]"
                            >
                              Débloquer
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Accès Membre normal (aucun blocage)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MODIFICATION MOT DE PASSE ADMIN */}
                  <div className="p-6 rounded-3xl bg-[#021810] border border-amber-500/30 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
                      <h4 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Changer le mot de passe Administrateur</span>
                      </h4>
                      <div className="text-xs text-slate-400">
                        Mot de passe actuel :{' '}
                        <span className="font-mono text-amber-300 font-bold bg-black/40 px-2 py-1 rounded-lg border border-amber-500/30">
                          {currentSavedPassword}
                        </span>
                      </div>
                    </div>

                    {passwordChangeMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold ${
                          passwordChangeMsg.isError
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {passwordChangeMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="bg-[#01140d] text-xs text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl border border-emerald-800 focus:border-amber-400 focus:outline-none"
                      />
                      <input
                        type="password"
                        placeholder="Confirmer mot de passe"
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        className="bg-[#01140d] text-xs text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl border border-emerald-800 focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs transition-colors shadow-md"
                      >
                        Sauvegarder le Mot de Passe
                      </button>
                    </form>
                  </div>

                  {/* JOURNAL DES ÉVÉNEMENTS DE SÉCURITÉ */}
                  <div className="p-6 rounded-3xl bg-[#021810] border border-emerald-800/60 space-y-3">
                    <div className="flex items-center justify-between pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <History className="w-4 h-4 text-amber-400" />
                        <span>Journal d'activités & alertes de sécurité ({securityLogs.length})</span>
                      </h4>
                      {securityLogs.length > 0 && (
                        <button
                          onClick={handleClearLogs}
                          className="text-[11px] text-slate-400 hover:text-red-300 transition-colors"
                        >
                          Effacer le journal
                        </button>
                      )}
                    </div>

                    {securityLogs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Aucune alerte récente enregistrée.</p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {securityLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                              log.type === 'danger'
                                ? 'bg-red-950/50 border-red-800/80 text-red-200'
                                : log.type === 'warning'
                                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                                : 'bg-[#01140d] border-emerald-800 text-emerald-200'
                            }`}
                          >
                            <span>{log.event}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DÉFINITION EXPLICITE DE LA DATE D'EXPIRATION */}
      {editingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#021810] border border-amber-500/50 space-y-4 text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
              <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Modifier la date d'expiration</span>
              </h4>
              <button
                onClick={() => setEditingCode(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Code concerné : <strong className="text-amber-300 font-mono">{editingCode.code}</strong> ({editingCode.label})
            </p>

            <form onSubmit={handleSaveExpirationDate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                  Nouvelle date et heure d'expiration
                </label>
                <input
                  type="datetime-local"
                  value={editDateValue}
                  onChange={(e) => setEditDateValue(e.target.value)}
                  className="w-full bg-[#01140d] text-xs text-slate-100 px-4 py-3 rounded-xl border border-emerald-800 focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1 italic">
                  Laissez vide pour rendre le code illimité (sans expiration).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCode(null)}
                  className="px-4 py-2 rounded-xl bg-emerald-950 text-slate-300 text-xs font-bold hover:bg-emerald-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs font-black hover:from-amber-300 hover:to-amber-500 shadow-md"
                >
                  Sauvegarder la date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
