import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, Platform, Image, ImageComponent, ImageBackground } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        setError('We couldn\'t find an account with that email. Please check your email address and try again, or sign up for a new account.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('The password you entered is incorrect. Please try again or reset your password if you\'ve forgotten it.');
      } else {
        setError('Unable to sign in. Please check your connection and try again.');
      }
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/Background.png')} 
      style={{ 
        flex: 1,
        width: '100%',
      }}
      resizeMode="cover"
    >
      <View style={[
        styles.container, 
        { 
          backgroundColor: 'transparent',  // Make container transparent to show background
          padding: 20,
        }
      ]}>
        <Image 
          source={require('../../assets/images/logo_dark.png')} 
          style={{ width: 250, height: 250, alignSelf: 'center' }} 
        />
        <Text style={[styles.subtitle, { color: '#333' }]}>Your Medication Safety Companion</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#0D2F5D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#0D2F5D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.errorContainer}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/signup" replace asChild>
            <TouchableOpacity>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: {
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#0D2F5D',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorContainer: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  errorText: {
    color: '#FF9494',
    textAlign: 'center',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
    width: '85%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#0D2F5D',
  },
  inputIcon: {
    marginRight: 10,
    color: '#0D2F5D',
  },
  input: {
    flex: 1,
    height: 50,
    color: '#0D2F5D',
  },
  loginButton: {
    backgroundColor: '#0D2F5D',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: '85%',
    alignSelf: 'center',
    borderWidth: 0,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#0D2F5D',
  },
  signupLink: {
    color: '#0D2F5D',
    fontWeight: '600',
  },
});
