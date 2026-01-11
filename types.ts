export interface Employee {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string; // Placeholder for UI
  hourlyRate: number; // Value per hour in currency
  overtimeRate: number; // Value per overtime hour
  dailyHours: number; // Contracted hours per day (e.g., 8, 6, 4)
}

export interface TimeLog {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: Date;
  type: 'IN' | 'OUT';
  photoBase64: string; // Stored captured image
  verificationMessage?: string; // From AI
  isVerified: boolean; // From AI
}

export enum AppState {
  IDLE = 'IDLE',
  ENTER_ID = 'ENTER_ID',
  CAMERA = 'CAMERA',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ADMIN = 'ADMIN'
}