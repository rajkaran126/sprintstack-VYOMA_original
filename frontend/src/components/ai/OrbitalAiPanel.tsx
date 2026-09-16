import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  History,
  Plus,
  Trash2,
  ChevronLeft,
  MessageSquare,
} from 'lucide-react';
import { sendChatMessage } from '../../services/api';
import { ChatMessage, AnalysisResult, Encounter } from '../../types';

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface OrbitalAiPanelProps {
  analysis?: AnalysisResult | null;
  selectedEncounter?: Encounter | null;
  isOpen: boolean;
  onClose: () => void;
  queuedQuestion?: string | null;
  onClearQueuedQuestion?: () => void;
}

const STORAGE_KEY = 'vyoma_lluvia_chat_sessions';

export const OrbitalAiPanel: React.FC<OrbitalAiPanelProps> = ({
  analysis,
  selectedEncounter,
  isOpen,
  onClose,
  queuedQuestion,
  onClearQueuedQuestion,
}) => {
  const defaultInitialMessage: ChatMessage = {
    id: 'welcome',
    sender: 'assistant',
    text: `Hey! I'm Lluvia.

I can chat about anything on this Earth—in any language you speak—from everyday life, coding, and witty banter, to live collision risks and orbital conjunctions for ${
      analysis?.satellite.name || 'Cartosat-3'
    }. What would you like to explore?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    modelUsed: 'Lluvia · Groq (openai/gpt-oss-120b)',
  };

  // Load saved sessions from localStorage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[Lluvia] Failed to parse local chat history', e);
    }
    const defaultSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Current Mission Chat',
      updatedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      messages: [defaultInitialMessage],
    };
    return [defaultSession];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || `session-${Date.now()}`;
  });

  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active session helper
  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [defaultInitialMessage];

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('[Lluvia] Could not persist sessions to localStorage', e);
    }
  }, [sessions]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, showHistory]);

  // Handle queued questions passed from other views
  useEffect(() => {
    if (queuedQuestion) {
      handleSend(queuedQuestion);
      if (onClearQueuedQuestion) onClearQueuedQuestion();
    }
  }, [queuedQuestion]);

  const handleStartNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Conversation',
      updatedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `welcome-${Date.now()}`,
          sender: 'assistant',
          text: `Hey! Starting fresh with Lluvia. Ask me anything in any language—everyday questions, deep thoughts, coding, or orbital mechanics.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'Lluvia · Groq (openai/gpt-oss-120b)',
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setShowHistory(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (remaining.length === 0) {
        const resetSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: 'Current Mission Chat',
          updatedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          messages: [defaultInitialMessage],
        };
        setCurrentSessionId(resetSession.id);
        return [resetSession];
      }
      if (currentSessionId === sessionId) {
        setCurrentSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update active session messages
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const isFirstUserMsg = !s.messages.some((m) => m.sender === 'user');
          const autoTitle = isFirstUserMsg
            ? textToSend.trim().slice(0, 28) + (textToSend.trim().length > 28 ? '...' : '')
            : s.title;
          return {
            ...s,
            title: autoTitle,
            updatedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            messages: [...s.messages, userMsg],
          };
        }
        return s;
      })
    );

    if (!queryText) setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await sendChatMessage({
        message: textToSend.trim(),
        analysis_id: analysis?.analysis_id,
        selected_encounter_id: selectedEncounter?.id,
        conversation_history: history,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.model_used,
        computedFacts: res.computed_facts,
        operationalInterpretation: res.operational_interpretation,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, aiMsg],
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Unable to retrieve response right now. Please verify connection and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, errorMsg],
            };
          }
          return s;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="analytical-panel"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: isMinimized ? '320px' : '450px',
        maxWidth: 'calc(100vw - 40px)',
        height: isMinimized ? '56px' : '620px',
        maxHeight: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 80,
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px #E2E8F0',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        transition: 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '12px 16px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #EA580C, #F97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Bot size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Lluvia
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#F0FDF4',
                  color: '#16A34A',
                  border: '1px solid #BBF7D0',
                  fontWeight: 600,
                }}
              >
                Grok AI
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
              Multilingual · Any Question · Grok-Style Wit
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* History Toggle Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? 'Return to Chat' : 'View Chat History'}
            style={{
              background: showHistory ? 'rgba(234, 88, 12, 0.1)' : 'transparent',
              border: showHistory ? '1px solid rgba(234, 88, 12, 0.3)' : '1px solid transparent',
              borderRadius: '6px',
              color: showHistory ? '#EA580C' : '#64748B',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <History size={16} />
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleStartNewChat}
            title="Start New Chat"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: '6px',
              color: '#64748B',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Plus size={16} />
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px' }}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {showHistory ? (
            /* Chat History View */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setShowHistory(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                    Chat History ({sessions.length})
                  </span>
                </div>
                <button
                  onClick={handleStartNewChat}
                  className="liquid-button liquid-button-primary"
                  style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={13} />
                  <span>New Chat</span>
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sessions.map((s) => {
                  const isActive = s.id === currentSessionId;
                  const messageCount = s.messages.filter((m) => m.sender === 'user').length;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setCurrentSessionId(s.id);
                        setShowHistory(false);
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: isActive ? 'rgba(234, 88, 12, 0.06)' : '#FFFFFF',
                        border: isActive ? '1px solid rgba(234, 88, 12, 0.3)' : '1px solid #E2E8F0',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                        <MessageSquare size={16} color={isActive ? '#EA580C' : '#64748B'} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: isActive ? 700 : 600,
                              color: isActive ? '#EA580C' : '#0F172A',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {s.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                            {s.updatedAt} · {messageCount} message{messageCount === 1 ? '' : 's'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        title="Delete this conversation"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Chat View */
            <>
              {/* Quick Prompts Chips */}
              <div
                style={{
                  padding: '8px 12px',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {[
                  'Hey Lluvia, how are you?',
                  'Talk to me in Spanish',
                  'Which object is closest?',
                  'Explain high risk criteria',
                  'Tell me a cool space fact',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '12px',
                      padding: '3px 10px',
                      fontSize: '0.72rem',
                      color: '#334155',
                      cursor: 'pointer',
                      flexShrink: 0,
                      fontWeight: 500,
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Messages Container */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  backgroundColor: '#F8FAFC',
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        backgroundColor: msg.sender === 'user' ? '#EA580C' : '#FFFFFF',
                        color: msg.sender === 'user' ? '#FFFFFF' : '#0F172A',
                        border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                        fontSize: '0.84rem',
                        lineHeight: '1.55',
                        boxShadow: msg.sender === 'user' ? '0 2px 6px rgba(234, 88, 12, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {msg.text}
                    </div>

                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#94A3B8',
                        marginTop: '3px',
                        textAlign: msg.sender === 'user' ? 'right' : 'left',
                      }}
                    >
                      {msg.timestamp} {msg.modelUsed && `· ${msg.modelUsed}`}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.78rem',
                      color: '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Sparkles size={14} className="animate-spin" color="#EA580C" />
                    Lluvia is thinking...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div
                style={{
                  padding: '12px',
                  background: '#FFFFFF',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  placeholder="Ask Lluvia anything, in any language..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="orbital-input"
                  style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="liquid-button liquid-button-primary"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    opacity: loading || !input.trim() ? 0.5 : 1,
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default OrbitalAiPanel;
