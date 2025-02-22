import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Medication } from '../(app)/api/medications';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { showMessage } from 'react-native-flash-message';
import { MotiView } from 'moti';

interface MedicationContextType {
  medications: Medication[];
  addMedication: (medication: Medication) => Promise<string | void>;
  removeMedication: (id: string) => Promise<void>;
  updateMedication: (id: string, medication: Medication) => Promise<void>;
  loading: boolean;
  takenMedications: Record<string, string[]>; // date -> medication IDs
  takeMedication: (medicationId: string) => void;
  untakeMedication: (medicationId: string) => void;
  getTakenMedications: (date?: string) => string[];
  refreshMedications: () => Promise<Medication[]>;
}

const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  addMedication: async () => {},
  removeMedication: async () => {},
  updateMedication: async () => {},
  loading: false,
  takenMedications: {},
  takeMedication: () => {},
  untakeMedication: () => {},
  getTakenMedications: () => [],
  refreshMedications: async () => [],
});

export const useMedications = () => useContext(MedicationContext);

export function MedicationProvider({ children }: { children: React.ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [takenMedications, setTakenMedications] = useState<Record<string, string[]>>({});

  const today = new Date().toISOString().split('T')[0];

  // Set up real-time listener for medications
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      // Clear existing listener if it exists
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }

      if (user) {
        // User is signed in, set up the medications listener
        setLoading(true);
        const q = query(
          collection(db, 'medications'),
          where('userId', '==', user.uid)
        );

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const meds = snapshot.docs.map(doc => ({
              ...doc.data() as Medication,
              id: doc.id,
            }));
            setMedications(meds);
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching medications:', error);
            setLoading(false);
          }
        );
      } else {
        // User is signed out, clear medications
        setMedications([]);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      authUnsubscribe();
    };
  }, []); // Empty dependency array since we want this to run once on mount

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

  const updateMedication = async (id: string, medication: Medication) => {
    if (!auth.currentUser) {
      showMessage({
        message: "Authentication Error",
        description: "Please sign in to update medications",
        type: "danger",
        duration: 3000,
      });
      return;
    }

    try {
      const medicationRef = doc(db, 'medications', id);
      await updateDoc(medicationRef, {
        ...medication,
        updated_at: new Date().toISOString(),
      });
      
      showMessage({
        message: "Medication Updated",
        description: `${medication.brand_name} has been updated`,
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating medication:', error);
      showMessage({
        message: "Error Updating Medication",
        description: "Please try again",
        type: "danger",
        duration: 3000,
      });
      throw error;
    }
  };

  const takeMedication = (medicationId: string) => {
    setTakenMedications(prev => {
      const todaysTaken = prev[today] || [];
      return {
        ...prev,
        [today]: [...new Set([...todaysTaken, medicationId])]
      };
    });
  };

  const untakeMedication = (medicationId: string) => {
    setTakenMedications(prev => {
      const todaysTaken = prev[today] || [];
      return {
        ...prev,
        [today]: todaysTaken.filter(id => id !== medicationId)
      };
    });
  };

  const getTakenMedications = (date: string = today) => {
    return takenMedications[date] || [];
  };

  const refreshMedications = async () => {
    if (!auth.currentUser) {
      showMessage({
        message: "Authentication Error",
        description: "Please sign in to refresh medications",
        type: "danger",
        duration: 3000,
      });
      return [];
    }

    try {
      const q = query(
        collection(db, 'medications'),
        where('userId', '==', auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const meds = snapshot.docs.map(doc => ({
        ...doc.data() as Medication,
        id: doc.id,
      }));
      setMedications(meds);
      return meds;
    } catch (error) {
      console.error('Error refreshing medications:', error);
      showMessage({
        message: "Error Refreshing Medications",
        description: "Please try again",
        type: "danger",
        duration: 3000,
      });
      return [];
    }
  };

  return (
    <MedicationContext.Provider value={{ 
      medications, 
      addMedication,
      removeMedication,
      updateMedication,
      loading,
      takenMedications,
      takeMedication,
      untakeMedication,
      getTakenMedications,
      refreshMedications,
    }}>
      {children}
    </MedicationContext.Provider>
  );
}

export default MedicationProvider;