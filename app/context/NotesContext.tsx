import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, orderBy, addDoc, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { Note } from '../types/notes';
import { onAuthStateChanged } from 'firebase/auth';

interface NotesContextType {
  notes: Note[];
  addNote: (content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  loading: boolean;
}

const NotesContext = createContext<NotesContextType>({
  notes: [],
  addNote: async () => {},
  deleteNote: async () => {},
  loading: false,
});

export const useNotes = () => useContext(NotesContext);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Set up real-time listener when auth state changes
  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Set up real-time listener for notes
        const notesRef = collection(db, 'notes');
        const q = query(
          notesRef,
          where('userId', '==', user.uid)
        );

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const loadedNotes = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Note[];

          // Sort in memory
          loadedNotes.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setNotes(loadedNotes);
          setLoading(false);
        }, (error) => {
          console.error('Error loading notes:', error);
          setLoading(false);
        });

        setUnsubscribe(() => unsubscribeSnapshot);
      } else {
        // Clear notes when user signs out
        setNotes([]);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      authUnsubscribe();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const addNote = async (content: string) => {
    if (!auth.currentUser) return;
    
    try {
      const noteData = {
        content,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid,
      };
      
      await addDoc(collection(db, 'notes'), noteData);
      // No need to update state manually as the real-time listener will handle it
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      // No need to update state manually as the real-time listener will handle it
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, deleteNote, loading }}>
      {children}
    </NotesContext.Provider>
  );
} 