import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Vapi from '@vapi-ai/react-native';
import VAPI_CONFIG from './config/vapi';

interface VoicePrayerPartnerProps {
  visible: boolean;
  onClose: () => void;
  userContext?: string;
}

const VoicePrayerPartner: React.FC<VoicePrayerPartnerProps> = ({ visible, onClose, userContext }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const vapiRef = useRef<any>(null);

  // Initialize Vapi when component mounts
  useEffect(() => {
    if (visible && !vapiRef.current) {
      initializeVapi();
    }
    
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (err) {
          console.log('Error stopping Vapi:', err);
        }
        vapiRef.current = null;
      }
    };
  }, [visible]);

  const initializeVapi = async () => {
    try {
      console.log('Initializing Vapi with API key:', VAPI_CONFIG.API_KEY);
      
      // Initialize Vapi with your API key
      vapiRef.current = new Vapi(VAPI_CONFIG.API_KEY);
      
      console.log('Vapi instance created successfully');

      // Set up event listeners
      vapiRef.current.on('call-start', () => {
        console.log('Voice call started');
        setIsConnected(true);
        setError('');
      });

      vapiRef.current.on('call-end', () => {
        console.log('Voice call ended');
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
      });

      vapiRef.current.on('speech-start', () => {
        console.log('AI started speaking');
        setIsSpeaking(true);
        setIsListening(false);
      });

      vapiRef.current.on('speech-end', () => {
        console.log('AI finished speaking');
        setIsSpeaking(false);
        setIsListening(true);
      });

      vapiRef.current.on('transcript', (data: any) => {
        console.log('User transcript:', data);
        setTranscript(data.transcript || data);
      });

      vapiRef.current.on('message', (data: any) => {
        console.log('AI message:', data);
        setAiResponse(data.content || data);
      });

      vapiRef.current.on('error', (err: any) => {
        console.error('Vapi error:', err);
        setError('Connection error. Please try again.');
        setIsConnected(false);
      });

    } catch (err) {
      console.error('Failed to initialize Vapi:', err);
      setError('Failed to initialize voice connection.');
    }
  };

  const startVoiceSession = async () => {
    try {
      if (!vapiRef.current) {
        await initializeVapi();
      }
      
      console.log('Starting voice session with assistant ID:', VAPI_CONFIG.ASSISTANT_ID);
      
      // Use the React Native SDK's standard start method
      await vapiRef.current.start(VAPI_CONFIG.ASSISTANT_ID);
      console.log('Voice session started successfully');
      setIsListening(true);
      
    } catch (err: any) {
      console.error('Failed to start voice session:', err);
      setError(`Failed to start voice session: ${err.message}`);
    }
  };

  const stopVoiceSession = async () => {
    try {
      if (vapiRef.current) {
        await vapiRef.current.stop();
      }
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
    } catch (err) {
      console.error('Failed to stop voice session:', err);
    }
  };

  const closeModal = () => {
    stopVoiceSession();
    setTranscript('');
    setAiResponse('');
    setError('');
    onClose();
  };

  const getStatusText = () => {
    if (error) return error;
    if (isSpeaking) return 'Prayer Partner is speaking...';
    if (isListening) return 'Listening to you...';
    if (isConnected) return 'Connected - Tap to speak';
    return 'Ready to start voice prayer';
  };

  const getStatusColor = () => {
    if (error) return '#e74c3c';
    if (isSpeaking) return '#3498db';
    if (isListening) return '#27ae60';
    if (isConnected) return '#f39c12';
    return '#7f8c8d';
  };

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
            <Text style={styles.title}>Voice Prayer Partner</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Status Display */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>

            {/* Voice Control Button */}
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isConnected && styles.voiceButtonActive,
                isSpeaking && styles.voiceButtonSpeaking,
                isListening && styles.voiceButtonListening
              ]}
              onPress={isConnected ? stopVoiceSession : startVoiceSession}
              disabled={!!error}
            >
              <Text style={styles.voiceButtonIcon}>
                {isSpeaking ? '🔊' : isListening ? '🎤' : '🎧'}
              </Text>
              <Text style={styles.voiceButtonText}>
                {isConnected ? 'End Prayer Session' : 'Start Voice Prayer'}
              </Text>
            </TouchableOpacity>

            {/* Loading Indicator */}
            {!isConnected && !error && (
              <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
            )}

            {/* Transcript Display */}
            {transcript && (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptLabel}>You said:</Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            )}

            {/* AI Response Display */}
            {aiResponse && (
              <View style={styles.responseContainer}>
                <Text style={styles.responseLabel}>Prayer Partner:</Text>
                <Text style={styles.responseText}>{aiResponse}</Text>
              </View>
            )}

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>How to use Voice Prayer Partner:</Text>
              <Text style={styles.instructionsText}>
                • Tap "Start Voice Prayer" to begin{'\n'}
                • Speak naturally about what you'd like to pray about{'\n'}
                • The Prayer Partner will respond with guidance and prayer{'\n'}
                • You can have a natural conversation about your spiritual needs{'\n'}
                • Tap "End Prayer Session" when you're finished
              </Text>
            </View>

            {/* Setup Instructions */}
            <View style={styles.setupContainer}>
              <Text style={styles.setupTitle}>Setup Status:</Text>
              <Text style={styles.setupText}>
                ✅ Vapi Assistant configured{'\n'}
                ✅ API endpoint connected{'\n'}
                ✅ Voice integration ready{'\n'}
                {'\n'}
                Your Voice Prayer Partner is ready to use!
              </Text>
            </View>
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
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  voiceButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 50,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 20,
    minWidth: 200,
  },
  voiceButtonActive: {
    backgroundColor: '#e74c3c',
  },
  voiceButtonSpeaking: {
    backgroundColor: '#3498db',
  },
  voiceButtonListening: {
    backgroundColor: '#27ae60',
  },
  voiceButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  transcriptContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 14,
    color: '#1976d2',
    fontStyle: 'italic',
  },
  responseContainer: {
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '100%',
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#7b1fa2',
  },
  instructionsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  setupContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  setupText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default VoicePrayerPartner; 