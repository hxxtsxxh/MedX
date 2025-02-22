import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, useTheme } from 'react-native-paper';
import { useNotes } from '../context/NotesContext';
import { format } from 'date-fns';

export function DailyNotes() {
  const theme = useTheme();
  const { notes, addNote, deleteNote, loading } = useNotes();
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          value={newNote}
          onChangeText={setNewNote}
          placeholder="Write your daily note..."
          multiline
          numberOfLines={3}
          style={styles.input}
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
            <Card.Content>
              <Text variant="bodyMedium">{note.content}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
              </Text>
            </Card.Content>
            <Card.Actions>
              <IconButton
                icon="delete"
                onPress={() => handleDeleteNote(note.id)}
              />
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    padding: 16,
    gap: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  addButton: {
    marginTop: 8,
  },
  notesList: {
    padding: 16,
  },
  noteCard: {
    marginBottom: 12,
  },
}); 