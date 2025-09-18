// 🤖 DeckLab TCG - Google Gemini AI Assistant Interface
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Send,
  Sparkles,
  TrendingUp,
  DollarSign,
  Target,
  Zap,
  MessageCircle,
  Bot,
  User as UserIcon,
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { aiAssistantService } from '../../services/aiAssistantService';
import { GlassCard } from './GlassCard';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: ChatAction[];
}

interface ChatAction {
  type: 'organize_binder' | 'analyze_collection' | 'suggest_purchases';
  label: string;
  data?: any;
}

interface AIAssistantChatProps {
  visible: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const { width, height } = Dimensions.get('window');

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  visible,
  onClose,
  initialPrompt,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { collections } = useSelector((state: RootState) => state.collections);
  const { binders } = useSelector((state: RootState) => state.binder);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Animation values
  const typingDots = useSharedValue(0);
  const sendButtonScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: `Hello! I'm your Personal Card Assistant powered by Google Gemini. I can help you with:\n\n• Collection analysis and optimization\n• Market trends and price predictions\n• Binder organization by any criteria\n• Investment recommendations\n• Card identification and grading advice\n\nWhat would you like to know about your Pokemon TCG collection?`,
        timestamp: new Date().toISOString(),
        actions: [
          { type: 'analyze_collection', label: 'Analyze My Collection' },
          { type: 'suggest_purchases', label: 'Suggest Cards to Buy' },
          { type: 'organize_binder', label: 'Organize My Binders' },
        ],
      };
      setMessages([welcomeMessage]);

      if (initialPrompt) {
        setInputText(initialPrompt);
      }
    }
  }, [visible, initialPrompt]);

  useEffect(() => {
    if (isTyping) {
      typingDots.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
    } else {
      typingDots.value = 0;
    }
  }, [isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsProcessing(true);

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Build context for AI
      const context = {
        user: user ? {
          id: user.id,
          collectionsCount: Object.keys(collections).length,
          bindersCount: Object.keys(binders).length,
          totalCards: user.stats.totalCards,
          totalValue: user.stats.totalValue,
        } : null,
        collections: Object.values(collections).map(c => ({
          id: c.id,
          name: c.name,
          cardCount: c.stats.totalCards,
          value: c.stats.totalValue,
        })),
        binders: Object.values(binders).map(b => ({
          id: b.id,
          name: b.name,
          pageCount: b.pages.length,
        })),
      };

      const response = await aiAssistantService.processUserRequest(inputText.trim(), context);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        actions: response.actions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing AI request:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  const handleActionPress = async (action: ChatAction) => {
    setIsProcessing(true);
    
    try {
      let response = '';
      
      switch (action.type) {
        case 'analyze_collection':
          const collectionsArray = Object.values(collections);
          if (collectionsArray.length > 0) {
            const allCards = collectionsArray.flatMap(c => c.cards);
            response = await aiAssistantService.analyzeCollection(allCards);
          } else {
            response = "You don't have any collections yet. Start by creating a collection and adding some cards!";
          }
          break;
          
        case 'suggest_purchases':
          response = "Based on your collection, I recommend focusing on completing your Base Set collection. Charizard, Blastoise, and Venusaur would be excellent additions that typically hold their value well.";
          break;
          
        case 'organize_binder':
          response = "I can help organize your binders! Tell me how you'd like them organized - by value, rarity, color, set, or any custom criteria you have in mind.";
          break;
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.type === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <View style={styles.messageHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: isUser ? '#FFD700' : '#2A2A2A' }]}>
            {isUser ? (
              <UserIcon size={16} color="#0A0A0A" />
            ) : (
              <Bot size={16} color="#FFD700" />
            )}
          </View>
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        <GlassCard 
          style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}
          variant="flat"
        >
          <Text style={[styles.messageText, { color: isUser ? '#0A0A0A' : '#FFFFFF' }]}>
            {item.content}
          </Text>
          
          {item.actions && item.actions.length > 0 && (
            <View style={styles.actionsContainer}>
              {item.actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionButton}
                  onPress={() => handleActionPress(action)}
                  disabled={isProcessing}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.actionGradient}
                  >
                    <Text style={styles.actionText}>{action.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    const typingStyle = useAnimatedStyle(() => ({
      opacity: typingDots.value,
    }));

    return (
      <View style={[styles.messageContainer, styles.assistantMessage]}>
        <View style={styles.messageHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: '#2A2A2A' }]}>
            <Bot size={16} color="#FFD700" />
          </View>
        </View>
        
        <GlassCard style={[styles.messageBubble, styles.assistantBubble]} variant="flat">
          <Animated.View style={[styles.typingContainer, typingStyle]}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </Animated.View>
        </GlassCard>
      </View>
    );
  };

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const handleSendPress = () => {
    sendButtonScale.value = withSpring(0.9, { damping: 15 }, () => {
      sendButtonScale.value = withSpring(1, { damping: 15 });
    });
    handleSendMessage();
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={24} color="#FFD700" />
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={renderTypingIndicator}
      />

      {/* Input area */}
      <View style={styles.inputContainer}>
        <GlassCard style={styles.inputCard} variant="default">
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Ask me anything about Pokemon TCG..."
              placeholderTextColor="#666"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isProcessing}
            />
            
            <TouchableOpacity
              onPress={handleSendPress}
              disabled={!inputText.trim() || isProcessing}
              activeOpacity={0.7}
            >
              <Animated.View style={[styles.sendButton, sendButtonStyle]}>
                <LinearGradient
                  colors={inputText.trim() ? ['#FFD700', '#FFA500'] : ['#2A2A2A', '#2A2A2A']}
                  style={styles.sendGradient}
                >
                  <Send size={18} color={inputText.trim() ? '#0A0A0A' : '#666'} />
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    padding: 12,
  },
  userBubble: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
  },
  assistantBubble: {
    backgroundColor: 'transparent',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  inputCard: {
    backgroundColor: 'transparent',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'center',
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});