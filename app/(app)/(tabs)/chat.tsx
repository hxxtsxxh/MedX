import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native';
import { useTheme, Text, TextInput, Surface, MD3Theme } from 'react-native-paper';
import { MotiView } from 'moti';
import { useChat } from '../../context/ChatContext';
import { useRouter } from 'expo-router';
import { Easing } from 'react-native';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function Chat() {
  const theme = useTheme<MD3Theme>();
  const { processChatMessage } = useChat();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { 
      role: 'bot', 
      content: `Hello! I'm your medication assistant. I can help you with:
    • Today's medication schedule
    • Future medication timings
    • Drug interactions
    • Health advice
    • Symptom guidance
    • How to use the app
How can I assist you today?`, 
      timestamp: new Date() 
    }
  ]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [dots, setDots] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Add keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Add this animation effect
  useEffect(() => {
    let dotsInterval: NodeJS.Timeout;
    
    if (isLoading) {
      // Start dots animation
      dotsInterval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      clearInterval(dotsInterval);
      fadeAnim.setValue(0);
    }

    return () => {
      clearInterval(dotsInterval);
    };
  }, [isLoading]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const botResponse = await processChatMessage(message, chatHistory);
      setChatHistory(prev => [...prev, {
        role: 'bot',
        content: botResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'I apologize, but I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        if (error.message === 'User not authenticated') {
          errorMessage = 'Please sign in to use the chat feature.';
          router.replace('/login');
        }
      }
      
      setChatHistory(prev => [...prev, {
        role: 'bot',
        content: errorMessage,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ 
          paddingBottom: keyboardVisible ? 16 : 0 // No padding when keyboard is hidden
        }}
      >
        {chatHistory.map((msg, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              duration: 300,
              delay: index * 100,
            }}
            style={[
              styles.messageContainer,
              msg.role === 'user' ? styles.userMessage : styles.botMessage
            ]}
          >
            <Surface
              style={[
                styles.messageBubble,
                {
                  backgroundColor: msg.role === 'user' ? theme.colors.primary : theme.colors.surfaceVariant
                }
              ]}
            >
              <Text style={{ color: msg.role === 'user' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>
                {msg.content}
              </Text>
            </Surface>
          </MotiView>
        ))}
        {isLoading && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 300 }}
            style={[styles.messageContainer, styles.botMessage]}
          >
            <Surface
              style={[
                styles.messageBubble,
                { backgroundColor: theme.colors.surfaceVariant }
              ]}
            >
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Typing{dots}
              </Text>
            </Surface>
          </MotiView>
        )}
      </ScrollView>

      <Surface 
        style={[
          styles.inputContainer, 
          { 
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            paddingBottom: Platform.OS === 'ios' ? 20 : 16,
            marginBottom: keyboardVisible ? 0 : Platform.OS === 'ios' ? 34 : 24 // Increased margin when keyboard is hidden
          }
        ]}
      >
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          style={[styles.input, {
            backgroundColor: 'transparent',
            fontSize: 16,
            color: theme.colors.onSurface,
          }]}
          onFocus={() => {
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          }}
          right={
            <TextInput.Icon 
              icon="send"
              disabled={!message.trim() || isLoading}
              onPress={sendMessage}
              color={theme.colors.primary}
            />
          }
        />
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  inputContainer: {
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    marginBottom: Platform.OS === 'ios' ? 0 : 8,
    borderTopWidth: 0,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingContainer: {
    alignItems: 'flex-start',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  loadingBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
}); 