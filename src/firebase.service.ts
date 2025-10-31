import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { environment } from './environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore: Firestore;

  constructor() {
    const app = initializeApp(environment.firebase);
    this.firestore = getFirestore(app);
  }

  /**
   * Získa všetky dokumenty z kolekcie - real-time
   */
  getCollection<T>(collectionName: string, callback: (data: T[]) => void): () => void {
    const collectionRef = collection(this.firestore, collectionName);
    return onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      callback(data);
    });
  }

  /**
   * Získa dokumenty s podmienkou - real-time
   */
  getCollectionWithQuery<T>(
    collectionName: string, 
    fieldName: string, 
    operator: any, 
    value: any,
    callback: (data: T[]) => void
  ): () => void {
    const collectionRef = collection(this.firestore, collectionName);
    const q = query(collectionRef, where(fieldName, operator, value));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      callback(data);
    });
  }

  /**
   * Získa jeden dokument podľa ID
   */
  async getDocument<T>(collectionName: string, documentId: string): Promise<T | null> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (err) {
      console.error('Error getting document:', err);
      return null;
    }
  }

  /**
   * Pridá alebo aktualizuje dokument
   */
  async setDocument<T>(collectionName: string, documentId: string, data: T): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      
      // Odstráň všetky undefined hodnoty (Firestore ich nepodporuje)
      const cleanedData = this.removeUndefinedFields(data);
      
      await setDoc(docRef, cleanedData as any, { merge: true });
    } catch (err) {
      console.error('Error in setDocument:', err);
      throw err;
    }
  }

  /**
   * Odstráni undefined polia z objektu (Firestore ich nepodporuje)
   */
  private removeUndefinedFields(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item));
    }
    
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
        result[key] = this.removeUndefinedFields(obj[key]);
      }
    }
    return result;
  }

  /**
   * Aktualizuje časť dokumentu
   */
  async updateDocument(collectionName: string, documentId: string, data: Partial<any>): Promise<void> {
    const docRef = doc(this.firestore, collectionName, documentId);
    await updateDoc(docRef, data);
  }

  /**
   * Vymaže dokument
   */
  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    const docRef = doc(this.firestore, collectionName, documentId);
    await deleteDoc(docRef);
  }

  /**
   * Konvertuje JavaScript Date na Firestore Timestamp
   */
  toTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  /**
   * Konvertuje Firestore Timestamp na JavaScript Date
   */
  fromTimestamp(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }
}
