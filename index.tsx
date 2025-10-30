

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeSk from '@angular/common/locales/sk';
import localeDe from '@angular/common/locales/de';
import { AppComponent } from './src/app.component';

// Zaregistruj locale data pre slovenčinu a nemčinu
registerLocaleData(localeSk);
registerLocaleData(localeDe);

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'sk' }, // Predvolený locale
  ],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.