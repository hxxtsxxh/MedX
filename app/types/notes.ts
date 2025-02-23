export interface Note {
  id: string;
  content: string;
  createdAt: Date;
} 

export interface NotesContextType {
  notes: Note[];
  addNote: (content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  loading: boolean;
}
