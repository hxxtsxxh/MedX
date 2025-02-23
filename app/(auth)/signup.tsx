import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Platform, Image, ImageBackground } from 'react-native';
import { Link, router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function SignUp(){
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: name
      });
      router.replace('/(app)/(tabs)')
    } catch (error) {
      setError((error as any).message);
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
        <Text style={[styles.subtitle, { color: '#0D2F5D' }]}>Your Medication Safety Companion</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#0D2F5D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

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
            placeholder="Create a password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#0D2F5D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Sign In</Text>
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
  subtitle: {
    fontSize: 16,
    color: '#0D2F5D',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorText: {
    color: '#B00020',
    textAlign: 'center',
    marginBottom: 16,
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
  signupButton: {
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
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#0D2F5D',
  },
  loginLink: {
    color: '#0D2F5D',
    fontWeight: '600',
  },
});
