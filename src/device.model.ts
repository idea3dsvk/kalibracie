export interface Calibration {
  calibrationDate: string; // ISO string format
  nextCalibrationDate?: string; // ISO string format
  calibrationPeriodInYears: number;
  calibrationCertificateUrl?: string; // Base64 Data URL for PDF
  calibrationCertificateFileName?: string;
}

export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  usage: string;
  msnCode: string;
  photoUrl?: string; // Base64 Data URL
  calibrationHistory: Calibration[];
}

// User Management
export type UserRole = 'Admin' | 'Moderator' | 'User';

export interface User {
  username: string;
  password?: string; // Password is used for login check only, not stored in state
  role: UserRole;
}