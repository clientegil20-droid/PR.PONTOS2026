export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email?: string;
  phone?: string;
  cpf?: string;
  hireDate?: string;
  status: 'active' | 'inactive' | 'on_vacation';
  avatarUrl?: string;
  hourlyRate: number;
  overtimeRate: number;
  dailyHours: number;
  baseSalary?: number;
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