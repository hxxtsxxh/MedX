import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

const StartScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MedX</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Login"
          onPress={() => navigation.navigate('Login')}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Sign Up"
          onPress={() => navigation.navigate('Signup')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  buttonSpacer: {
    height: 15,
  }
});

export default StartScreen;
