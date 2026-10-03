import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { aiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  RotateCcw, 
  ChevronDown, 
  Maximize2, 
  Minimize2,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    sender: 'ai',
    text: `👋 Hello! I am your **FreeTalk In-Built AI Assistant**.\n\nI can help you navigate the platform safely:\n• 🛡️ **Draft Safety Check**: Verify your text before posting to avoid badword or negativity blocks.\n• 🔒 **Privacy Guidance**: Learn how your anonymous identity is shielded.\n• 🔥 **AI Trending Topics**: Discover fast-rising discussion themes across the network.\n• ⚖️ **Constructive Debating**: Tips for presenting arguments persuasively without personal attacks.`,
    chips: [
      "🛡️ Check my draft for badwords",
      "🔒 How does my identity stay anonymous?",
      "🔥 What topics are trending right now?",
      "⚖️ How does Blind Debate work?"
    ]
  }
];

export function AIAssistantWidget() {
  const { user, activeIdentity } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Build lightweight chat history for context
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.text }));

      const res = await aiService.chatWithAssistant(query, chatHistory);
      const aiData = res.data.response;

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiData.reply,
        actionType: aiData.actionType,
        auditData: aiData.data || null,
        suggestedLinks: aiData.suggestedLinks || [],
        chips: aiData.suggestedChips || []
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "⚠️ Sorry, I encountered an issue analyzing that request. Please try again.",
          chips: ["🔥 What topics are trending right now?", "🔒 How does my identity stay anonymous?"]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div 
          className={`border border-border bg-surface shadow-2xl rounded-xl flex flex-col overflow-hidden transition-all duration-200 mb-3 ${
            isExpanded 
              ? 'w-[90vw] sm:w-[540px] h-[80vh] max-h-[700px]' 
              : 'w-[88vw] sm:w-[380px] h-[520px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-paper-100 dark:bg-charcoal-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-terracotta-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif text-sm font-bold text-ink-900 dark:text-ink-100">FreeTalk AI</h3>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-olive-50 dark:bg-olive-950/60 text-olive-700 dark:text-olive-300 border border-olive-200 dark:border-olive-800/60 uppercase tracking-wider">
                    In-Built
                  </span>
                </div>
                <p className="text-[11px] text-ink-500">Content safety, trends & privacy guide</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset Conversation"
                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 hover:bg-paper-200 dark:hover:bg-charcoal-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Minimize" : "Expand"}
                className="hidden sm:block p-1.5 rounded-lg text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 hover:bg-paper-200 dark:hover:bg-charcoal-700 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 hover:bg-paper-200 dark:hover:bg-charcoal-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl p-3.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-terracotta-600 text-white shadow-sm'
                      : 'bg-paper-100 dark:bg-charcoal-800 border border-border text-ink-900 dark:text-ink-100 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line break-words space-y-1">
                    {msg.text.split('\n').map((paragraph, i) => {
                      const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={i}>
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={pIdx} className="font-bold text-terracotta-700 dark:text-terracotta-300">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>

                  {/* Draft Audit Result Card */}
                  {msg.auditData && (
                    <div className="mt-3 p-2.5 rounded-lg bg-surface border border-border text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-ink-500">Safety Status:</span>
                        <span className={`font-bold ${msg.auditData.isSafe ? 'text-olive-600 dark:text-olive-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {msg.auditData.isSafe ? 'Passed (Compliant)' : 'Blocked (Harmful)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-ink-500">Negativity Index:</span>
                        <span className="font-bold text-terracotta-600 dark:text-terracotta-400">
                          {Math.round(msg.auditData.negativityScore * 100)}%
                        </span>
                      </div>
                      {msg.auditData.detectedBadwords?.length > 0 && (
                        <div className="text-rose-600 dark:text-rose-400 pt-1 border-t border-border">
                          Detected Terms: {msg.auditData.detectedBadwords.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Direct Link Badges */}
                  {msg.suggestedLinks?.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border flex flex-wrap gap-2">
                      {msg.suggestedLinks.map((link, lIdx) => (
                        <Link
                          key={lIdx}
                          to={link.to}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-terracotta-50 dark:bg-terracotta-900/30 hover:bg-terracotta-100 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/40 text-[11px] font-semibold transition-colors"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suggested Action Chips */}
                {msg.chips?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[90%]">
                    {msg.chips.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSendMessage(chip)}
                        className="px-2.5 py-1 rounded-lg bg-surface hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 border border-border hover:border-terracotta-500/50 text-[11px] text-ink-700 dark:text-ink-300 hover:text-terracotta-700 dark:hover:text-terracotta-300 transition-all text-left"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-ink-500 p-2">
                <div className="w-2 h-2 rounded-full bg-terracotta-500 animate-ping" />
                <span>FreeTalk AI is analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Draft Checker Shortcut Bar */}
          <div className="px-4 py-1.5 bg-paper-100 dark:bg-charcoal-800 border-t border-border flex items-center justify-between text-[10px] text-ink-500">
            <span>Tip: Type "draft: &lt;text&gt;" to test post safety</span>
            <span className="font-mono text-olive-600 dark:text-olive-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 100% Private
            </span>
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-border bg-surface flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything or check a draft..."
              className="flex-1 bg-paper-50 dark:bg-charcoal-900 border border-border rounded-lg px-3 py-2 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:border-terracotta-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-40 disabled:hover:bg-terracotta-600 text-white shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-ink-900 text-paper-50 dark:bg-paper-100 dark:text-ink-900 font-semibold text-xs shadow-lg border border-border transition-all hover:opacity-95"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-olive-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-olive-500"></span>
        </span>
        <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
        <span className="tracking-wide">AI Assistant</span>
      </button>
    </div>
  );
}
