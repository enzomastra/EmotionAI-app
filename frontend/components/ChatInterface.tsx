import React, { useState, useEffect, ReactNode, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPatientSessions, getAgentChat, sendMessageToAgent } from '@/services/api';
import Markdown from 'react-native-markdown-display';

const markdownStyles = {
  body: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  text: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  heading2: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  strong: {
    fontWeight: 'bold',
    color: '#333',
  },
  bullet_list: {
    marginVertical: 4,
  },
  bullet_list_icon: {
    color: '#F79C65',
  },
  link: {
    color: '#F79C65',
    textDecorationLine: 'underline',
  },
  paragraph: {
    marginBottom: 6,
  },
};

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  patientId: number;
  patientName: string;
  patientBubble?: ReactNode;
}

export default function ChatInterface({ patientId, patientName, patientBubble }: ChatInterfaceProps) {
  const flatListRef = useRef<FlatList<any>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [parsedSessionResults, setParsedSessionResults] = useState<{[key: string]: any}>({});
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [chatContext, setChatContext] = useState<'historical' | 'session' | null>(null);
  const [sessionEmotions, setSessionEmotions] = useState<{ [sessionId: string]: any }>({});

  useEffect(() => {
    loadSessions();
  }, [patientId]);

  const loadSessions = async () => {
    try {
      const response = await getPatientSessions(patientId);
      setSessions(response.data);
      
      const parsedResults: {[key: string]: any} = {};
      response.data.forEach((session: any) => {
        try {
          parsedResults[session.id] = JSON.parse(session.results);
        } catch (error) {
          console.error(`Error parsing session results for session ${session.id}:`, error);
          parsedResults[session.id] = {}; // Default to empty object if parsing fails
        }
      });
      setParsedSessionResults(parsedResults);
      console.log("Parsed Session Results after loading:", parsedResults);

    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadChatHistory = async () => {
    setLoading(true);
    try {
      const sessionIds = chatContext === 'session' && selectedSessions.length > 0 ? selectedSessions : undefined;
      const response = await getAgentChat(patientId, sessionIds);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([{
        role: 'agent',
        content: 'Sorry, there was an error loading the chat history. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleContextSelect = (context: 'historical' | 'session') => {
    setChatContext(context);
    if (context === 'session') {
      setShowSessionModal(true);
    } else {
      setSelectedSessions([]);
      // Limpiar mensajes y mostrar mensaje de bienvenida
      setMessages([{
        role: 'agent',
        content: 'I am ready to analyze the patient\'s historical data and provide recommendations based on the available information. What would you like to know?',
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const handleSessionSelect = (sessionId: number) => {
    setSelectedSessions(prev => {
      const newSelected = prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId];
      
      // Update sessionEmotions based on newly selected sessions
      const newSessionEmotions: {[key: string]: any} = {};
      newSelected.forEach(id => {
        if (parsedSessionResults[id]) {
          newSessionEmotions[id.toString()] = parsedSessionResults[id];
        } else {
          console.warn(`No parsed session results found for session ID: ${id}`);
        }
      });
      setSessionEmotions(newSessionEmotions);
      console.log("New Session Emotions after selection:", newSessionEmotions);

      return newSelected;
    });
  };

  const handleSessionModalClose = () => {
    setShowSessionModal(false);
    if (selectedSessions.length > 0) {
      // Mostrar mensaje de bienvenida para sesiones seleccionadas
      setMessages([{
        role: 'agent',
        content: `I have selected ${selectedSessions.length} session(s) to analyze. I am ready to provide recommendations based on these sessions. What would you like to know?`,
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      setLoading(true);
      let sessionIds = chatContext === 'session' && selectedSessions.length > 0 
        ? selectedSessions.map(id => id.toString())
        : undefined;
      let emotionsToSend = sessionEmotions;
      // Si es histórico, combinar todos los timelines y summaries
      if (chatContext === 'historical') {
        // Combinar todos los timelines y emotion_summary
        let combinedTimeline: { [second: string]: string } = {};
        let combinedSummary: { [emotion: string]: number } = {};
        Object.values(parsedSessionResults).forEach((result: any) => {
          if (result && result.timeline) {
            Object.entries(result.timeline).forEach(([second, emotion]) => {
              combinedTimeline[second as string] = emotion as string;
            });
          }
          if (result && result.emotion_summary) {
            Object.entries(result.emotion_summary).forEach(([emotion, count]) => {
              combinedSummary[emotion as string] = (combinedSummary[emotion as string] || 0) + Number(count);
            });
          }
        });
        emotionsToSend = {
          historical: {
            timeline: combinedTimeline,
            emotion_summary: combinedSummary
          }
        };
        sessionIds = undefined; // No enviar sessionIds en histórico
      }
      const response = await sendMessageToAgent(
        inputMessage,
        sessionIds,
        emotionsToSend,
        chatContext === 'historical' ? patientId : undefined
      );
      const timestamp = new Date().toISOString();
      setMessages(prev => [
        ...prev,
        { role: 'user', content: inputMessage, timestamp },
        { role: 'agent', content: response.data.recommendations, timestamp }
      ]);
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage & { sender?: 'user' | 'agent' } }) => {
    const isAgent = (item.sender || item.role) === 'agent';
    return (
      <View style={[
        styles.messageContainer,
        isAgent ? styles.agentMessage : styles.userMessage
      ]}>
        {isAgent ? (
          <Markdown
            style={markdownStyles}
            onError={() => null}
          >
            {item.content}
          </Markdown>
        ) : (
          <Text style={styles.userMessageText}>{item.content}</Text>
        )}
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
    );
  };

  const renderSessionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.sessionItem,
        selectedSessions.includes(item.id) && styles.selectedSession
      ]}
      onPress={() => handleSessionSelect(item.id)}
    >
      <Text style={styles.sessionDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
      {selectedSessions.includes(item.id) && (
        <MaterialCommunityIcons name="check" size={16} color="#F05219" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {chatContext && (
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information" size={18} color="#F05219" style={{ marginRight: 8 }} />
          <Text style={styles.infoBannerText}>
            Agent responses are recommendations and suggestions based on data analysis, not definitive diagnoses.
          </Text>
        </View>
      )}

      {!chatContext ? (
        <View style={styles.contextSelector}>
          <Text style={styles.contextTitle}>Select what you want to discuss:</Text>
          <TouchableOpacity
            style={styles.contextButton}
            onPress={() => handleContextSelect('historical')}
          >
            <MaterialCommunityIcons name="history" size={20} color="#fff" />
            <Text style={styles.contextButtonText}>Historical Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contextButton}
            onPress={() => handleContextSelect('session')}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#fff" />
            <Text style={styles.contextButtonText}>Specific Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {chatContext === 'session' && selectedSessions.length > 0 && (
            <View style={styles.selectedSessions}>
              <Text style={styles.selectedSessionsTitle}>
                Selected Sessions: {selectedSessions.length}
              </Text>
              <TouchableOpacity
                style={styles.changeSessionsButton}
                onPress={() => setShowSessionModal(true)}
              >
                <Text style={styles.changeSessionsText}>Change Sessions</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#F05219" style={styles.loader} />
          ) : (
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.messagesList}
              ref={flatListRef}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}
          {loading && (
            <View style={styles.typingContainer}>
              <View style={styles.agentMessage}>
                <View style={styles.typingDots}>
                  <MaterialCommunityIcons name="dots-horizontal" size={32} color="#F79C65" />
                </View>
              </View>
            </View>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              {patientBubble && (
                <View style={styles.inputPatientBubble}>{patientBubble}</View>
              )}
              <TextInput
                style={styles.input}
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Type your message..."
                placeholderTextColor="#bbb"
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={!inputMessage.trim()}
              >
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <Modal
        visible={showSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleSessionModalClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sessions</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleSessionModalClose}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={sessions}
              renderItem={renderSessionItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.sessionsList}
            />
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleSessionModalClose}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 8,
  },
  contextSelector: {
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    margin: 12,
  },
  contextTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    fontWeight: '600',
  },
  contextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F05219',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  contextButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: 'bold',
  },
  selectedSessions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff0eb',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F05219',
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedSessionsTitle: {
    fontSize: 14,
    color: '#F05219',
    fontWeight: 'bold',
  },
  changeSessionsButton: {
    padding: 8,
  },
  changeSessionsText: {
    color: '#F05219',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 0,
    paddingHorizontal: 12,
  },
  messageContainer: {
    flexDirection: 'column',
    marginVertical: 10,
    paddingHorizontal: 8,
    maxWidth: '100%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E3E3E3',
    borderRadius: 18,
    padding: 16,
    marginLeft: 40,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: '85%',
  },
  agentMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF6F2',
    borderRadius: 18,
    padding: 16,
    marginRight: 40,
    marginLeft: 0,
    shadowColor: '#F79C65',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: '85%',
  },
  userMessageText: {
    color: '#222',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  agentMessageText: {
    color: '#F05219',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 6,
    textAlign: 'right',
    marginRight: 2,
    fontFamily: 'Inter',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 16,
    marginTop: 0,
  },
  inputPatientBubble: {
    marginRight: 0,
    marginBottom: 0,
  },
  patientBubbleButton: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F05219',
    marginRight: 8,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: '#222',
    borderWidth: 1,
    borderColor: '#eee',
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F05219',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 22,
    width: '92%',
    maxHeight: '82%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  sessionsList: {
    paddingBottom: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(240,82,25,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedSession: {
    backgroundColor: '#fff0eb',
    borderWidth: 1.5,
    borderColor: '#F05219',
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  sessionDate: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: '#F05219',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFB74D',
    shadowColor: '#FFB74D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 1,
  },
  warningText: {
    color: '#E65100',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
    borderLeftWidth: 4,
    borderLeftColor: '#F05219',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    marginHorizontal: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoBannerText: {
    color: '#444',
    fontSize: 13,
    flex: 1,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 8,
    marginBottom: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
}); 