import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, useTheme } from 'react-native-paper';
import { useNotes } from '../context/NotesContext';
import { format } from 'date-fns';
import { auth } from '../../firebaseConfig';

export function DailyNotes() {
  const theme = useTheme();
  const { notes, addNote, deleteNote, loading } = useNotes();
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstName = auth.currentUser?.displayName?.split(' ')[0] || 'Guest';
  const currentDateTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addNote(newNote.trim());
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text 
        variant="headlineMedium" 
        style={{ color: theme.colors.onSurface }}
      >
        How are you,{' '}
        <Text style={{ 
          color: theme.colors.primary,
          fontWeight: 'bold' 
        }}>
          {firstName}
        </Text>
        ?
      </Text>
      
      <Text 
        variant="bodyLarge" 
        style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}
      >
        {currentDateTime}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          value={newNote}
          onChangeText={setNewNote}
          placeholder="Write your daily note..."
          multiline
          numberOfLines={3}
          style={styles.input}
          outlineStyle={{ 
            borderRadius: 12,
            borderColor: theme.colors.primary 
          }}
          outlineColor={theme.colors.primary}
          activeOutlineColor={theme.colors.primary}
          placeholderTextColor={theme.colors.primary + '80'}
        />
        <Button
          mode="contained"
          onPress={handleAddNote}
          loading={isSubmitting}
          disabled={isSubmitting || !newNote.trim()}
          style={styles.addButton}
        >
          Add Note
        </Button>
      </View>

      <ScrollView style={styles.notesList}>
        {notes.map((note) => (
          <Card key={note.id} style={styles.noteCard}>
            <Card.Content style={styles.noteContent}>
              <Text 
                variant="bodyMedium" 
                style={{ color: theme.colors.primary }}
              >
                {note.content}
              </Text>
              <View style={styles.noteFooter}>
                <Text 
                  variant="bodySmall" 
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                </Text>
                <IconButton
                  icon="delete"
                  size={18}
                  onPress={() => handleDeleteNote(note.id)}
                  style={{ margin: -8 }}
                  contentStyle={{ margin: 0 }}
                  mode="text"
                />
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 110,
  },
  inputContainer: {
    marginTop: 16,
    gap: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  addButton: {
    marginTop: 8,
  },
  notesList: {
    marginTop: 16,
  },
  noteCard: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  noteContent: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  timestamp: {
    marginTop: 4,
    marginBottom: 8,
  },
  noteText: {
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  noteTimestamp: {
    marginTop: 8,
  },
  noteActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
}); 

export default DailyNotes;
