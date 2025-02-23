import Constants from 'expo-constants';
import { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID, GEMINI_API_KEY } from '@env';

export default {
  firebaseApiKey: FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey,
  firebaseAuthDomain: FIREBASE_AUTH_DOMAIN || Constants.expoConfig?.extra?.firebaseAuthDomain,
  firebaseProjectId: FIREBASE_PROJECT_ID || Constants.expoConfig?.extra?.firebaseProjectId,
  firebaseStorageBucket: FIREBASE_STORAGE_BUCKET || Constants.expoConfig?.extra?.firebaseStorageBucket,
  firebaseMessagingSenderId: FIREBASE_MESSAGING_SENDER_ID || Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  firebaseAppId: FIREBASE_APP_ID || Constants.expoConfig?.extra?.firebaseAppId,
  geminiApiKey: GEMINI_API_KEY || Constants.expoConfig?.extra?.geminiApiKey,
}; 
