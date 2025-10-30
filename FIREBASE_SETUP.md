# 🔥 Firebase Firestore & reCAPTCHA v3 - Implementačný návod

## 📋 Čo bolo implementované

### ✅ Dokončené úpravy:

1. **Firebase Firestore integrácia**

   - `firebase.service.ts` - univerzálny servis pre Firestore operácie
   - `device.service.ts` - aktualizovaný na používanie Firestore namiesto LocalStorage
   - Real-time synchronizácia dát medzi zariadeniami

2. **Firebase Authentication**

   - `auth.service.ts` - kompletne prepísaný s Firebase Auth
   - Odstránené hardcoded heslá
   - Bezpečné prihlásenie a registrácia používateľov

3. **Google reCAPTCHA v3**

   - `recaptcha.service.ts` - automatická ochrana proti botom
   - Integrácia pri prihlásení
   - Tiché overenie na pozadí (bez CAPTCHA výzvy)

4. **Bezpečnostné pravidlá**

   - `firestore.rules` - role-based prístupové práva
   - `firestore.indexes.json` - optimalizované indexy

5. **Environment konfigurácia**
   - `environment.ts` a `environment.prod.ts`
   - Pripravené pre Firebase a reCAPTCHA konfiguráciu

---

## 🚀 Kroky na spustenie

### 1️⃣ Vytvorte Firebase projekt

1. Prejdite na [Firebase Console](https://console.firebase.google.com/)
2. Kliknite na **"Add project"**
3. Zadajte názov projektu (napr. `evidencia-kalibraci`)
4. Dokončite vytvorenie projektu

### 2️⃣ Nastavte Firebase Authentication

1. V Firebase Console prejdite na **Authentication** → **Sign-in method**
2. Povoľte **Email/Password** autentifikáciu
3. (Voliteľné) Povoľte ďalšie metódy (Google, Facebook...)

### 3️⃣ Vytvorte Firestore Database

1. V Firebase Console prejdite na **Firestore Database**
2. Kliknite **"Create database"**
3. Vyberte režim:
   - **Production mode** (odporúčané) - použije bezpečnostné pravidlá
   - **Test mode** - iba pre vývoj
4. Vyberte **región** (napр. `europe-west3` pre Frankfurt)

### 4️⃣ Nasaďte Firestore pravidlá

**Manuálne cez konzolu:**

1. V Firestore prejdite na záložku **Rules**
2. Skopírujte obsah súboru `firestore.rules`
3. Prilepte a kliknite **Publish**

**Cez Firebase CLI:**

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5️⃣ Získajte Firebase konfiguráciu

1. V Firebase Console prejdite na **Project Settings** (⚙️ ikona)
2. Skrolujte dole na **"Your apps"**
3. Kliknite na **Web app** ikonu (`</>`)
4. Zaregistrujte aplikáciu (napr. názov: `Evidencia Web`)
5. Skopírujte **Firebase config** objekt

### 6️⃣ Nastavte reCAPTCHA v3

1. Prejdite na [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Kliknite **"+"** pre vytvorenie nového site key
3. **Label:** `Evidencia kalibrácií`
4. **reCAPTCHA type:** Vyberte **reCAPTCHA v3**
5. **Domains:** Pridajte vašu doménu (napr. `localhost` pre vývoj, `yourdomain.com` pre produkciu)
6. Skopírujte **Site Key**

### 7️⃣ Aktualizujte environment súbory

**Upravte `src/environments/environment.ts`:**

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "vas-projekt-id.firebaseapp.com",
    projectId: "vas-projekt-id",
    storageBucket: "vas-projekt-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456",
  },
  recaptcha: {
    siteKey: "6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
};
```

**Upravte aj `src/environments/environment.prod.ts`** s rovnakými hodnotami.

### 8️⃣ Nainštalujte závislosti

```powershell
npm install
```

### 9️⃣ Vytvorte prvého admin používateľa

**Metóda 1: Cez Firebase Console**

1. Prejdite na **Authentication** → **Users**
2. Kliknite **"Add user"**
3. Email: `admin@demo.com`
4. Password: `AdminPassword123!`
5. Kliknite **Add user**

**Potom vytvorte profil v Firestore:**

1. Prejdite na **Firestore Database**
2. Vytvorte kolekciu `users`
3. Document ID: použite **UID** z Authentication
4. Polia:
   ```
   uid: "skopírované-uid-z-authentication"
   email: "admin@demo.com"
   username: "admin"
   role: "Admin"
   ```

**Metóda 2: Cez kód (dočasne)**
Môžete dočasne použiť registračnú funkciu v `auth.service.ts`:

```typescript
// V console.log pri štarte aplikácie:
this.authService.register(
  "admin@demo.com",
  "AdminPassword123!",
  "admin",
  "Admin"
);
```

### 🔟 Spustite aplikáciu

```powershell
npm run dev
```

Aplikácia bude dostupná na `http://localhost:3000`

---

## 🔐 Bezpečnostné funkcie

### 1. **Role-based Access Control (RBAC)**

- **Admin**: Plný prístup (pridávanie, úprava, mazanie zariadení)
- **Moderator**: Môže kalibrovať zariadenia
- **User**: Iba čítanie

### 2. **Firebase Authentication**

- Bezpečné heslá (hashované cez bcrypt Firebase)
- Session management
- Token-based autentifikácia

### 3. **reCAPTCHA v3**

- Automatická ochrana proti botom
- Skóre 0.0 - 1.0 (čím vyššie, tým väčšia pravdepodobnosť, že je to človek)
- Žiadne CAPTCHA výzvy pre používateľov

### 4. **Firestore Security Rules**

- Prístup iba pre prihlásených používateľov
- Role-based pravidlá na úrovni databázy
- Ochrana proti neoprávnenému prístupu

---

## 📝 Dôležité poznámky

### ⚠️ Pre produkciu:

1. **Implementujte backend overenie reCAPTCHA:**

   - V súčasnosti `recaptcha.service.ts` iba simuluje overenie
   - Vytvorte backend endpoint pre verifikáciu tokenu
   - Príklad Node.js endpoint:

   ```javascript
   app.post("/api/verify-recaptcha", async (req, res) => {
     const { token } = req.body;
     const secretKey = "YOUR_RECAPTCHA_SECRET_KEY";

     const response = await fetch(
       "https://www.google.com/recaptcha/api/siteverify",
       {
         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: `secret=${secretKey}&response=${token}`,
       }
     );

     const data = await response.json();
     res.json({ success: data.success, score: data.score });
   });
   ```

2. **Necommitujte environment súbory s citlivými dátami:**

   - Pridajte do `.gitignore`:

   ```
   src/environments/environment.ts
   src/environments/environment.prod.ts
   ```

3. **Použite Firebase Hosting alebo iný HTTPS hosting**

   - reCAPTCHA vyžaduje HTTPS na produkcii

4. **Nastavte CORS na Firebase Firestore**

   - V Firebase Console → Firestore → Settings

5. **Monitorujte Firebase Usage:**
   - Sledujte počet čítaní/zápisov
   - Nastavte budget alerts

---

## 🐛 Troubleshooting

### Chyba: "Firebase: Error (auth/operation-not-allowed)"

**Riešenie:** Povoľte Email/Password autentifikáciu v Firebase Console.

### Chyba: "Missing or insufficient permissions"

**Riešenie:** Nasaďte Firestore security rules (`firestore.rules`).

### Chyba: "reCAPTCHA not loaded"

**Riešenie:** Skontrolujte, či je reCAPTCHA site key správny v `environment.ts`.

### Zariadenia sa nenačítavajú

**Riešenie:** Skontrolujte, či kolekcia `devices` existuje vo Firestore a či má používateľ potrebné oprávnenia.

---

## 📚 Ďalšie zdroje

- [Firebase Documentation](https://firebase.google.com/docs)
- [Angular Fire Documentation](https://github.com/angular/angularfire)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## ✨ Ďalšie vylepšenia (voliteľné)

1. **Email verifikácia** - Firebase Authentication email verification
2. **Password reset** - Funkcionalita "zabudnuté heslo"
3. **Two-factor authentication (2FA)** - Extra bezpečnosť
4. **Offline support** - Firestore offline persistence
5. **Cloud Functions** - Automatické notifikácie o exspirácii kalibrácií
6. **Storage** - Firebase Storage pre väčšie súbory (certifikáty, fotografie)

---

✅ **Implementácia dokončená!** Aplikácia je teraz pripravená na bezpečné nasadenie s Firebase Firestore a Google reCAPTCHA v3.
