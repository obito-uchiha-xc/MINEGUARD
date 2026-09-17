import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import type { AIQueryResponse, NodeSummaryResponse } from '../../types/api';
import './AiModelCopilot.css';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  responseMeta?: AIQueryResponse;
}

interface AiModelCopilotProps {
  nodes?: NodeSummaryResponse[];
  defaultNodeId?: string;
}

const PRESET_PROMPTS = [
  'Evaluate current slope stability across Sector 4',
  'Has any sensor entered tertiary accelerating creep?',
  'Explain why Stope 4B shows elevated deformation risk',
  'What TARP protocol actions are required if pore pressure exceeds 120 kPa?',
  'How do statistical rolling Z-scores differ from physical safety limits?',
  'Analyze correlation between inclinometer tilt and shear displacement',
];

export const AiModelCopilot: React.FC<AiModelCopilotProps> = ({
  nodes = [],
  defaultNodeId = 'All Fleet Probes',
}) => {
  const [selectedNode, setSelectedNode] = useState<string>(defaultNodeId);
  const [focusArea, setFocusArea] = useState<string>('comprehensive');
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content:
        'Greetings. I am the MineGuard Geotechnical Assistive Intelligence model (ADR D-032). ' +
        'I synthesize statistical anomaly detection (StatisticalZScoreDetector & MultiVariateCompoundDetector), ' +
        'kinematic creep progressions (Saito inverse velocity method), and TARP action protocols. ' +
        'Select a target probe and ask any geotechnical question below.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await aiService.queryCopilot({
        query: textToSend,
        node_identifier: selectedNode === 'All Fleet Probes' ? undefined : selectedNode,
        focus_area: focusArea,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseMeta: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content:
          'Unable to complete AI evaluation. The backend model service may be offline or undergoing calibration. ' +
          'Please ensure Phase 6 deterministic rules are monitored at the control desk.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        content:
          'Discussion reset. You can query the assistive AI model regarding slope kinematics, anomaly Z-scores, ' +
          'or recommended TARP response procedures.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="mg-copilot-container">
      {/* COPILOT HEADER */}
      <div className="mg-copilot-header">
        <div className="mg-copilot-header__main">
          <div className="mg-copilot-icon-badge">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="mg-copilot-title-row">
              <h3 className="mg-copilot-title">AI Geotechnical Copilot</h3>
              <span className="mg-copilot-tag">Phase 7 Interactive</span>
            </div>
            <p className="mg-copilot-subtitle">
              Query unsupervised statistical models, kinematic creep stages, and TARP action advisories.
            </p>
          </div>
        </div>

        {/* CONTEXT SELECTORS */}
        <div className="mg-copilot-controls">
          <div className="mg-copilot-control-item">
            <label htmlFor="copilot-node-select">Context Probe:</label>
            <select
              id="copilot-node-select"
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value)}
              className="mg-copilot-select"
            >
              <option value="All Fleet Probes">All Fleet Probes (Sector 4)</option>
              {nodes.map((n) => (
                <option key={n.node_identifier} value={n.node_identifier}>
                  {n.node_identifier} (Zone {n.zone_id})
                </option>
              ))}
            </select>
          </div>

          <div className="mg-copilot-control-item">
            <label htmlFor="copilot-focus-select">Analysis Focus:</label>
            <select
              id="copilot-focus-select"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="mg-copilot-select"
            >
              <option value="comprehensive">Comprehensive Geotechnical</option>
              <option value="creep">Kinematic Creep & Saito 1/v</option>
              <option value="tarp">TARP Protocols & Actions</option>
              <option value="anomalies">Multi-Sensor Z-Scores</option>
            </select>
          </div>

          <button
            type="button"
            className="mg-copilot-reset-btn"
            onClick={handleResetChat}
            title="Reset Conversation"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* QUICK PROMPT PRESETS */}
      <div className="mg-copilot-presets">
        <span className="mg-copilot-presets-label">
          <HelpCircle size={13} /> Suggested Inquiries:
        </span>
        <div className="mg-copilot-presets-list">
          {PRESET_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              className="mg-copilot-preset-chip"
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div className="mg-copilot-stream">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mg-copilot-bubble mg-copilot-bubble--${msg.sender}`}
          >
            <div className="mg-copilot-bubble__avatar">
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className="mg-copilot-bubble__content">
              <div className="mg-copilot-bubble__meta">
                <span className="mg-copilot-bubble__author">
                  {msg.sender === 'user' ? 'Mine Operator / Engineer' : 'MineGuard Assistive AI'}
                </span>
                <span className="mg-copilot-bubble__time">{msg.timestamp}</span>
                <button
                  type="button"
                  className="mg-copilot-copy-btn"
                  onClick={() => handleCopy(msg.id, msg.content)}
                  title="Copy message"
                >
                  {copiedMessageId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>

              {/* VERDICT BADGE IF ASSISTANT RESPONSE */}
              {msg.responseMeta && (
                <div className="mg-copilot-verdict-bar">
                  <div className="mg-copilot-verdict-chip">
                    <CheckCircle2 size={13} />
                    <span>{msg.responseMeta.verdict}</span>
                  </div>
                  <span className="mg-copilot-model-spec">
                    {msg.responseMeta.model_name} • {(msg.responseMeta.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
              )}

              {/* BODY TEXT */}
              <div className="mg-copilot-text">{msg.content}</div>

              {/* GEOTECHNICAL FACTORS */}
              {msg.responseMeta?.geotechnical_factors && msg.responseMeta.geotechnical_factors.length > 0 && (
                <div className="mg-copilot-factors-card">
                  <div className="mg-copilot-card-title">
                    <Layers size={13} /> Key Evaluated Factors:
                  </div>
                  <ul className="mg-copilot-factor-list">
                    {msg.responseMeta.geotechnical_factors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* RECOMMENDED ACTIONS */}
              {msg.responseMeta?.recommended_actions && msg.responseMeta.recommended_actions.length > 0 && (
                <div className="mg-copilot-actions-card">
                  <div className="mg-copilot-card-title">
                    <ShieldAlert size={13} /> Recommended Field Safety Protocol:
                  </div>
                  <ul className="mg-copilot-action-list">
                    {msg.responseMeta.recommended_actions.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ASSISTIVE DISCLAIMER */}
              {msg.responseMeta && (
                <div className="mg-copilot-disclaimer">
                  <AlertTriangle size={12} />
                  <span>{msg.responseMeta.disclaimer}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* LOADING TYPING INDICATOR */}
        {isLoading && (
          <div className="mg-copilot-bubble mg-copilot-bubble--assistant">
            <div className="mg-copilot-bubble__avatar">
              <Bot size={16} />
            </div>
            <div className="mg-copilot-bubble__content">
              <div className="mg-copilot-typing">
                <span className="mg-copilot-dot"></span>
                <span className="mg-copilot-dot"></span>
                <span className="mg-copilot-dot"></span>
                <span className="mg-copilot-typing-label">
                  Computing multi-sensor statistical departures & kinematic cross-checks...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT CONTROLS BAR */}
      <div className="mg-copilot-input-bar">
        <input
          type="text"
          className="mg-copilot-input"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI model about slope stability, anomalies, kinematics, TARP rules..."
          disabled={isLoading}
        />
        <button
          type="button"
          className="mg-copilot-send-btn"
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isLoading}
          title="Send query"
        >
          <Send size={16} />
          <span>Ask Model</span>
        </button>
      </div>
    </div>
  );
};
