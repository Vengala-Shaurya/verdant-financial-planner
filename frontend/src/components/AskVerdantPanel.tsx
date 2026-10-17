import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, AskVerdantResponse, HypotheticalScenario } from '../types';

interface AskVerdantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  onRefreshDashboard?: () => void;
}

// Markdown formatting helper that cleans and renders bold text, lists, and headings cleanly
const formatMarkdownText = (content: string) => {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    // Heading lines (e.g., **Heading:** or ### Heading)
    let processed = line;
    const isHeading = processed.startsWith('### ') || processed.startsWith('## ') || processed.startsWith('# ');
    if (isHeading) {
      processed = processed.replace(/^#+\s*/, '');
      return (
        <p key={idx} className="font-semibold text-[#183D32] mt-2 mb-1 text-xs">
          {renderFormattedInline(processed)}
        </p>
      );
    }

    // Bullet points
    const isBullet = processed.trimStart().startsWith('- ') || processed.trimStart().startsWith('* ');
    if (isBullet) {
      const cleanBullet = processed.trimStart().replace(/^[-*]\s*/, '');
      return (
        <div key={idx} className="flex items-start space-x-1.5 ml-1 my-0.5">
          <span className="text-[#183D32] font-bold">•</span>
          <span className="flex-1">{renderFormattedInline(cleanBullet)}</span>
        </div>
      );
    }

    // Numbered points (e.g. 1. 2.)
    const numMatch = processed.trimStart().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return (
        <div key={idx} className="flex items-start space-x-1.5 ml-1 my-0.5">
          <span className="text-[#183D32] font-semibold font-mono-num">{numMatch[1]}.</span>
          <span className="flex-1">{renderFormattedInline(numMatch[2])}</span>
        </div>
      );
    }

    // Empty lines
    if (!processed.trim()) {
      return <div key={idx} className="h-1.5" />;
    }

    // Regular line
    return (
      <p key={idx} className="my-0.5">
        {renderFormattedInline(processed)}
      </p>
    );
  });
};

// Renders bold (**text** or __text__) and italic (*text*) spans cleanly
const renderFormattedInline = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  // Split on bold markdown **...**
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-[#183D32]">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export const AskVerdantPanel: React.FC<AskVerdantPanelProps> = ({
  isOpen,
  onClose,
  currency = '₹',
  onRefreshDashboard
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    "What happens if my income falls by ₹5,000?",
    "What if my rent increases by ₹2,000?",
    "Why was this savings plan recommended?",
    "How can I reach my emergency fund target sooner?",
    "Which financial goal should I prioritise first?"
  ];

  const loadHistory = async () => {
    try {
      const res = await api.getAiHistory();
      if (res.history && res.history.length > 0) {
        setMessages(res.history);
      } else {
        setMessages([
          {
            role: 'assistant',
            content: "Welcome to **Ask VERDANT**, your private financial planning assistant. I use your verified ledger data, Google Gemini AI synthesis, and deterministic calculations to explain strategy decisions and simulate hypothetical 'what-if' scenarios without altering your actual records."
          }
        ]);
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askVerdant(q);
      const aiResp: AskVerdantResponse = res.response;
      if (aiResp.provider) {
        setActiveProvider(aiResp.provider);
      }
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: aiResp.answer,
        scenario_simulation: aiResp.scenario_simulation
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Unable to process query: ${err.message || 'Server communication error'}. Please try again.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#202822]/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-[#FFFEFA] h-full shadow-2xl border-l border-[#D8DCD1] flex flex-col justify-between">
        {/* Header */}
        <div className="p-5 border-b border-[#D8DCD1] flex items-center justify-between bg-[#FBF9F4]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#183D32] text-[#D5EE75] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-editorial text-xl font-semibold text-[#183D32]">Ask VERDANT</h3>
                {activeProvider && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-[#EAF5D6] text-[#183D32] border border-[#183D32]/20 rounded font-mono-num font-semibold">
                    {activeProvider.includes('Gemini') ? 'Gemini 2.5 Active' : 'Deterministic Mode'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#202822]/60 font-mono-num uppercase tracking-wider">
                Grounded Financial Assistant & What-If Simulator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#202822]/60 hover:text-[#183D32] hover:bg-[#F6F3EB] rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}>
                <div className="flex items-center space-x-1.5 text-[10px] text-[#202822]/50 font-mono-num px-1">
                  {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-[#183D32]" />}
                  <span>{isUser ? 'You' : 'VERDANT Financial Assistant'}</span>
                </div>

                <div
                  className={`p-3.5 rounded-sm text-xs leading-relaxed max-w-[92%] ${
                    isUser
                      ? 'bg-[#183D32] text-[#FFFEFA] shadow-xs'
                      : 'bg-[#F6F3EB] text-[#202822] border border-[#D8DCD1]'
                  }`}
                >
                  {isUser ? m.content : formatMarkdownText(m.content)}

                  {/* Render hypothetical simulation card if present */}
                  {m.scenario_simulation && (
                    <div className="mt-3 pt-3 border-t border-[#D8DCD1] bg-[#FFFEFA] p-3 rounded-xs border text-[11px] font-mono-num space-y-2 text-[#202822]">
                      <div className="flex items-center justify-between text-[#183D32] font-semibold uppercase tracking-wider text-[10px]">
                        <span>Simulated Outcome</span>
                        <span className="px-1.5 py-0.2 bg-[#D5EE75] text-[#183D32] rounded">Exploratory</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[#202822]/60 block">Simulated Surplus</span>
                          <span className="font-bold text-[#183D32]">
                            {currency}{m.scenario_simulation.hypothetical_surplus.toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#202822]/60 block">Surplus Variance</span>
                          <span className={m.scenario_simulation.surplus_shift >= 0 ? 'text-[#183D32] font-bold' : 'text-[#C66D51] font-bold'}>
                            {m.scenario_simulation.surplus_shift >= 0 ? '+' : ''}{currency}{m.scenario_simulation.surplus_shift.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#D8DCD1]/60">
                        <span className="text-[10px] text-[#202822]/60 block mb-1">Impact on Goal Timelines:</span>
                        <div className="space-y-1">
                          {m.scenario_simulation.affected_goals.map((ag, gi) => (
                            <div key={gi} className="flex justify-between text-[10px]">
                              <span className="font-medium truncate max-w-[65%]">{ag.name}</span>
                              <span className="text-[#183D32]">{ag.feasibility}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#183D32] p-2 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm animate-pulse w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Synthesizing response with verified ledger context...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Inquiries */}
        <div className="px-4 py-2 border-t border-[#D8DCD1] bg-[#FBF9F4]">
          <span className="text-[10px] font-mono-num text-[#202822]/60 uppercase tracking-wider block mb-1.5">
            Suggested What-If & Strategic Inquiries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.slice(0, 3).map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSend(sq)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 bg-[#FFFEFA] border border-[#D8DCD1] hover:border-[#183D32] hover:bg-[#F6F3EB] rounded-xs text-[#183D32] transition-colors truncate max-w-full text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Bar */}
        <div className="p-4 border-t border-[#D8DCD1] bg-[#FFFEFA]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask a question or test a scenario (e.g. What if income drops by ₹5,000?)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              className="flex-1 text-xs p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-hidden focus:border-[#183D32]"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-3.5 py-2.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
