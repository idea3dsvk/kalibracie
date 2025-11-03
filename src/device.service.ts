import { Injectable, signal, inject } from '@angular/core';
import { Device, Calibration } from './device.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly COLLECTION_NAME = 'devices';
  private firebaseService = inject(FirebaseService);
  private unsubscribe?: () => void;
  
  devices = signal<Device[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    // Načítaj zariadenia pri inicializácii
    this.loadDevicesFromFirestore();
  }

  private loadDevicesFromFirestore(): void {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Subscribe na real-time updates z Firestore
      this.unsubscribe = this.firebaseService.getCollection<Device>(
        this.COLLECTION_NAME,
        (devices) => {
          this.devices.set(devices);
          this.loading.set(false);
        }
      );
    } catch (err) {
      console.error('Error loading devices from Firestore:', err);
      this.error.set('Chyba pri načítaní zariadení z databázy');
      this.loading.set(false);
      // Fallback na LocalStorage ak Firestore zlyhá
      this.loadDevicesFromLocalStorage();
    }
  }

  private loadDevicesFromLocalStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedDevices = localStorage.getItem('calibratedDevices');
      if (storedDevices) {
        this.devices.set(JSON.parse(storedDevices));
      } else {
        this.devices.set(this.getInitialDummyData());
      }
    }
  }

  private async saveDeviceToFirestore(device: Device): Promise<void> {
    try {
      await this.firebaseService.setDocument(this.COLLECTION_NAME, device.id, device);
    } catch (err) {
      console.error('Error saving device to Firestore:', err);
      throw new Error('Chyba pri ukladaní zariadenia do databázy');
    }
  }

  getDevices() {
    return this.devices.asReadonly();
  }

  async addDevice(device: Omit<Device, 'id' | 'calibrationHistory'>): Promise<void> {
    const newDevice: Device = {
      ...device,
      id: crypto.randomUUID(),
      calibrationHistory: [],
    };
    
    try {
      await this.saveDeviceToFirestore(newDevice);
      // Neaktualizujeme lokálne - Firestore listener to urobí automaticky
    } catch (err) {
      console.error('Error adding device:', err);
      throw err;
    }
  }

  async calibrateDevice(id: string, calibrationData: { 
    calibrationDate: string; 
    calibrationPeriodInYears: number;
    calibrationCertificateUrl?: string;
    calibrationCertificateFileName?: string;
    calibrationLabelUrl?: string;
    calibrationLabelFileName?: string;
  }): Promise<void> {
    const device = this.devices().find(d => d.id === id);
    if (!device) {
      throw new Error('Zariadenie nenájdené');
    }

    let nextCalibrationDate: string | undefined = undefined;
    const period = Number(calibrationData.calibrationPeriodInYears);
    if (period > 0) {
      const calDate = new Date(calibrationData.calibrationDate);
      const nextCalDate = new Date(calDate);
      nextCalDate.setFullYear(calDate.getFullYear() + period);
      nextCalibrationDate = nextCalDate.toISOString();
    }

    const newCalibration: Calibration = {
      calibrationDate: new Date(calibrationData.calibrationDate).toISOString(),
      calibrationPeriodInYears: period,
      nextCalibrationDate: nextCalibrationDate,
      calibrationCertificateUrl: calibrationData.calibrationCertificateUrl,
      calibrationCertificateFileName: calibrationData.calibrationCertificateFileName,
      calibrationLabelUrl: calibrationData.calibrationLabelUrl,
      calibrationLabelFileName: calibrationData.calibrationLabelFileName,
    };

    const updatedDevice = {
      ...device,
      calibrationHistory: [...device.calibrationHistory, newCalibration],
    };

    try {
      await this.saveDeviceToFirestore(updatedDevice);
      // Neaktualizujeme lokálne - Firestore listener to urobí automaticky
    } catch (err) {
      console.error('Error calibrating device:', err);
      throw err;
    }
  }

  async deleteDevice(id: string): Promise<void> {
    try {
      await this.firebaseService.deleteDocument(this.COLLECTION_NAME, id);
      // Neaktualizujeme lokálne - Firestore listener to urobí automaticky
    } catch (err) {
      console.error('Error deleting device:', err);
      throw err;
    }
  }

  private getInitialDummyData(): Device[] {
    const today = new Date();
    
    return [
      {
        id: crypto.randomUUID(),
        name: 'Digitálny multimeter',
        serialNumber: 'SN-001A',
        manufacturer: 'Fluke',
        model: '87V',
        usage: 'Laboratórium A',
        msnCode: 'A-12-34-5678',
        calibrationHistory: [
          {
            calibrationDate: new Date(today.getFullYear() - 1, today.getMonth() - 6, 15).toISOString(),
            nextCalibrationDate: new Date(today.getFullYear(), today.getMonth() - 6, 15).toISOString(),
            calibrationPeriodInYears: 1,
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        name: 'Osciloskop',
        serialNumber: 'SN-002B',
        manufacturer: 'Tektronix',
        model: 'TBS1052B',
        usage: 'Výrobná linka 1',
        msnCode: 'B-23-45-6789',
        calibrationHistory: [
           {
            calibrationDate: new Date(today.getFullYear() -1, today.getMonth(), today.getDate() + 20).toISOString(),
            nextCalibrationDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20).toISOString(),
            calibrationPeriodInYears: 1,
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        name: 'Posuvné meradlo',
        serialNumber: 'SN-003C',
        manufacturer: 'Mitutoyo',
        model: 'CD-6" ASX',
        usage: 'Kontrola kvality',
        msnCode: 'C-34-56-7890',
        calibrationHistory: [
          {
            calibrationDate: new Date(today.getFullYear() -2, today.getMonth(), today.getDate() - 10).toISOString(),
            nextCalibrationDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10).toISOString(),
            calibrationPeriodInYears: 2,
          }
        ]
      }
    ];
  }
}
