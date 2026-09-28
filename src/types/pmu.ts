export interface Pari {
  codePari: string;
  nombreChevauxReglementaire?: number;
  ordrePari?: number;
}

export interface Course {
  numOrdre: number;
  numExterne?: number;
  libelle: string;
  heureDepart: number | string;
  distance: number;
  distanceUnit?: string;
  discipline: string;
  nombreDeclaresPartants: number;
  statut?: string;
  paris?: Pari[];
  montantTotalOffert?: number;
  dureeCourse?: number;
  conditions?: string;
}

export interface Hippodrome {
  code?: string;
  libelleCourt: string;
  libelleLong?: string;
}

export interface Reunion {
  numOfficiel: number;
  numExterne?: number;
  hippodrome: Hippodrome;
  nature?: string;
  pays?: {
    code?: string;
    libelle?: string;
  };
  courses: Course[];
  dateReunion?: number | string;
  statut?: string;
}

export interface ProgrammeResponse {
  programme: {
    date: number;
    reunions: Reunion[];
  };
}

export interface DernierRapportDirect {
  rapport: number;
  typeRapport?: string;
  indicateurTendance?: string;
  dateRapport?: number;
}

export interface Participant {
  numPmu: number;
  nom: string;
  age?: number;
  sexe?: string;
  driver?: string;
  entraineur?: string;
  statut: 'PARTANT' | 'NON_PARTANT' | string;
  musique?: string;
  dernierRapportDirect?: DernierRapportDirect;
  robe?: {
    libelleCourt?: string;
    libelleLong?: string;
  };
  proprietaire?: string;
  gainsParticipant?: {
    gainsCarriere?: number;
    gainsVictoires?: number;
    gainsPlace?: number;
    gainsAnneeEnCours?: number;
  };
  deferre?: string;
  oeilleres?: string;
  placeCorde?: number;
  handicapPoids?: number;
}

export interface ParticipantsResponse {
  participants: Participant[];
}

export interface SelectionPronostic {
  rang: number;
  num_partant: number;
  cote_prob?: number;
}

export interface PronosticsResponse {
  selection?: SelectionPronostic[];
  pronostics?: Array<{
    rang?: number;
    num_partant?: number;
    cote_prob?: number;
    nom?: string;
  }>;
}

export interface PronosticsDetaillesResponse {
  commentaire?: {
    texte?: string;
  };
  synthese?: string;
  texte?: string;
}

export interface BetCombination {
  code: string;
  name: string;
  count: number;
  horses: {
    num: number;
    nom?: string;
  }[];
}
