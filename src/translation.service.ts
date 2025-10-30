import { Injectable, signal } from '@angular/core';

export type Language = 'sk' | 'en' | 'de';
export type Locale = 'sk' | 'en' | 'de';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly LANG_STORAGE_KEY = 'currentLanguage';
  private translations: Record<Language, any> = {
    sk: {
      "general": {
        "save": "Uložiť",
        "cancel": "Zrušiť",
        "close": "Zavrieť",
        "year": "rok",
        "years": "roky",
        "noDevicesFound": "Nenašli sa žiadne zariadenia",
        "noDevicesHint": "Skúste zmeniť filter alebo pridajte nové zariadenie."
      },
      "login": {
        "title": "Evidencia kalibrácií",
        "subtitle": "Prosím, prihláste sa pre pokračovanie.",
        "username": "Používateľské meno",
        "usernamePlaceholder": "admin / moderator / user",
        "password": "Heslo",
        "passwordPlaceholder": "password",
        "loginButton": "Prihlásiť sa",
        "error": "Nesprávne meno alebo heslo.",
        "demoAccounts": "Demo účty"
      },
      "header": {
        "title": "Evidencia kalibrácií",
        "logout": "Odhlásiť sa",
        "addDevice": "Pridať zariadenie"
      },
      "dashboard": {
        "title": "Prehľad",
        "overdue": "Po termíne",
        "dueSoonThisMonth": "Končí tento mesiac",
        "deviceStatus": "Stav zariadení"
      },
      "controls": {
        "searchPlaceholder": "Hľadať zariadenie...",
        "allManufacturers": "Všetci výrobcovia",
        "allUsages": "Všetky použitia",
        "sortBy": {
          "label": "Zoradiť",
          "name": "Názov",
          "status": "Stav",
          "validity": "Platnosť"
        }
      },
      "device": {
        "name": "Názov",
        "serialNumber": "Sériové číslo",
        "manufacturer": "Výrobca",
        "model": "Model",
        "usage": "Použitie",
        "msnCode": "MSN kód",
        "status": "Stav",
        "photo": "Fotografia zariadenia",
        "validUntil": "Platnosť do",
        "downloadCertificate": "Stiahnuť certifikát",
        "calibrateButton": "Kalibrovať",
        "deleteConfirm": "Naozaj chcete odstrániť toto zariadenie?"
      },
      "status": {
        "valid": "Platná",
        "dueSoon": "Končí platnosť",
        "overdue": "Neplatná",
        "uncalibrated": "Nekalibrované",
        "calibrationFree": "Kalibrácia nie je potrebná",
        "validShort": "Platná",
        "dueSoonShort": "Končí",
        "uncalibratedShort": "Nekalib.",
        "calibrationFreeShort": "Bez kalib."
      },
      "add": {
        "title": "Pridať nové zariadenie",
        "changePhoto": "Zmeniť fotku",
        "uploadPhoto": "Nahrať fotku",
        "usagePlaceholder": "napr. Laboratórium B",
        "msnPlaceholder": "napr. E-02-01-3002",
        "msnError": "Zadajte kód v tvare P-XX-XX-XXXX (napr. E-02-01-3002)."
      },
      "calibrate": {
        "title": "Kalibrácia zariadenia",
        "subtitle": "Zariadenie",
        "period": {
          "label": "Perióda kalibrácie",
          "free": "Calibration free"
        },
        "notRequired": "Nevyžaduje sa",
        "certificate": "Kalibračný certifikát",
        "uploadPdf": "Nahrať PDF súbor",
        "pdfError": "Prosím, nahrajte súbor vo formáte PDF.",
        "saveButton": "Uložiť kalibráciu"
      },
      "history": {
        "title": "História kalibrácií",
        "subtitle": "Zariadenie",
        "calibrationDate": "Dátum kalibrácie",
        "validUntil": "Platnosť do",
        "period": "Perióda",
        "certificate": "Certifikát",
        "download": "Stiahnuť",
        "noHistory": "Pre toto zariadenie neexistuje žiadna história kalibrácií."
      },
      "export": {
        "csvFilename": "evidencia_kalibracii",
        "pdfFilename": "evidencia_kalibracii"
      }
    },
    en: {
      "general": {
        "save": "Save",
        "cancel": "Cancel",
        "close": "Close",
        "year": "year",
        "years": "years",
        "noDevicesFound": "No devices found",
        "noDevicesHint": "Try changing the filter or add a new device."
      },
      "login": {
        "title": "Calibration Record",
        "subtitle": "Please log in to continue.",
        "username": "Username",
        "usernamePlaceholder": "admin / moderator / user",
        "password": "Password",
        "passwordPlaceholder": "password",
        "loginButton": "Log In",
        "error": "Incorrect username or password.",
        "demoAccounts": "Demo accounts"
      },
      "header": {
        "title": "Calibration Record",
        "logout": "Logout",
        "addDevice": "Add device"
      },
      "dashboard": {
        "title": "Dashboard",
        "overdue": "Overdue",
        "dueSoonThisMonth": "Due this month",
        "deviceStatus": "Device Status"
      },
      "controls": {
        "searchPlaceholder": "Search for a device...",
        "allManufacturers": "All manufacturers",
        "allUsages": "All usages",
        "sortBy": {
          "label": "Sort by",
          "name": "Name",
          "status": "Status",
          "validity": "Validity"
        }
      },
      "device": {
        "name": "Name",
        "serialNumber": "Serial number",
        "manufacturer": "Manufacturer",
        "model": "Model",
        "usage": "Usage",
        "msnCode": "MSN code",
        "status": "Status",
        "photo": "Device photo",
        "validUntil": "Valid until",
        "downloadCertificate": "Download certificate",
        "calibrateButton": "Calibrate",
        "deleteConfirm": "Are you sure you want to delete this device?"
      },
      "status": {
        "valid": "Valid",
        "dueSoon": "Due soon",
        "overdue": "Overdue",
        "uncalibrated": "Uncalibrated",
        "calibrationFree": "Calibration not required",
        "validShort": "Valid",
        "dueSoonShort": "Due",
        "uncalibratedShort": "Uncalib.",
        "calibrationFreeShort": "No calib."
      },
      "add": {
        "title": "Add new device",
        "changePhoto": "Change photo",
        "uploadPhoto": "Upload photo",
        "usagePlaceholder": "e.g. Laboratory B",
        "msnPlaceholder": "e.g. E-02-01-3002",
        "msnError": "Enter code in the format L-XX-XX-XXXX (e.g. E-02-01-3002)."
      },
      "calibrate": {
        "title": "Calibrate Device",
        "subtitle": "Device",
        "period": {
          "label": "Calibration period",
          "free": "Calibration free"
        },
        "notRequired": "Not required",
        "certificate": "Calibration certificate",
        "uploadPdf": "Upload PDF file",
        "pdfError": "Please upload a file in PDF format.",
        "saveButton": "Save calibration"
      },
      "history": {
        "title": "Calibration History",
        "subtitle": "Device",
        "calibrationDate": "Calibration date",
        "validUntil": "Valid until",
        "period": "Period",
        "certificate": "Certificate",
        "download": "Download",
        "noHistory": "No calibration history exists for this device."
      },
      "export": {
        "csvFilename": "calibration_record",
        "pdfFilename": "calibration_record"
      }
    },
    de: {
      "general": {
        "save": "Speichern",
        "cancel": "Abbrechen",
        "close": "Schließen",
        "year": "Jahr",
        "years": "Jahre",
        "noDevicesFound": "Keine Geräte gefunden",
        "noDevicesHint": "Ändern Sie den Filter oder fügen Sie ein neues Gerät hinzu."
      },
      "login": {
        "title": "Kalibrierungsprotokoll",
        "subtitle": "Bitte melden Sie sich an, um fortzufahren.",
        "username": "Benutzername",
        "usernamePlaceholder": "admin / moderator / user",
        "password": "Passwort",
        "passwordPlaceholder": "password",
        "loginButton": "Anmelden",
        "error": "Falscher Benutzername oder falsches Passwort.",
        "demoAccounts": "Demo-Konten"
      },
      "header": {
        "title": "Kalibrierungsprotokoll",
        "logout": "Abmelden",
        "addDevice": "Gerät hinzufügen"
      },
      "dashboard": {
        "title": "Dashboard",
        "overdue": "Überfällig",
        "dueSoonThisMonth": "Diesen Monat fällig",
        "deviceStatus": "Gerätestatus"
      },
      "controls": {
        "searchPlaceholder": "Gerät suchen...",
        "allManufacturers": "Alle Hersteller",
        "allUsages": "Alle Verwendungen",
        "sortBy": {
          "label": "Sortieren nach",
          "name": "Name",
          "status": "Status",
          "validity": "Gültigkeit"
        }
      },
      "device": {
        "name": "Name",
        "serialNumber": "Seriennummer",
        "manufacturer": "Hersteller",
        "model": "Modell",
        "usage": "Verwendung",
        "msnCode": "MSN-Code",
        "status": "Status",
        "photo": "Gerätefoto",
        "validUntil": "Gültig bis",
        "downloadCertificate": "Zertifikat herunterladen",
        "calibrateButton": "Kalibrieren",
        "deleteConfirm": "Möchten Sie dieses Gerät wirklich löschen?"
      },
      "status": {
        "valid": "Gültig",
        "dueSoon": "Bald fällig",
        "overdue": "Überfällig",
        "uncalibrated": "Unkalibriert",
        "calibrationFree": "Kalibrierung nicht erforderlich",
        "validShort": "Gültig",
        "dueSoonShort": "Fällig",
        "uncalibratedShort": "Unkalib.",
        "calibrationFreeShort": "Keine Kalib."
      },
      "add": {
        "title": "Neues Gerät hinzufügen",
        "changePhoto": "Foto ändern",
        "uploadPhoto": "Foto hochladen",
        "usagePlaceholder": "z.B. Labor B",
        "msnPlaceholder": "z.B. E-02-01-3002",
        "msnError": "Geben Sie den Code im Format B-XX-XX-XXXX ein (z.B. E-02-01-3002)."
      },
      "calibrate": {
        "title": "Gerät kalibrieren",
        "subtitle": "Gerät",
        "period": {
          "label": "Kalibrierungsperiode",
          "free": "Kalibrierungsfrei"
        },
        "notRequired": "Nicht erforderlich",
        "certificate": "Kalibrierungszertifikat",
        "uploadPdf": "PDF-Datei hochladen",
        "pdfError": "Bitte laden Sie eine Datei im PDF-Format hoch.",
        "saveButton": "Kalibrierung speichern"
      },
      "history": {
        "title": "Kalibrierungsverlauf",
        "subtitle": "Gerät",
        "calibrationDate": "Kalibrierungsdatum",
        "validUntil": "Gültig bis",
        "period": "Periode",
        "certificate": "Zertifikat",
        "download": "Herunterladen",
        "noHistory": "Für dieses Gerät existiert kein Kalibrierungsverlauf."
      },
      "export": {
        "csvFilename": "kalibrierungsprotokoll",
        "pdfFilename": "kalibrierungsprotokoll"
      }
    }
  };

  currentLang = signal<Language>('sk');
  currentLocale = signal<Locale>('sk');

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedLang = localStorage.getItem(this.LANG_STORAGE_KEY) as Language | null;
      if (storedLang && this.translations[storedLang]) {
        this.setLanguage(storedLang);
      } else {
        this.setLanguage('sk'); // Default language
      }
    }
  }
  
  private setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    switch(lang) {
      case 'en': this.currentLocale.set('en'); break;
      case 'de': this.currentLocale.set('de'); break;
      case 'sk':
      default:
        this.currentLocale.set('sk'); break;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.LANG_STORAGE_KEY, lang);
    }
  }

  switchLanguage(lang: Language): void {
    this.setLanguage(lang);
  }

  translate(key: string): string {
    const lang = this.currentLang();
    const translation = key.split('.').reduce((obj, k) => obj?.[k], this.translations[lang]);
    return translation || key;
  }
}
