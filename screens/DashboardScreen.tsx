// screens/DashboardScreen.tsx
import React, { useContext } from 'react';
import { View, Text, Button, SafeAreaView, Alert } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { ThemeContext } from '../ThemeContext';
import { lightTheme, darkTheme } from '../styles';

const DashboardScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const styles = isDarkMode ? darkTheme : lightTheme;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Start');
    } catch (error) {
      Alert.alert('Logout Failed', (error as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' }]}>
        <Text style={[styles.text, { fontSize: 20, fontWeight: 'bold' }]}>Dashboard</Text>
        <Button title="Logout" onPress={handleLogout} />
      </View>
      
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={[styles.text, { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }]}>Welcome to your MedX Dashboard</Text>
        <Text style={[styles.text, { fontSize: 16, textAlign: 'center', color: '#555' }]}>Your appointments and medical information will appear here.</Text>
        <Button title={isDarkMode ? 'Light Mode' : 'Dark Mode'} onPress={toggleTheme} />
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;
