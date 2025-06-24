import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import axios from 'axios';

interface PrayerPartnerModalProps {
  visible: boolean;
  onClose: () => void;
  userContext?: string; // Optional context from other parts of the app
}

const PRAYER_PARTNER_API_URL = 'https://us-central1-book-guide-7ef1e.cloudfunctions.net/api/ask';

const prayerModes = [
  { label: 'Daily Prayer', value: 'daily', description: 'Start your day with God' },
  { label: 'Intercession', value: 'intercession', description: 'Pray for others' },
  { label: 'Thanksgiving', value: 'thanksgiving', description: 'Express gratitude' },
  { label: 'Confession', value: 'confession', description: 'Seek forgiveness' },
  { label: 'Guidance', value: 'guidance', description: 'Ask for wisdom' },
  { label: 'Custom', value: 'custom', description: 'Share your specific need' },
];

const PrayerPartnerModal: React.FC<PrayerPartnerModalProps> = ({ visible, onClose, userContext }) => {
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize conversation when modal opens
  useEffect(() => {
    if (visible && !isInitialized) {
      initializeConversation();
    }
  }, [visible]);

  const initializeConversation = () => {
    const welcomeMessage = `Hello! I'm your Prayer Partner. I'm here to help you connect with God through prayer. 

I can help you with:
• Daily prayers and devotions
• Praying for specific needs or situations
• Intercessory prayer for others
• Thanksgiving and gratitude prayers
• Confession and repentance
• Seeking God's guidance and wisdom

${userContext ? `I notice you've been studying about: ${userContext}. I can incorporate relevant biblical wisdom into our prayer time.` : ''}

What would you like to pray about today? You can choose a prayer mode or simply share what's on your heart.`;

    setConversation([{ role: 'assistant', content: welcomeMessage }]);
    setIsInitialized(true);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage = { role: 'user' as const, content: message };
    setConversation(prev => [...prev, userMessage]);
    setCurrentInput('');
    setLoading(true);
    setError('');

    try {
      // Create a context-aware prompt for the AI
      const contextPrompt = `You are a compassionate Prayer Partner, a wise spiritual guide who helps people connect with God through prayer. 

Your role is to:
1. Listen empathetically to the person's needs and concerns
2. Help them formulate meaningful, personalized prayers
3. Incorporate relevant biblical wisdom and scripture references
4. Guide them through prayer step-by-step when appropriate
5. Provide spiritual encouragement and comfort
6. Suggest relevant Bible verses that relate to their situation

Current conversation context:
${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's message: ${message}

${userContext ? `Additional context: The user has been studying about ${userContext}. Incorporate relevant biblical themes and wisdom.` : ''}

Respond as a caring Prayer Partner who speaks with warmth, wisdom, and biblical insight. Keep responses conversational but spiritually meaningful. When appropriate, suggest specific Bible verses or prayer structures that would be helpful.`;

      const res = await axios.post(PRAYER_PARTNER_API_URL, {
        prompt: contextPrompt,
        contextLevel: 'deep', // Use deep context for more meaningful prayer guidance
      });

      const assistantMessage = { role: 'assistant' as const, content: res.data.response };
      setConversation(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError('I\'m having trouble connecting right now. Please try again.');
      console.error('Prayer Partner API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
    let modePrompt = '';
    
    switch (mode) {
      case 'daily':
        modePrompt = 'I\'d like to start my day with prayer. Can you help me create a morning prayer that sets the right tone for my day?';
        break;
      case 'intercession':
        modePrompt = 'I want to pray for others. Can you help me with intercessory prayer? I can share specific people or situations that need prayer.';
        break;
      case 'thanksgiving':
        modePrompt = 'I want to express gratitude to God. Can you help me create a prayer of thanksgiving?';
        break;
      case 'confession':
        modePrompt = 'I need to confess and seek forgiveness. Can you guide me through a prayer of repentance?';
        break;
      case 'guidance':
        modePrompt = 'I\'m facing a difficult decision and need God\'s guidance. Can you help me pray for wisdom and direction?';
        break;
      case 'custom':
        modePrompt = 'I have a specific situation or need I\'d like to pray about. Can you help me formulate a prayer for this?';
        break;
    }
    
    sendMessage(modePrompt);
  };

  const closeModal = () => {
    setConversation([]);
    setCurrentInput('');
    setError('');
    setLoading(false);
    setSelectedMode('');
    setIsInitialized(false);
    onClose();
  };

  const renderMessage = (message: {role: 'user' | 'assistant', content: string}, index: number) => (
    <View key={index} style={[styles.messageContainer, message.role === 'user' ? styles.userMessage : styles.assistantMessage]}>
      <Text style={[styles.messageText, message.role === 'user' ? styles.userMessageText : styles.assistantMessageText]}>
        {message.content}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Prayer Partner</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.conversationContainer} showsVerticalScrollIndicator={false}>
            {conversation.map(renderMessage)}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4A90E2" />
                <Text style={styles.loadingText}>Prayer Partner is thinking...</Text>
              </View>
            )}
            {error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>

          {!selectedMode && conversation.length === 1 && (
            <View style={styles.modeSelection}>
              <Text style={styles.modeTitle}>Choose a prayer focus:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
                {prayerModes.map((mode) => (
                  <TouchableOpacity
                    key={mode.value}
                    style={styles.modeButton}
                    onPress={() => handleModeSelect(mode.value)}
                    disabled={loading}
                  >
                    <Text style={styles.modeButtonText}>{mode.label}</Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Share what's on your heart..."
              value={currentInput}
              onChangeText={setCurrentInput}
              onSubmitEditing={() => sendMessage(currentInput)}
              editable={!loading}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !currentInput.trim() && styles.sendButtonDisabled]}
              onPress={() => sendMessage(currentInput)}
              disabled={loading || !currentInput.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '95%',
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  conversationContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f3f4',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#2c3e50',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f1f3f4',
    borderRadius: 18,
    alignSelf: 'flex-start',
  },
  loadingText: {
    marginLeft: 8,
    color: '#7f8c8d',
    fontSize: 14,
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  modeSelection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  modeScroll: {
    flexDirection: 'row',
  },
  modeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 8,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrayerPartnerModal; 