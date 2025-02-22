import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'; // Import TouchableOpacity
import { NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const StartScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  return (
    <LinearGradient colors={['#cadeed', '#7888d9', '#0d2f5d']} style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo_white.png')}
          style={styles.logo}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <View style={styles.buttonSpacer} />
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  logo: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginTop: 20, 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#fff',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 30,
  },
  button: {
    backgroundColor: 'transparent', 
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSpacer: {
    height: 15,
  },
});

export default StartScreen;