# MedX - AI-Integrated Drug Interaction Checker

MedX is a React Native app built using Expo that utilizes NLP, OCR, and machine learning to analyze drug labels, predict interactions, and provide risk assessments. It integrates with Firebase for authentication and data storage while maintaining a sleek and interactive UI.

## Features

* **AI-driven drug interaction analysis**
* **OCR-based medication label scanning** 
* **Secure authentication using Firebase**
* **User profile and personalizations**
* **Chatbot-based medical assistant and FAQ**
* **Elegant animations and intuitive UI**

## APIs Used

### OpenFDA API
We utilize the **OpenFDA API** to fetch drug-related data, including side effects, interactions, and detailed drug information. This helps MedX provide accurate predictions and warnings about potential drug interactions based on a user's medication input.

### Gemini API
The **Gemini API** is integrated to enhance our chatbot-based medical assistant. It leverages advanced NLP models to provide personalized responses, answer medical-related queries, and offer real-time assistance in analyzing drug interactions.

## Prerequisites

Ensure you have the following installed:

* **Node.js** (LTS recommended) - Download
* **npm** or **yarn**
* **Expo CLI** - Install globally using:

```bash
npm install -g expo-cli
```

* **Android Studio** (for Android emulator) OR **Xcode** (for iOS simulator)
* **Expo Go** app (for running on a real device) - Download for Android | Download for iOS

## Installation & Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/hxxtsxxh/medx.git
cd medx
npm install  # or yarn install
```

## Setting Up Firebase

1. Create a Firebase project in Firebase Console.
4. Add your Firebase configuration in `firebaseConfig.js`.

## Setting Up Other APIs

1. Visit aistudio.google.com for Gemini API
2. Visit open.fda.gov/apis for OpenFDA API

## Running the App

### On a Physical Device (Recommended)
Ensure your phone and development machine are on the same network.

```bash
npx expo start
```

Scan the QR code using **Expo Go** on your mobile device.

### On an Android Emulator
1. Open **Android Studio** and start an emulator.
2. Run:

```bash
npx expo start
```

3. Press `a` in the terminal to launch the app on the emulator.

### On an iOS Simulator
1. Open **Xcode** and start an iOS simulator.
2. Run:

```bash
npx expo start
```

3. Press `i` in the terminal to launch the app on the simulator.

