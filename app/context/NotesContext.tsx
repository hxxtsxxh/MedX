import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, addDoc, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
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

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      // Clean up previous listener if exists
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }

      if (!user) {
        setNotes([]);
        setLoading(false);
        return;
      }

      try {
        // Ensure user document exists
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          email: user.email,
          updatedAt: new Date()
        }, { merge: true });

        // Set up notes listener
        const notesRef = collection(userRef, 'notes');
        const q = query(notesRef, orderBy('createdAt', 'desc'));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const newNotes = snapshot.docs.map(doc => ({
              id: doc.id,
            content: doc.data().content,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }));
          setNotes(newNotes);
          setLoading(false);
        }, (error) => {
          // Only log error if we're still authenticated
          if (auth.currentUser) {
          console.error('Error loading notes:', error);
          }
          setLoading(false);
        });
      } catch (error) {
        // Only log error if we're still authenticated
        if (auth.currentUser) {
          console.error('Error setting up notes listener:', error);
        }
        setLoading(false);
      }
    });

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
      const notesRef = collection(db, 'users', auth.currentUser.uid, 'notes');
      await addDoc(notesRef, {
        content,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!auth.currentUser) return;
    
    try {
      const noteRef = doc(db, 'users', auth.currentUser.uid, 'notes', noteId);
      await deleteDoc(noteRef);
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

export const useNotes = () => useContext(NotesContext); 
