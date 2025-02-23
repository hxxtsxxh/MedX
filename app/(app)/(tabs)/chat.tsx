import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Animated, ImageBackground } from 'react-native';
import { useTheme, Text, TextInput, Surface, MD3Theme } from 'react-native-paper';
import { MotiView } from 'moti';
import { useChat } from '../../context/ChatContext';
import { useRouter } from 'expo-router';
import { Easing } from 'react-native';
import { format } from 'date-fns';

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
    let dotsInterval: NodeJS.Timeout | undefined;
    
    if (isLoading) {
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
      if (dotsInterval) {
        clearInterval(dotsInterval);
      }
      fadeAnim.setValue(0);
    }

    return () => {
      if (dotsInterval) {
        clearInterval(dotsInterval);
      }
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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={0}
    >
      <ImageBackground
        source={theme.dark 
          ? require('../../../assets/images/Dark_Background.png') 
          : require('../../../assets/images/Background.png')}
        style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chatContent}
      >
        {chatHistory.map((msg, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'spring',
              delay: index * 50,
              damping: 20,
              stiffness: 300,
            }}
            style={[
              styles.messageContainer,
              msg.role === 'user' ? styles.userMessage : styles.botMessage
            ]}
          >
            <Surface
              style={[
                styles.messageBubble,
                msg.role === 'user' ? {
                  backgroundColor: theme.colors.primary,
                  borderBottomRightRadius: 4,
                } : {
                  backgroundColor: theme.dark 
                    ? theme.colors.surfaceVariant
                    : theme.colors.surface,
                  borderBottomLeftRadius: 4,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }
              ]}
              elevation={2}
            >
              <Text style={[
                styles.messageText,
                { 
                  color: msg.role === 'user' 
                    ? theme.colors.onPrimary 
                    : theme.colors.onSurface 
                }
              ]}>
                {msg.content}
              </Text>
              <Text style={[
                styles.timestamp,
                { 
                  color: msg.role === 'user' 
                    ? theme.colors.onPrimary 
                    : theme.colors.onSurfaceVariant,
                  opacity: 0.7
                }
              ]}>
                {format(msg.timestamp, 'HH:mm')}
              </Text>
            </Surface>
          </MotiView>
        ))}
        {isLoading && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={[styles.messageContainer, styles.botMessage]}
          >
            <Surface
              style={[
                styles.messageBubble,
                styles.loadingBubble,
                { 
                  backgroundColor: theme.dark 
                    ? theme.colors.surfaceVariant
                    : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }
              ]}
              elevation={1}
            >
              <Text style={{ color: theme.colors.onSurface }}>
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
            backgroundColor: theme.dark 
              ? theme.colors.surface
              : theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outline,
          }
        ]}
        elevation={4}
      >
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          style={[styles.input, { backgroundColor: 'transparent' }]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          onSubmitEditing={sendMessage}
          multiline
          maxLength={500}
          right={
            <TextInput.Icon 
              icon="send"
              disabled={!message.trim() || isLoading}
              onPress={sendMessage}
              color={message.trim() ? theme.colors.primary : theme.colors.onSurfaceVariant}
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
    paddingTop: 130,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    minWidth: 60,
  },
  loadingBubble: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    padding: 8,
    paddingBottom: 0,
  },
  input: {
    fontSize: 13,
    maxHeight: 100,
  },
});
