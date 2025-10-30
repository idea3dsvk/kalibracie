import { Injectable, signal, computed, inject } from '@angular/core';
import { User, UserRole } from './device.model';
import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  Auth,
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';
import { RecaptchaService } from './recaptcha.service';
import { environment } from './environments/environment';

interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth;
  private firebaseService = inject(FirebaseService);
  private recaptchaService = inject(RecaptchaService);
  
  private readonly USERS_COLLECTION = 'users';
  
  currentUser = signal<User | null>(null);
  firebaseUser = signal<FirebaseUser | null>(null);
  loading = signal<boolean>(false);

  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');
  isModerator = computed(() => this.currentUser()?.role === 'Moderator');

  constructor() {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);
    this.initAuthListener();
  }

  /**
   * Sleduje stav autentifikácie Firebase
   */
  private initAuthListener(): void {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      this.firebaseUser.set(firebaseUser);
      
      if (firebaseUser) {
        // Načítaj user profile z Firestore
        await this.loadUserProfile(firebaseUser.uid);
      } else {
        this.currentUser.set(null);
      }
    });
  }

  /**
   * Načíta používateľský profil z Firestore
   */
  private async loadUserProfile(uid: string): Promise<void> {
    try {
      this.firebaseService.getCollectionWithQuery<UserProfile>(
        this.USERS_COLLECTION, 
        'uid', 
        '==', 
        uid,
        (profiles) => {
          if (profiles.length > 0) {
            const profile = profiles[0];
            this.currentUser.set({
              username: profile.username,
              role: profile.role
            });
          }
        }
      );
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }

  /**
   * Prihlásenie s overením reCAPTCHA
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.loading.set(true);

      // DOČASNE VYPNUTÉ: reCAPTCHA overenie (nastavíme neskôr)
      // const recaptchaToken = await this.recaptchaService.executeRecaptcha('login');
      // const recaptchaValid = await this.recaptchaService.verifyToken(recaptchaToken);
      // if (!recaptchaValid) {
      //   return { success: false, error: 'reCAPTCHA verifikácia zlyhala' };
      // }

      // Prihlásenie cez Firebase Authentication
      console.log('Attempting login with email:', email);
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Login successful, user:', userCredential.user.uid);
      
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Chyba pri prihlásení';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Nesprávny email alebo heslo';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Príliš mnoho pokusov. Skúste neskôr.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Chyba pripojenia k sieti';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Registrácia nového používateľa
   */
  async register(email: string, password: string, username: string, role: UserRole = 'User'): Promise<{ success: boolean; error?: string }> {
    try {
      this.loading.set(true);

      // Vytvorenie používateľa v Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Vytvorenie profilu v Firestore
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: email,
        username: username,
        role: role
      };

      await this.firebaseService.setDocument(
        this.USERS_COLLECTION, 
        userCredential.user.uid, 
        userProfile
      );

      return { success: true };
    } catch (err: any) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Chyba pri registrácii';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email už existuje';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Heslo je príliš slabé';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Neplatný email';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Odhlásenie
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUser.set(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
}
