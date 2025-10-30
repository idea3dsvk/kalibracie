# Rýchly štart - Firebase konfigurácia

## Krok 1: Získajte Firebase konfiguráciu

1. Otvorte [Firebase Console](https://console.firebase.google.com)
2. Vyberte váš projekt "kalibracie"
3. Kliknite na ikonu ⚙️ (Settings) → **Project settings**
4. Skrolujte dole na sekciu "Your apps"
5. Kliknite na ikonu **Web** (`</>`)
6. Zadajte názov aplikácie: `Evidencia Web App`
7. **Neklikajte** na "Also set up Firebase Hosting" (zatiaľ)
8. Kliknite **Register app**

Skopírujte config objekt, bude vyzerať takto:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "kalibracie.firebaseapp.com",
  projectId: "kalibracie",
  storageBucket: "kalibracie.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123...",
};
```

## Krok 2: Nastavte Firebase Authentication

1. V ľavom menu prejdite na **Authentication**
2. Kliknite **Get started**
3. Vyberte **Email/Password**
4. Zapnite **Enable** prepínač
5. Kliknite **Save**

## Krok 3: Vytvorte Firestore Database

1. V ľavom menu prejdite na **Firestore Database**
2. Kliknite **Create database**
3. Vyberte **Start in production mode** (použijeme vlastné rules)
4. Vyberte lokalitu: **europe-west3 (Frankfurt)** alebo najbližšiu
5. Kliknite **Enable**

## Krok 4: Nasaďte Security Rules

1. V Firestore prejdite na záložku **Rules**
2. Nahraďte existujúce pravidlá obsahom zo súboru `firestore.rules`
3. Kliknite **Publish**

Alebo skopírujte toto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'Admin';
    }
    function isModerator() {
      return isAuthenticated() && getUserRole() == 'Moderator';
    }

    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow create: if request.auth.uid == userId;
      allow update: if (isAuthenticated() && request.auth.uid == userId &&
                        request.resource.data.role == resource.data.role) || isAdmin();
      allow delete: if isAdmin();
    }

    match /devices/{deviceId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin() || isModerator();
      allow delete: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

## Krok 5: Nastavte reCAPTCHA v3

1. Otvorte [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
2. **Label:** Evidencia kalibrácií
3. **reCAPTCHA type:** v3
4. **Domains:**
   - `localhost` (pre vývoj)
   - Vaša produkčná doména (ak už máte)
5. Akceptujte podmienky
6. Kliknite **Submit**
7. Skopírujte **Site key** (začína 6Le...)

## Krok 6: Aktualizujte environment.ts

Otvorte súbor `src/environments/environment.ts` a vyplňte:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "VLOŽTE_SEM_Z_KROKU_1",
    authDomain: "kalibracie.firebaseapp.com",
    projectId: "kalibracie",
    storageBucket: "kalibracie.appspot.com",
    messagingSenderId: "VLOŽTE_SEM",
    appId: "VLOŽTE_SEM",
  },
  recaptcha: {
    siteKey: "VLOŽTE_RECAPTCHA_SITE_KEY_Z_KROKU_5",
  },
};
```

Urobte to isté pre `src/environments/environment.prod.ts`

## Krok 7: Vytvorte Admin účet

**Cez Firebase Console:**

1. Prejdite na **Authentication** → **Users**
2. Kliknite **Add user**
3. Email: `admin@kalibracie.sk` (alebo vaša preferencia)
4. Password: `AdminPassword123!` (použite silné heslo)
5. Kliknite **Add user**
6. **Skopírujte User UID** (dlhý reťazec pod User UID stĺpcom)

**Vytvorte profil v Firestore:**

1. Prejdite na **Firestore Database** → **Data**
2. Kliknite **Start collection**
3. Collection ID: `users`
4. Document ID: **Vložte skopírované User UID**
5. Pridajte polia:
   - `uid` (string): Vaše User UID
   - `email` (string): `admin@kalibracie.sk`
   - `username` (string): `admin`
   - `role` (string): `Admin`
6. Kliknite **Save**

## Krok 8: Nainštalujte závislosti

Otvorte terminál v priečinku projektu:

```powershell
npm install
```

## Krok 9: Spustite aplikáciu

```powershell
npm run dev
```

Aplikácia bude na `http://localhost:3000`

## Krok 10: Prihláste sa

- Email: `admin@kalibracie.sk`
- Heslo: to čo ste zadali v kroku 7

---

## ✅ Kontrolný zoznam

- [ ] Firebase config skopírovaný do environment.ts
- [ ] Authentication Email/Password zapnutý
- [ ] Firestore database vytvorená
- [ ] Security rules nasadené
- [ ] reCAPTCHA v3 nastavená
- [ ] Admin user vytvorený v Authentication
- [ ] Admin profil vytvorený v Firestore kolekcia users
- [ ] npm install spustený
- [ ] Aplikácia beží na localhost:3000
- [ ] Prihlásenie funguje

Kde ste teraz? Pomôžem vám s akýmkoľvek krokom!
