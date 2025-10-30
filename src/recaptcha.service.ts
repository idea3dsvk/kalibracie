import { Injectable } from '@angular/core';
import { environment } from './environments/environment';

declare const grecaptcha: any;

@Injectable({
  providedIn: 'root'
})
export class RecaptchaService {
  private siteKey = environment.recaptcha.siteKey;
  private scriptLoaded = false;

  constructor() {
    this.loadRecaptchaScript();
  }

  /**
   * Načíta reCAPTCHA v3 skript
   */
  private loadRecaptchaScript(): void {
    if (this.scriptLoaded || typeof window === 'undefined') return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    this.scriptLoaded = true;
  }

  /**
   * Vykoná reCAPTCHA verifikáciu a vráti token
   */
  async executeRecaptcha(action: string = 'login'): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof grecaptcha === 'undefined') {
        reject('reCAPTCHA not loaded');
        return;
      }

      grecaptcha.ready(() => {
        grecaptcha
          .execute(this.siteKey, { action })
          .then((token: string) => {
            resolve(token);
          })
          .catch((error: any) => {
            reject(error);
          });
      });
    });
  }

  /**
   * Overí reCAPTCHA token na serveri
   * V reálnej aplikácii by ste mali volať váš backend API endpoint
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      // TODO: Implementujte volanie na váš backend endpoint
      // const response = await fetch('/api/verify-recaptcha', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token })
      // });
      // const data = await response.json();
      // return data.success && data.score > 0.5;

      // Zatiaľ vždy vrátime true (musíte implementovať backend verifikáciu)
      console.warn('reCAPTCHA backend verification not implemented');
      return true;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return false;
    }
  }
}
