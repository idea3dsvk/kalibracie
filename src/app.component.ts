import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Device, Calibration } from './device.model';
import { DeviceService } from './device.service';
import { AuthService } from './auth.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslationService, Language, Locale } from './translation.service';
import { TranslatePipe } from './translate.pipe';

declare var jspdf: any; // Import jsPDF library for PDF export

type DeviceStatus = 'valid' | 'due-soon' | 'overdue' | 'uncalibrated' | 'calibration-free';
type SortKey = 'name' | 'nextCalibrationDate' | 'status';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  providers: [DatePipe]
})
export class AppComponent {
  private deviceService = inject(DeviceService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);
  authService = inject(AuthService);
  translationService = inject(TranslationService);

  // Language
  supportedLanguages = [
    { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];
  showLangDropdown = signal(false);

  // Login
  loginError = signal<string | null>(null);
  loginForm = this.fb.group({
    username: ['admin', Validators.required],
    password: ['password', Validators.required]
  });

  // Modals
  showAddModal = signal(false);
  showCalibrateModal = signal(false);
  showHistoryModal = signal(false);
  deviceToCalibrate = signal<Device | null>(null);
  deviceForHistory = signal<Device | null>(null);
  nextCalibrationDatePreview = signal<string | null>(null);
  
  // UI State
  isDarkMode = signal(false);

  // Form helpers
  selectedFileBase64 = signal<string | undefined>(undefined);
  selectedCertificateBase64 = signal<string | undefined>(undefined);
  selectedCertificateFileName = signal<string | undefined>(undefined);

  // Data & Filtering & Sorting
  devices = this.deviceService.getDevices();
  searchTerm = signal('');
  selectedManufacturer = signal('all');
  selectedUsage = signal('all');
  sortConfig = signal<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });

  constructor() {
    // Set initial dark mode state, prioritizing stored preference
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedPreference = localStorage.getItem('darkMode');
        if (storedPreference !== null) {
            this.isDarkMode.set(storedPreference === 'true');
        } else {
            this.isDarkMode.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }

    effect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.classList.toggle('dark', this.isDarkMode());
            localStorage.setItem('darkMode', String(this.isDarkMode()));
        }
    });
  }
  
  // --- Language Methods ---
  switchLanguage(lang: Language): void {
    this.translationService.switchLanguage(lang);
    this.showLangDropdown.set(false);
  }

  // --- Auth Methods ---
  async handleLogin(): Promise<void> {
    if (this.loginForm.valid) {
      this.loginError.set(null);
      const { username, password } = this.loginForm.getRawValue();
      
      // V novej verzii používame email namiesto username
      // Pre kompatibilitu s demo účtami:
      const email = username!.includes('@') ? username! : `${username}@demo.com`;
      
      const result = await this.authService.login(email, password!);
      if (!result.success) {
        this.loginError.set(result.error || this.translationService.translate('login.error'));
      }
    }
  }

  async handleLogout(): Promise<void> {
    await this.authService.logout();
  }

  // --- Permissions ---
  canAddDevice = computed(() => this.authService.isAdmin());
  canCalibrate = computed(() => this.authService.isAdmin() || this.authService.isModerator());
  canDelete = computed(() => this.authService.isAdmin());

  // --- Helpers ---
  getLatestCalibration(device: Device): Calibration | undefined {
    if (!device.calibrationHistory || device.calibrationHistory.length === 0) {
      return undefined;
    }
    return [...device.calibrationHistory].sort((a, b) => new Date(b.calibrationDate).getTime() - new Date(a.calibrationDate).getTime())[0];
  }

  // Derived state for filters and display
  uniqueManufacturers = computed(() => {
    const manufacturers = this.devices().map(d => d.manufacturer).filter(Boolean);
    return [this.translationService.translate('controls.allManufacturers'), ...Array.from(new Set(manufacturers)).sort()];
  });

  uniqueUsages = computed(() => {
    const usages = this.devices().map(d => d.usage).filter(Boolean);
    return [this.translationService.translate('controls.allUsages'), ...Array.from(new Set(usages)).sort()];
  });

  displayedDevices = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const manufacturerKey = this.selectedManufacturer();
    const usageKey = this.selectedUsage();
    const sort = this.sortConfig();
    
    const manufacturer = manufacturerKey === 'all' ? 'all' : manufacturerKey;
    const usage = usageKey === 'all' ? 'all' : usageKey;

    let filtered = this.devices().filter(device =>
        (manufacturer === 'all' || device.manufacturer === manufacturer) &&
        (usage === 'all' || device.usage === usage) &&
        (
            device.name.toLowerCase().includes(term) ||
            device.serialNumber.toLowerCase().includes(term) ||
            device.manufacturer.toLowerCase().includes(term) ||
            device.model.toLowerCase().includes(term) ||
            device.usage.toLowerCase().includes(term) ||
            device.msnCode.toLowerCase().includes(term)
        )
    );

    const statusOrder: Record<DeviceStatus, number> = { overdue: 1, 'due-soon': 2, uncalibrated: 3, valid: 4, 'calibration-free': 5 };

    filtered.sort((a, b) => {
        let compareA: any;
        let compareB: any;

        switch(sort.key) {
            case 'name':
                compareA = a.name;
                compareB = b.name;
                return sort.direction === 'asc' ? compareA.localeCompare(compareB) : compareB.localeCompare(compareA);
            case 'nextCalibrationDate':
                const latestCalA = this.getLatestCalibration(a);
                const latestCalB = this.getLatestCalibration(b);
                compareA = latestCalA?.nextCalibrationDate ? new Date(latestCalA.nextCalibrationDate).getTime() : Infinity;
                compareB = latestCalB?.nextCalibrationDate ? new Date(latestCalB.nextCalibrationDate).getTime() : Infinity;
                return sort.direction === 'asc' ? compareA - compareB : compareB - compareA;
            case 'status':
                compareA = statusOrder[this.getDeviceStatus(a)];
                compareB = statusOrder[this.getDeviceStatus(b)];
                return sort.direction === 'asc' ? compareA - compareB : compareB - compareA;
        }
    });

    return filtered;
  });

  // Dashboard Stats
  statusCounts = computed(() => {
    return this.devices().reduce((acc, device) => {
        const status = this.getDeviceStatus(device);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<DeviceStatus, number>);
  });

  overdueCount = computed(() => this.statusCounts()['overdue'] || 0);
  
  dueSoonThisMonthCount = computed(() => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      return this.devices().filter(device => {
          const latestCal = this.getLatestCalibration(device);
          if (!latestCal?.nextCalibrationDate) return false;
          const nextCalDate = new Date(latestCal.nextCalibrationDate);
          return nextCalDate.getMonth() === currentMonth && nextCalDate.getFullYear() === currentYear && nextCalDate >= today;
      }).length;
  });

  chartData = computed(() => {
    const counts = this.statusCounts();
    const total = this.devices().length;
    if (total === 0) return [];

    const statusInfo: { status: DeviceStatus, key: string, classes: string }[] = [
      { status: 'valid', key: 'status.valid', classes: 'bg-green-500' },
      { status: 'due-soon', key: 'status.dueSoonShort', classes: 'bg-yellow-500' },
      { status: 'overdue', key: 'status.overdue', classes: 'bg-red-500' },
      { status: 'uncalibrated', key: 'status.uncalibratedShort', classes: 'bg-slate-500' },
      { status: 'calibration-free', key: 'status.calibrationFreeShort', classes: 'bg-blue-500' },
    ];
    
    return statusInfo.map(info => ({
      ...info,
      label: this.translationService.translate(info.key),
      count: counts[info.status] || 0,
      percentage: total > 0 ? ((counts[info.status] || 0) / total) * 100 : 0
    }));
  });

  // History Modal Data
  sortedHistory = computed(() => {
    const device = this.deviceForHistory();
    if (!device) return [];
    return [...device.calibrationHistory].sort((a, b) => new Date(b.calibrationDate).getTime() - new Date(a.calibrationDate).getTime());
  });

  deviceForm = this.fb.group({
    name: ['', Validators.required],
    serialNumber: ['', Validators.required],
    manufacturer: ['', Validators.required],
    model: ['', Validators.required],
    usage: ['', Validators.required],
    msnCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]-\d{2}-\d{2}-\d{4}$/)]],
  });

  calibrateForm = this.fb.group({
    calibrationDate: ['', Validators.required],
    calibrationPeriodInYears: [1, Validators.required]
  });
  
  toggleDarkMode(): void {
    this.isDarkMode.update(value => !value);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onManufacturerChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedManufacturer.set(select.value);
  }

  onUsageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedUsage.set(select.value);
  }

  setSort(key: SortKey): void {
    this.sortConfig.update(config => {
      if (config.key === key) {
        return { ...config, direction: config.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }

  getDeviceStatus(device: Device): DeviceStatus {
    const latestCal = this.getLatestCalibration(device);
    if (!latestCal) return 'uncalibrated';
    if (latestCal.calibrationPeriodInYears === 0) return 'calibration-free';
    if (!latestCal.nextCalibrationDate) return 'valid';
    const nextCalibration = new Date(latestCal.nextCalibrationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (nextCalibration < today) return 'overdue';
    if (nextCalibration <= thirtyDaysFromNow) return 'due-soon';
    return 'valid';
  }
  
  getStatusClasses(status: DeviceStatus): string {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'due-soon': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'uncalibrated': return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      case 'calibration-free': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  }

  getStatusText(status: DeviceStatus): string {
      switch (status) {
          case 'valid': return this.translationService.translate('status.valid');
          case 'due-soon': return this.translationService.translate('status.dueSoon');
          case 'overdue': return this.translationService.translate('status.overdue');
          case 'uncalibrated': return this.translationService.translate('status.uncalibrated');
          case 'calibration-free': return this.translationService.translate('status.calibrationFree');
      }
  }

  getPeriodText(years: number): string {
    if (years === 0) return this.translationService.translate('calibrate.period.free');
    const key = years === 1 ? 'general.year' : 'general.years';
    return this.translationService.translate(key);
  }

  openAddModal(): void {
    this.deviceForm.reset();
    this.selectedFileBase64.set(undefined);
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.selectedFileBase64.set(undefined);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.selectedFileBase64.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async addDevice(): Promise<void> {
    if (this.deviceForm.valid) {
      const formValue = this.deviceForm.getRawValue();
      try {
        await this.deviceService.addDevice({
            name: formValue.name!,
            serialNumber: formValue.serialNumber!,
            manufacturer: formValue.manufacturer!,
            model: formValue.model!,
            usage: formValue.usage!,
            msnCode: formValue.msnCode!.toUpperCase(),
            photoUrl: this.selectedFileBase64()
        });
        this.closeAddModal();
      } catch (err) {
        console.error('Error adding device:', err);
        alert(this.translationService.translate('general.errorSaving'));
      }
    } else {
      this.deviceForm.markAllAsTouched();
    }
  }

  openCalibrateModal(device: Device): void {
    this.deviceToCalibrate.set(device);
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const latestCal = this.getLatestCalibration(device);
    this.calibrateForm.reset({
      calibrationDate: today,
      calibrationPeriodInYears: latestCal?.calibrationPeriodInYears ?? 1,
    });
    this.selectedCertificateBase64.set(undefined);
    this.selectedCertificateFileName.set(undefined);
    this.updateNextCalibrationDatePreview();
    this.showCalibrateModal.set(true);
  }

  closeCalibrateModal(): void {
    this.showCalibrateModal.set(false);
    this.deviceToCalibrate.set(null);
    this.nextCalibrationDatePreview.set(null);
    this.selectedCertificateBase64.set(undefined);
    this.selectedCertificateFileName.set(undefined);
  }

  updateNextCalibrationDatePreview(): void {
    const formValue = this.calibrateForm.getRawValue();
    if (formValue.calibrationDate && formValue.calibrationPeriodInYears !== null) {
      const period = Number(formValue.calibrationPeriodInYears);
      if (period > 0) {
        const calDate = new Date(formValue.calibrationDate);
        const nextCalDate = new Date(calDate);
        nextCalDate.setFullYear(calDate.getFullYear() + period);
        this.nextCalibrationDatePreview.set(this.datePipe.transform(nextCalDate, 'dd.MM.yyyy', '', this.translationService.currentLocale()));
      } else {
        this.nextCalibrationDatePreview.set(this.translationService.translate('calibrate.notRequired'));
      }
    } else {
      this.nextCalibrationDatePreview.set(null);
    }
  }
  
  onCertificateFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert(this.translationService.translate('calibrate.pdfError'));
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.selectedCertificateBase64.set(e.target?.result as string);
        this.selectedCertificateFileName.set(file.name);
      };
      reader.readAsDataURL(file);
    }
  }
  
  getCertificateFileName(device: Device): string {
    const latestCal = this.getLatestCalibration(device);
    if (!latestCal?.calibrationCertificateUrl) return '';
    return latestCal.calibrationCertificateFileName || `Certificate_${device.name.replace(/\s+/g, '_')}_${device.serialNumber}.pdf`;
  }

  getHistoryCertificateFileName(calibration: Calibration, device: Device): string {
    return calibration.calibrationCertificateFileName || `Certificate_${device.name.replace(/\s+/g, '_')}_${new Date(calibration.calibrationDate).getFullYear()}.pdf`;
  }

  async submitCalibration(): Promise<void> {
    if (this.calibrateForm.valid) {
      const device = this.deviceToCalibrate();
      const formValue = this.calibrateForm.getRawValue();
      
      if (device && formValue.calibrationDate && formValue.calibrationPeriodInYears !== null) {
        try {
          await this.deviceService.calibrateDevice(device.id, {
            calibrationDate: formValue.calibrationDate,
            calibrationPeriodInYears: Number(formValue.calibrationPeriodInYears),
            calibrationCertificateUrl: this.selectedCertificateBase64(),
            calibrationCertificateFileName: this.selectedCertificateFileName(),
          });
          this.closeCalibrateModal();
        } catch (err) {
          console.error('Error calibrating device:', err);
          alert(this.translationService.translate('general.errorSaving'));
        }
      }
    } else {
      this.calibrateForm.markAllAsTouched();
    }
  }

  async deleteDevice(id: string): Promise<void> {
    if (confirm(this.translationService.translate('device.deleteConfirm'))) {
      try {
        await this.deviceService.deleteDevice(id);
      } catch (err) {
        console.error('Error deleting device:', err);
        alert(this.translationService.translate('general.errorDeleting'));
      }
    }
  }

  openHistoryModal(device: Device): void {
    this.deviceForHistory.set(device);
    this.showHistoryModal.set(true);
  }

  closeHistoryModal(): void {
    this.showHistoryModal.set(false);
    this.deviceForHistory.set(null);
  }

  exportToCSV(): void {
    const devicesToExport = this.displayedDevices();
    const headers = [
      this.translationService.translate('device.name'), 
      this.translationService.translate('device.serialNumber'), 
      this.translationService.translate('device.manufacturer'), 
      this.translationService.translate('device.model'), 
      this.translationService.translate('device.usage'), 
      this.translationService.translate('device.msnCode'), 
      this.translationService.translate('device.status'), 
      this.translationService.translate('history.calibrationDate'), 
      this.translationService.translate('history.validUntil')
    ];
    
    const csvRows = devicesToExport.map(device => {
      const latestCal = this.getLatestCalibration(device);
      const status = this.getStatusText(this.getDeviceStatus(device));
      const row = [
        device.name,
        device.serialNumber,
        device.manufacturer,
        device.model,
        device.usage,
        device.msnCode,
        status,
        latestCal ? this.datePipe.transform(latestCal.calibrationDate, 'dd.MM.yyyy', '', this.translationService.currentLocale()) : 'N/A',
        latestCal?.nextCalibrationDate ? this.datePipe.transform(latestCal.nextCalibrationDate, 'dd.MM.yyyy', '', this.translationService.currentLocale()) : 'N/A',
      ];
      return row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${this.translationService.translate('export.csvFilename')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private normalizeForPdf(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  exportToPDF(): void {
    const doc = new jspdf.jsPDF();
    const devicesToExport = this.displayedDevices();
    const head = [[
      this.translationService.translate('device.name'),
      this.translationService.translate('device.serialNumber'),
      this.translationService.translate('device.manufacturer'),
      this.translationService.translate('device.model'),
      this.translationService.translate('device.usage'),
      this.translationService.translate('device.status'),
      this.translationService.translate('history.validUntil')
    ]];

    const body = devicesToExport.map(device => {
      const latestCal = this.getLatestCalibration(device);
      const status = this.getStatusText(this.getDeviceStatus(device));
      return [
        this.normalizeForPdf(device.name),
        this.normalizeForPdf(device.serialNumber),
        this.normalizeForPdf(device.manufacturer),
        this.normalizeForPdf(device.model),
        this.normalizeForPdf(device.usage),
        this.normalizeForPdf(status),
        latestCal?.nextCalibrationDate ? this.datePipe.transform(latestCal.nextCalibrationDate, 'dd.MM.yyyy', '', this.translationService.currentLocale()) : 'N/A',
      ];
    });

    (doc as any).autoTable({
      head: head,
      body: body,
      styles: { font: "helvetica", fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`${this.translationService.translate('export.pdfFilename')}.pdf`);
  }
}