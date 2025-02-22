import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Medication } from '../(app)/api/medications';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { showMessage } from 'react-native-flash-message';
import { MotiView } from 'moti';

interface MedicationContextType {
  medications: Medication[];
  addMedication: (medication: Medication) => Promise<string | void>;
  removeMedication: (id: string) => Promise<void>;
  loading: boolean;
  refreshMedications: () => Promise<Medication[]>;
}

const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  addMedication: async () => {},
  removeMedication: async () => {},
  loading: false,
  refreshMedications: async () => [],
});

export const useMedications = () => useContext(MedicationContext);

export function MedicationProvider({ children }: { children: React.ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  // Set up real-time listener for medications
  useEffect(() => {
    let unsubscribe: () => void;

    const setupMedicationListener = async () => {
      if (!auth.currentUser) {
        setMedications([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'medications'),
          where('userId', '==', auth.currentUser.uid)
        );

        // First, get initial data
        const snapshot = await getDocs(q);
        const initialMeds = snapshot.docs.map(doc => ({
          ...doc.data() as Medication,
          id: doc.id,
        }));
        setMedications(initialMeds);
        setLoading(false);

        // Then set up real-time listener
        unsubscribe = onSnapshot(q, (snapshot) => {
          const meds = snapshot.docs.map(doc => ({
            ...doc.data() as Medication,
            id: doc.id,
          }));
          console.log('Medications updated:', meds); // Debug log
          setMedications(meds);
        }, (error) => {
          console.error('Error in medication listener:', error);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up medication listener:', error);
        setLoading(false);
      }
    };

    // Set up auth state listener
    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user?.uid); // Debug log
      if (user) {
        setupMedicationListener();
      } else {
        setMedications([]);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      authUnsubscribe();
    };
  }, []);

  const refreshMedications = useCallback(async () => {
    if (!auth.currentUser) {
      console.log('No user logged in during refresh'); // Debug log
      return [];
    }

    try {
      const medicationsRef = collection(db, 'medications');
      const q = query(medicationsRef, where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const meds = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Medication[];
      console.log('Medications refreshed:', meds); // Debug log
      setMedications(meds);
      return meds;
    } catch (error) {
      console.error('Error refreshing medications:', error);
      return [];
    }
  }, []);

  const addMedication = async (medication: Medication) => {
    if (!auth.currentUser) {
      showMessage({
        message: "Authentication Error",
        description: "Please sign in to add medications",
        type: "danger",
        duration: 3000,
      });
      return;
    }

    try {
      const medData = {
        ...medication,
        userId: auth.currentUser.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'medications'), medData);
      
      showMessage({
        message: "Medication Added Successfully",
        description: `${medication.brand_name} has been added to your medications`,
        type: "success",
        duration: 3000,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding medication:', error);
      showMessage({
        message: "Error Adding Medication",
        description: "Please try again",
        type: "danger",
        duration: 3000,
      });
      throw error;
    }
  };

  const removeMedication = async (id: string) => {
    if (!auth.currentUser) {
      showMessage({
        message: "Authentication Error",
        description: "Please sign in to remove medications",
        type: "danger",
        duration: 3000,
      });
      return;
    }

    try {
      const medicationRef = doc(db, 'medications', id);
      await deleteDoc(medicationRef);
      
      showMessage({
        message: "Medication Removed",
        description: "The medication has been removed from your list",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error removing medication:', error);
      showMessage({
        message: "Error Removing Medication",
        description: "Please try again",
        type: "danger",
        duration: 3000,
      });
      throw error;
    }
  };

  return (
    <MedicationContext.Provider value={{ 
      medications, 
      loading, 
      refreshMedications,
      addMedication,
      removeMedication
    }}>
      {children}
    </MedicationContext.Provider>
  );
}

export default MedicationProvider;
