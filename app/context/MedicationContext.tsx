import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medication } from '../(app)/api/medications';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { showMessage } from 'react-native-flash-message';
import { MotiView } from 'moti';

interface MedicationContextType {
  medications: Medication[];
  loading: boolean;
  addMedication: (medication: Medication) => Promise<void>;
  updateMedication: (id: string, medication: Medication) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
}

export const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  loading: false,
  addMedication: async () => {},
  updateMedication: async () => {},
  deleteMedication: async () => {},
});

// Add the custom hook
export const useMedications = () => {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error('useMedications must be used within a MedicationProvider');
  }
  return context;
};

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

  const updateMedication = async (id: string, updatedMedication: Medication) => {
    setLoading(true);
    try {
      // Update in local state
      setMedications(prev => 
        prev.map(med => med.id === id ? updatedMedication : med)
      );
      // Here you would typically update in your backend/database
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteMedication = async (id: string) => {
    setLoading(true);
    try {
      // Remove from local state
      setMedications(prev => prev.filter(med => med.id !== id));
      // Here you would typically delete from your backend/database
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <MedicationContext.Provider value={{
      medications,
      loading,
      addMedication,
      updateMedication,
      deleteMedication,
    }}>
      {children}
    </MedicationContext.Provider>
  );
}

export default MedicationProvider;
