import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

const DashboardScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const handleLogout = () => {
    // Add logout logic here
    navigation.navigate('Start');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Button title="Logout" onPress={handleLogout} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to your MedX Dashboard</Text>
        <Text style={styles.infoText}>Your appointments and medical information will appear here.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
});

export default DashboardScreen;
