import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';

interface SolomonChatModalProps {
  visible: boolean;
  onClose: () => void;
}

const SOLOMON_API_URL = 'https://us-central1-book-guide-7ef1e.cloudfunctions.net/api/ask';

const modes = [
  { label: 'Chat', value: 'short' },
  { label: 'Summary', value: 'summary' },
  { label: 'Deep', value: 'deep' },
];

const SolomonChatModal: React.FC<SolomonChatModalProps> = ({ visible, onClose }) => {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState('short');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askSolomon = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    setResponse('');
    try {
      const res = await axios.post(SOLOMON_API_URL, {
        prompt: question,
        contextLevel: mode,
      });
      setResponse(res.data.response);
    } catch (err: any) {
      setError('Error contacting Solomon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setQuestion('');
    setResponse('');
    setError('');
    setLoading(false);
    onClose();
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
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <Text style={styles.title}>Ask Solomon</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your question..."
              value={question}
              onChangeText={setQuestion}
              editable={!loading}
              multiline
            />
            <View style={styles.modeRow}>
              {modes.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.modeButton, mode === m.value && styles.modeButtonActive]}
                  onPress={() => setMode(m.value)}
                  disabled={loading}
                >
                  <Text style={[styles.modeButtonText, mode === m.value && styles.modeButtonTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.askButton}
              onPress={askSolomon}
              disabled={loading || !question.trim()}
            >
              <Text style={styles.askButtonText}>{loading ? 'Asking...' : 'Ask Solomon'}</Text>
            </TouchableOpacity>
            {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 10 }} />}
            {response ? <Text style={styles.response}>{response}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal} disabled={loading}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContent: {
    padding: 20,
    maxHeight: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#fafafa',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modeButtonText: {
    color: '#333',
    fontSize: 14,
  },
  modeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  askButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  askButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  response: {
    marginTop: 10,
    color: '#333',
    fontSize: 16,
    backgroundColor: '#f6f6f6',
    borderRadius: 8,
    padding: 10,
    lineHeight: 24,
  },
  error: {
    marginTop: 10,
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SolomonChatModal; 