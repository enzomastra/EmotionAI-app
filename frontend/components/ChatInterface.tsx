import React, { useState, useEffect } from 'react';
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
import { FontAwesome } from '@expo/vector-icons';
import { getPatientSessions, getAgentChat, sendMessageToAgent } from '@/services/api';

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  patientId: number;
  patientName: string;
}

export default function ChatInterface({ patientId, patientName }: ChatInterfaceProps) {
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
        content: 'Lo siento, hubo un error al cargar el historial del chat. Por favor, intenta de nuevo.',
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
        content: 'Hola, estoy listo para analizar los datos históricos del paciente y proporcionar recomendaciones basadas en la información disponible. ¿Qué te gustaría saber?',
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
        content: `He seleccionado ${selectedSessions.length} sesiones para analizar. Estoy listo para proporcionar recomendaciones basadas en estas sesiones. ¿Qué te gustaría saber?`,
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      setLoading(true);
      const sessionIds = chatContext === 'session' && selectedSessions.length > 0 
        ? selectedSessions.map(id => id.toString())
        : undefined;
      const response = await sendMessageToAgent(
        inputMessage,
        sessionIds,
        sessionEmotions
      );
      
      const timestamp = new Date().toISOString();
      setMessages(prev => [
        ...prev,
        { role: 'user', content: inputMessage, timestamp },
        { role: 'agent', content: response.data.message, timestamp }
      ]);
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.agentMessage
    ]}>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

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
        <FontAwesome name="check" size={16} color="#F05219" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat with Agent ({patientName})</Text>

      {chatContext && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Las respuestas del agente son recomendaciones y sugerencias basadas en el análisis de datos, no diagnósticos definitivos.
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
            <FontAwesome name="history" size={20} color="#fff" />
            <Text style={styles.contextButtonText}>Historical Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contextButton}
            onPress={() => handleContextSelect('session')}
          >
            <FontAwesome name="calendar" size={20} color="#fff" />
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
            />
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Type your message..."
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={!inputMessage.trim()}
            >
              <FontAwesome name="send" size={20} color="#fff" />
            </TouchableOpacity>
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
                <FontAwesome name="times" size={24} color="#666" />
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  contextSelector: {
    padding: 16,
  },
  contextTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  contextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F05219',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  contextButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  selectedSessions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedSessionsTitle: {
    fontSize: 14,
    color: '#666',
  },
  changeSessionsButton: {
    padding: 8,
  },
  changeSessionsText: {
    color: '#F05219',
    fontSize: 14,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  agentMessage: {
    backgroundColor: '#2C2C2E',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F05219',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  sessionsList: {
    paddingBottom: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedSession: {
    backgroundColor: '#fff0eb',
    borderWidth: 1,
    borderColor: '#F05219',
  },
  sessionDate: {
    fontSize: 14,
    color: '#333',
  },
  doneButton: {
    backgroundColor: '#F05219',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  warningText: {
    color: '#E65100',
    fontSize: 14,
    textAlign: 'center',
  },
}); 