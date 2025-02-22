import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  addMedication: async () => {},
  removeMedication: async () => {},
  loading: false,
});

export const useMedications = () => useContext(MedicationContext);

export function MedicationProvider({ children }: { children: React.ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  // Set up real-time listener for user-specific medications
  useEffect(() => {
    let unsubscribe: () => void;

    const setupMedicationListener = () => {
      if (auth.currentUser) {
        setLoading(true);
        const q = query(
          collection(db, 'medications'),
          where('userId', '==', auth.currentUser.uid)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const meds = snapshot.docs.map(doc => ({
            ...doc.data() as Medication,
            id: doc.id,
          }));
          setMedications(meds);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching medications:', error);
          setLoading(false);
        });
      } else {
        setMedications([]);
        setLoading(false);
      }
    };

    // Listen for auth state changes
    const authUnsubscribe = auth.onAuthStateChanged((user) => {
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
    <MedicationContext.Provider value={{ medications, addMedication, removeMedication, loading }}>
      {children}
    </MedicationContext.Provider>
  );
}

export default MedicationProvider;
