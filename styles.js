// styles.js
import { StyleSheet } from 'react-native';

export const lightTheme = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#f8f8f8',
  },
  text: {
    color: '#000000',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  // Add other styles as needed
});

export const darkTheme = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#1f1f1f',
  },
  text: {
    color: '#ffffff',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#333',
    color: '#ffffff',
  },
  link: {
    color: '#bb86fc',
    textDecorationLine: 'underline',
  },
  // Add other styles as needed
});
