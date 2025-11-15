# Deployment Guide - Evidencia Kalibrácií

## 🚀 Produkčné nasadenie

### 1. Firebase Firestore Pravidlá

Pravidlá v `firestore.rules` sú teraz nastavené na produkčný režim s role-based access control:

- **Admin** - môže všetko (pridávať, kalibrovať, mazať zariadenia)
- **Moderator** - môže čítať a kalibrovať zariadenia
- **User** - môže len čítať zariadenia

#### Nasadenie pravidiel do Firebase:

```powershell
# Prihláste sa do Firebase CLI (ak ešte nie ste)
firebase login

# Nasaďte Firestore pravidlá
firebase deploy --only firestore:rules --project kalibracie-d10e5
```

### 2. Environment Configuration

Pre produkčné prostredie použite súbor `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: "kalibracie-d10e5.firebaseapp.com",
    projectId: "kalibracie-d10e5",
    storageBucket: "kalibracie-d10e5.firebasestorage.app",
    messagingSenderId: "755628651103",
    appId: "1:755628651103:web:f1e0e2cb1b4f6e5f8c5a9e",
  },
  recaptcha: {
    siteKey: process.env.VITE_RECAPTCHA_SITE_KEY, // Konfigurovať ak používate reCAPTCHA
  },
};
```

### 3. Build pre produkciu

```powershell
# Build optimalizovanej produkčnej verzie
npm run build

# Výstup bude v priečinku dist/
```

### 4. Hosting Options

#### Option A: Firebase Hosting (odporúčané)

```powershell
# Inicializujte Firebase Hosting
firebase init hosting

# Vyberte projekt: kalibracie-d10e5
# Public directory: dist/browser (alebo podľa Angular výstupu)
# Configure as single-page app: Yes
# Set up automatic builds with GitHub: Optional

# Deploy do Firebase Hosting
firebase deploy --only hosting
```

#### Option B: Iné hosting služby

- **Vercel**: Importujte GitHub repo alebo nahrajte `dist/` priečinok
- **Netlify**: Drag & drop `dist/` priečinok alebo nastavte CI/CD
- **Azure Static Web Apps**: Nastavte deployment z GitHub
- **Custom server**: Skopírujte obsah `dist/` na webserver

### 5. Používateľské účty

#### Vytvorenie nových užívateľov:

1. **Firebase Console** → Authentication → Add user
2. Vytvorte užívateľa s emailom a heslom
3. Skopírujte **User UID**
4. **Firestore Database** → `users` kolekcia → Add document:
   ```
   Document ID: [User UID]
   Fields:
     uid: [User UID]
     email: [email užívateľa]
     username: [používateľské meno]
     role: "Admin" | "Moderator" | "User"
   ```

#### Preddefinované roly:

- **Admin**: Plný prístup - pridávanie, kalibrácia, mazanie zariadení
- **Moderator**: Kalibrácia a čítanie zariadení
- **User**: Len čítanie zariadení

### 6. Google reCAPTCHA v3 (voliteľné)

Pre aktiváciu reCAPTCHA ochrany:

1. Navštívte: https://www.google.com/recaptcha/admin/create
2. Vytvorte novú stránku s **reCAPTCHA v3**
3. Pridajte doménu (napr. `kalibracie-d10e5.web.app`)
4. Skopírujte **Site Key**
5. Aktualizujte `environment.prod.ts`:
   ```typescript
   recaptcha: {
     siteKey: "YOUR_ACTUAL_SITE_KEY";
   }
   ```
6. V `src/auth.service.ts` odkomentujte reCAPTCHA kód (je momentálne dočasne vypnutý)

### 7. Bezpečnostné odporúčania

#### ✅ Implementované:

- Firebase Authentication s email/password
- Firestore role-based security rules
- Real-time synchronizácia údajov
- Undefined hodnoty odstránené pred uložením do Firestore

#### 🔒 Odporúčania:

- Nastavte **Email verification** v Firebase Authentication
- Zapnite **2FA** pre admin účty
- Implementujte **rate limiting** pre API volania
- Pravidelne **auditujte Firestore pravidlá**
- Používajte **HTTPS** pre všetky connections (Firebase to robí automaticky)

### 8. Monitoring & Analytics

#### Firebase Console:

- **Authentication** → Sledujte počet prihlásení
- **Firestore** → Monitorujte počet read/write operácií
- **Usage** → Kontrolujte limity free tier

#### Limity Firebase Free Tier (Spark Plan):

- Firestore: 50K reads/day, 20K writes/day, 20K deletes/day
- Storage: 1 GB
- Authentication: Unlimited

Pre väčšie aplikácie zvážte upgrade na **Blaze Plan** (pay-as-you-go).

### 9. Backup & Recovery

#### Firestore Export (vyžaduje Blaze Plan):

```bash
gcloud firestore export gs://[BUCKET_NAME]
```

#### Manuálny backup:

- Export dát cez Firebase Console
- Export užívateľov cez Firebase Authentication export

### 10. Support & Maintenance

#### Aktualizácia závislostí:

```powershell
# Aktualizovať Angular
ng update @angular/core @angular/cli

# Aktualizovať Firebase SDK
npm update firebase

# Kontrola zraniteľností
npm audit
npm audit fix
```

## 📝 Post-Deployment Checklist

- [ ] Firestore pravidlá nasadené
- [ ] Admin užívateľ vytvorený v Firestore
- [ ] Aplikácia buildnutá pre produkciu
- [ ] Hostované na produkčnom serveri
- [ ] SSL certifikát aktívny (HTTPS)
- [ ] reCAPTCHA v3 nakonfigurovaná (voliteľné)
- [ ] Testované na rôznych zariadeniach a prehliadačoch
- [ ] Monitoring nastavený
- [ ] Backup stratégia definovaná

## 🐛 Troubleshooting

### Problém: "Permission denied" pri Firestore operáciách

**Riešenie**: Skontrolujte, či sú pravidlá nasadené a užívateľ má správnu rolu v `users` kolekcii.

### Problém: Veľké PDF súbory nefungujú

**Riešenie**: Firestore má limit 1MB na dokument. Pre väčšie súbory implementujte Firebase Storage.

### Problém: Real-time updates nefungujú

**Riešenie**: Skontrolujte Firestore read pravidlá a či je užívateľ autentifikovaný.

---

**Kontakt**: Pre technickú podporu kontaktujte vývojára.
