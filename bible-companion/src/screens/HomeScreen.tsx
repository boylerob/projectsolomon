import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView,
  Alert,
  Dimensions
} from 'react-native';
import AgentService, { AgentResponse, UserContext, ImmediateResponse } from '../services/AgentService';

const { width } = Dimensions.get('window');

export const HomeScreen = () => {
  const [question, setQuestion] = useState('');
  // const [mode, setMode] = useState<'chat' | 'summary' | 'deep'>('chat');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [immediateResponse, setImmediateResponse] = useState<ImmediateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [isSolomonAsked, setIsSolomonAsked] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{question: string, response: string}>>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState('');

  // const modes = [
  //   { label: 'Chat', value: 'chat' as const, description: 'Quick, conversational response' },
  //   { label: 'Summary', value: 'summary' as const, description: 'Structured overview with key points' },
  //   { label: 'Deep', value: 'deep' as const, description: 'Comprehensive study with detailed analysis' },
  // ];

  useEffect(() => {
    initializeContext();
  }, []);

  const initializeContext = async () => {
    try {
      const context = await AgentService.initializeUserContext();
      setUserContext(context);
    } catch (error) {
      console.error('Error initializing context:', error);
    }
  };

  const askSolomon = async () => {
    if (!question.trim()) return;
    setIsSolomonAsked(true);
    
    setLoading(true);
    setAiLoading(false);
    setError('');
    setResponse(null);
    setImmediateResponse(null);
    setShowFollowUps(false);

    try {
      // Get immediate response first
      const immediate = await AgentService.getImmediateResponse(question);
      setImmediateResponse(immediate);
      setLoading(false);

      // If the immediate response is complete, we're done
      if (immediate.isComplete) {
        const completeResponse = await AgentService.askQuestion(question, 'chat'); // Default to chat mode for immediate response
        setResponse(completeResponse);
        setShowFollowUps(true);
        return;
      }

      // Otherwise, show AI processing
      setAiLoading(true);
      const agentResponse = await AgentService.askQuestion(question, 'chat'); // Default to chat mode for full response
      setResponse(agentResponse);
      setShowFollowUps(true);
    } catch (err: any) {
      setError('Error contacting Solomon. Please try again.');
      console.error('Error asking question:', err);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const askFollowUp = async () => {
    if (!followUpQuestion.trim()) return;
    
    // Add to conversation history
    const newEntry = {
      question: followUpQuestion,
      response: 'Processing...'
    };
    setConversationHistory([...conversationHistory, newEntry]);
    
    try {
      const followUpResponse = await AgentService.askQuestion(followUpQuestion, 'chat');
      
      // Update the conversation history with the actual response
      setConversationHistory(prev => 
        prev.map((entry, index) => 
          index === prev.length - 1 
            ? { ...entry, response: followUpResponse.content }
            : entry
        )
      );
      
      setFollowUpQuestion('');
    } catch (err: any) {
      setError('Error asking follow-up question. Please try again.');
      console.error('Error asking follow-up:', err);
    }
  };

  const handleFollowUpQuestion = (followUpQuestion: string) => {
    setFollowUpQuestion(followUpQuestion);
    setShowFollowUps(false);
    // Auto-ask the follow-up question
    setTimeout(() => askFollowUp(), 100);
  };

  const rateResponse = async (rating: number) => {
    if (response) {
      try {
        await AgentService.rateResponse(response.content, rating);
        Alert.alert('Thank you!', 'Your feedback helps Solomon improve.');
      } catch (error) {
        console.error('Error rating response:', error);
      }
    }
  };

  const renderImmediateResponse = () => {
    if (!immediateResponse) return null;

    const getResponseTypeColor = () => {
      switch (immediateResponse.type) {
        case 'factual': return '#17a2b8';
        case 'conversational': return '#28a745';
        case 'clarification': return '#ffc107';
        default: return '#6c757d';
      }
    };

    const getResponseTypeText = () => {
      switch (immediateResponse.type) {
        case 'factual': return 'Factual Answer';
        case 'conversational': return 'Processing...';
        case 'clarification': return 'Clarification';
        default: return 'Response';
      }
    };

    return (
      <View style={styles.immediateResponseContainer}>
        <View style={[styles.responseTypeBadge, { backgroundColor: getResponseTypeColor() }]}>
          <Text style={styles.responseTypeText}>{getResponseTypeText()}</Text>
        </View>
        <Text style={styles.immediateResponseText}>{immediateResponse.text}</Text>
        
        {aiLoading && immediateResponse.type === 'conversational' && (
          <View style={styles.aiProcessingContainer}>
            <ActivityIndicator size="small" color="#4B0082" />
            <Text style={styles.aiProcessingText}>Solomon is thinking deeper about this...</Text>
          </View>
        )}
      </View>
    );
  };

  const renderScriptureReferences = () => {
    if (!response?.scriptureReferences || response.scriptureReferences.length === 0) {
      return null;
    }

    return (
      <View style={styles.scriptureSection}>
        <Text style={styles.sectionTitle}>📖 Scripture References</Text>
        {response.scriptureReferences.map((ref, index) => (
          <View key={index} style={styles.scriptureItem}>
            <Text style={styles.scriptureReference}>{ref.reference}</Text>
            <Text style={styles.scriptureText}>{ref.text}</Text>
            <Text style={styles.scriptureContext}>{ref.context}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPersonalApplication = () => {
    if (!response?.personalApplication) return null;

    return (
      <View style={styles.applicationSection}>
        <Text style={styles.sectionTitle}>💡 Personal Application</Text>
        <Text style={styles.applicationText}>{response.personalApplication}</Text>
      </View>
    );
  };

  const renderFurtherStudy = () => {
    if (!response?.furtherStudy || response.furtherStudy.length === 0) return null;

    return (
      <View style={styles.studySection}>
        <Text style={styles.sectionTitle}>📚 Further Study</Text>
        {response.furtherStudy.map((study, index) => (
          <View key={index} style={styles.studyItem}>
            <Text style={styles.studyTopic}>{study.topic}</Text>
            <Text style={styles.studyScriptures}>
              Scriptures: {study.scriptures.join(', ')}
            </Text>
            <Text style={styles.studyTime}>⏱ {study.estimatedTime}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderFollowUpQuestions = () => {
    if (!showFollowUps || !response?.followUpQuestions || response.followUpQuestions.length === 0) {
      return null;
    }

    return (
      <View style={styles.followUpSection}>
        <Text style={styles.sectionTitle}>🤔 Explore Further</Text>
        {response.followUpQuestions.map((followUp, index) => (
          <TouchableOpacity
            key={index}
            style={styles.followUpButton}
            onPress={() => handleFollowUpQuestion(followUp)}
          >
            <Text style={styles.followUpText}>{followUp}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderResponseRating = () => {
    if (!response) return null;

    return (
      <View style={styles.ratingSection}>
        <Text style={styles.ratingTitle}>Was this helpful?</Text>
        <View style={styles.ratingButtons}>
          <TouchableOpacity
            style={[styles.ratingButton, styles.thumbsDown]}
            onPress={() => rateResponse(1)}
          >
            <Text style={styles.ratingButtonText}>👎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ratingButton, styles.thumbsUp]}
            onPress={() => rateResponse(5)}
          >
            <Text style={styles.ratingButtonText}>👍</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ask Solomon</Text>
        <Text style={styles.subtitle}>Your AI Bible Companion</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Initial Question Input - Only show if not asked yet */}
        {!isSolomonAsked && (
          <>
            <View style={styles.inputSection}>
              <TextInput
                style={styles.input}
                placeholder="What would you like to ask Solomon?"
                value={question}
                onChangeText={setQuestion}
                editable={!loading}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{question.length}/500</Text>
            </View>

            <TouchableOpacity
              style={[styles.askButton, (!question.trim() || loading) && styles.askButtonDisabled]}
              onPress={askSolomon}
              disabled={loading || !question.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.askButtonText}>Ask Solomon</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Anchor Question Headline */}
        {isSolomonAsked && question && (
          <View style={styles.anchorQuestionContainer}>
            <Text style={styles.anchorQuestionLabel}>Your Question:</Text>
            <Text style={styles.anchorQuestionText}>{question}</Text>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4B0082" />
            <Text style={styles.loadingText}>Solomon is thinking...</Text>
          </View>
        )}

        {/* Error State */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Initial Response */}
        {response && (
          <View style={styles.initialResponseContainer}>
            <Text style={styles.responseText}>{response.content}</Text>
            {renderScriptureReferences()}
            {renderFurtherStudy()}
            {renderFollowUpQuestions()}
          </View>
        )}

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <View style={styles.conversationContainer}>
            <Text style={styles.conversationTitle}>Conversation</Text>
            {conversationHistory.map((entry, index) => (
              <View key={index} style={styles.conversationEntry}>
                <View style={styles.questionBubble}>
                  <Text style={styles.questionText}>{entry.question}</Text>
                </View>
                <View style={styles.responseBubble}>
                  <Text style={styles.responseText}>{entry.response}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Follow-up Q&A Section */}
        {isSolomonAsked && (
          <View style={styles.followUpSection}>
            <Text style={styles.followUpTitle}>Ask a follow-up question:</Text>
            <View style={styles.followUpInputContainer}>
              <TextInput
                style={styles.followUpInput}
                placeholder="Type your follow-up question..."
                value={followUpQuestion}
                onChangeText={setFollowUpQuestion}
                multiline
                maxLength={300}
                returnKeyType="send"
                onSubmitEditing={askFollowUp}
              />
              <TouchableOpacity
                style={[styles.followUpSubmitButton, (!followUpQuestion.trim()) && styles.followUpSubmitButtonDisabled]}
                onPress={askFollowUp}
                disabled={!followUpQuestion.trim()}
              >
                <Text style={styles.followUpSubmitButtonText}>Ask</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  scrollContent: {
    padding: 20,
    flex: 1,
  },
  modeSection: {
    marginBottom: 20,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#4B0082',
    borderColor: '#4B0082',
  },
  modeButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  modeDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  modeDescriptionActive: {
    color: '#fff',
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    backgroundColor: '#fafafa',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  askButton: {
    backgroundColor: '#4B0082',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  askButtonDisabled: {
    backgroundColor: '#ccc',
  },
  askButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  immediateResponseContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  responseTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  responseTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  immediateResponseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  aiProcessingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  aiProcessingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  responseContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  mainResponse: {
    marginBottom: 15,
  },
  responseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  scriptureSection: {
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B0082',
    marginBottom: 10,
  },
  scriptureItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  scriptureReference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B0082',
    marginBottom: 5,
  },
  scriptureText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  scriptureContext: {
    fontSize: 12,
    color: '#666',
  },
  applicationSection: {
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  applicationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  studySection: {
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  studyItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  studyTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  studyScriptures: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  studyTime: {
    fontSize: 12,
    color: '#4B0082',
  },
  followUpSection: {
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  followUpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  followUpButton: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  followUpText: {
    fontSize: 14,
    color: '#1976d2',
  },
  ratingSection: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  ratingButton: {
    padding: 10,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  thumbsUp: {
    backgroundColor: '#4caf50',
  },
  thumbsDown: {
    backgroundColor: '#f44336',
  },
  ratingButtonText: {
    fontSize: 18,
  },
  anchorQuestionContainer: {
    backgroundColor: '#f0f7f4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  anchorQuestionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  anchorQuestionText: {
    fontSize: 16,
    color: '#28a745',
    fontStyle: 'italic',
  },
  initialResponseContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  conversationContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B0082',
    marginBottom: 10,
    textAlign: 'center',
  },
  conversationEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  questionBubble: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    maxWidth: '80%',
  },
  questionText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  responseBubble: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
    borderBottomRightRadius: 0,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  followUpInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  followUpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
    marginRight: 10,
    minHeight: 40,
  },
  followUpSubmitButton: {
    backgroundColor: '#4B0082',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  followUpSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  followUpSubmitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 