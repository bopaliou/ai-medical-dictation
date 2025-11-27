/**
 * Types centralisés pour l'application mobile
 * Exporte tous les types utilisés dans l'application
 */

// Types pour les patients
export interface Patient {
  id: string;
  full_name: string;
  age?: string;
  gender?: string;
  room_number?: string;
  unit?: string;
  dob?: string;
  created_at?: string;
}

export interface CreatePatientData {
  full_name: string;
  age?: string;
  gender?: 'M' | 'F' | 'Autre' | 'Non précisé' | string;
  room_number?: string;
  unit?: string;
  dob?: string;
}

export interface SearchPatientsResponse {
  ok: boolean;
  patients: Patient[];
}

export interface CreatePatientResponse {
  ok: boolean;
  patient: Patient;
}

// Types pour les notes
export interface Note {
  id: string;
  patient_id: string;
  created_by: string;
  created_at: string;
  recorded_at?: string;
  transcription_text?: string;
  structured_json?: any;
  pdf_url?: string;
  audio_url?: string;
  patients?: {
    full_name: string;
  };
}

export interface RecentNotesResponse {
  ok: boolean;
  notes: Note[];
}

// Types pour les rapports
export interface SOAPIEStructure {
  S?: string; // Subjective (Motif de consultation)
  O?: {
    vitals?: {
      temperature?: string;
      blood_pressure?: string;
      heart_rate?: string;
      respiratory_rate?: string;
      spo2?: string;
      glycemia?: string;
    };
    exam?: string;
    labs?: string;
    medications?: string[];
  };
  A?: string; // Assessment (Évaluation)
  I?: string[] | string; // Intervention
  E?: string; // Evaluation (Évaluation post-intervention)
  P?: string; // Plan
}

export interface StructuredJson {
  patient?: {
    full_name?: string;
    age?: string;
    gender?: string;
    room_number?: string;
    unit?: string;
  };
  soapie?: SOAPIEStructure;
}

export interface GeneratePDFRequest {
  note_id?: string;
  patient_id?: string;
  structured_json: StructuredJson;
  transcription?: string;
}

export interface GeneratePDFResponse {
  ok: boolean;
  pdf_url: string;
  note_id?: string;
  message?: string;
}

export interface Report {
  id: string;
  patient_id: string;
  pdf_url: string;
  created_at: string;
  recorded_at?: string;
  status: 'draft' | 'final' | 'trash';
  patient: {
    id: string;
    full_name: string;
    gender?: string;
    dob?: string;
  } | null;
}

export interface GetReportsResponse {
  ok: boolean;
  reports: Report[];
  count: number;
}

export interface ReportDetails {
  id: string;
  patient_id: string | null;
  pdf_url: string;
  created_at: string;
  recorded_at?: string;
  status: 'draft' | 'final' | 'trash';
  patient: {
    id: string | null;
    full_name: string;
    age: string | null;
    gender: string | null;
    room_number: string | null;
    unit: string | null;
  };
  soapie: {
    S?: string;
    O?: {
      vitals?: {
        temperature?: string;
        blood_pressure?: string;
        heart_rate?: string;
        respiratory_rate?: string;
        spo2?: string;
        glycemia?: string;
      };
      exam?: string;
      labs?: string;
      medications?: string[];
    };
    A?: string;
    I?: string[] | string;
    E?: string;
    P?: string;
  };
  transcription?: string;
}

export interface GetReportDetailsResponse {
  ok: boolean;
  report: ReportDetails;
}

