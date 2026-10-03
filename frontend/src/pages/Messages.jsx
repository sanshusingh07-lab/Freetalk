import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { messageService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar } from '../components/identity/Avatar.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Plus, 
  Search, 
  ArrowLeft, 
  UserPlus, 
  Sparkles,
  Lock
} from 'lucide-react';

export function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeIdentity } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // New Chat Modal state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchRecipient, setSearchRecipient] = useState('');
  const [recipientsList, setRecipientsList] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle URL query parameters to start or open a chat with a specific user
  useEffect(() => {
    const recipientId = searchParams.get('recipientId');
    if (!recipientId || loading) return;

    // Check if conversation already exists with this recipient
    const existing = conversations.find(c => c.otherIdentity?.id === recipientId);
    if (existing) {
      setActiveConversationId(existing.conversationId);
      return;
    }

    // Otherwise, stage a new pending conversation
    const stagedConvo = {
      conversationId: `pending:${recipientId}`,
      isPending: true,
      otherIdentity: {
        id: recipientId,
        displayName: searchParams.get('name') || 'Anonymous Member',
        avatarSeed: searchParams.get('seed') || 'anon',
        avatarShape: searchParams.get('shape') || 'geometric',
        avatarColor: searchParams.get('color') || '#6366F1'
      },
      lastMessage: {
        content: 'New personal conversation',
        createdAt: new Date().toISOString(),
        isSelf: false
      }
    };

    setConversations(prev => {
      if (prev.some(c => c.otherIdentity?.id === recipientId)) return prev;
      return [stagedConvo, ...prev];
    });
    setActiveConversationId(stagedConvo.conversationId);
    setMessages([]);
    setTimeout(() => chatInputRef.current?.focus(), 150);
  }, [searchParams, loading, conversations]);

  // Load messages & handle socket events when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;

    if (!activeConversationId.startsWith('pending:')) {
      loadMessages(activeConversationId);
      if (socket) {
        socket.emit('join:conversation', activeConversationId);
      }
    } else {
      setMessages([]);
    }

    if (socket) {
      const handleIncomingMessage = (msg) => {
        if (msg.conversationId === activeConversationId) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            const isMe = msg.senderIdentity?.id === activeIdentity?.id;
            return [...prev, { ...msg, isSelf: isMe }];
          });
        }

        // Update sidebar preview
        setConversations(prev => prev.map(c => {
          if (c.conversationId === msg.conversationId) {
            return {
              ...c,
              lastMessage: { content: msg.content, createdAt: msg.createdAt, isSelf: false }
            };
          }
          return c;
        }));
      };

      socket.on('message:received', handleIncomingMessage);
      return () => {
        socket.off('message:received', handleIncomingMessage);
      };
    }
  }, [activeConversationId, socket, activeIdentity]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await messageService.getConversations();
      if (res.data.success) {
        const fetched = res.data.conversations || [];
        setConversations(fetched);

        const recipientId = searchParams.get('recipientId');
        if (!recipientId && fetched.length > 0 && !activeConversationId) {
          setActiveConversationId(fetched[0].conversationId);
        }
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convoId) => {
    try {
      const res = await messageService.getMessages(convoId);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      // silent
    }
  };

  // Search & load discoverable recipients for starting a new chat
  const handleOpenNewChat = async () => {
    setIsNewChatOpen(true);
    setSearchRecipient('');
    try {
      setLoadingRecipients(true);
      const res = await messageService.getRecipients();
      if (res.data.success) {
        setRecipientsList(res.data.recipients || []);
      }
    } catch (err) {
      toast.error("Failed to load community members.");
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSearchRecipients = async (query) => {
    setSearchRecipient(query);
    try {
      setLoadingRecipients(true);
      const res = await messageService.getRecipients(query);
      if (res.data.success) {
        setRecipientsList(res.data.recipients || []);
      }
    } catch (err) {
      // silent
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSelectRecipient = (recipient) => {
    setIsNewChatOpen(false);

    // Check if an existing conversation with this user exists
    const existing = conversations.find(c => c.otherIdentity?.id === recipient.id);
    if (existing) {
      setActiveConversationId(existing.conversationId);
      setTimeout(() => chatInputRef.current?.focus(), 100);
      return;
    }

    // Stage a new pending conversation
    const stagedConvo = {
      conversationId: `pending:${recipient.id}`,
      isPending: true,
      otherIdentity: recipient,
      lastMessage: {
        content: 'New personal conversation',
        createdAt: new Date().toISOString(),
        isSelf: false
      }
    };

    setConversations(prev => [stagedConvo, ...prev.filter(c => c.otherIdentity?.id !== recipient.id)]);
    setActiveConversationId(stagedConvo.conversationId);
    setMessages([]);
    setTimeout(() => chatInputRef.current?.focus(), 150);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    try {
      setIsSending(true);
      const res = await messageService.sendMessage({
        receiverIdentityId: activeConversation.otherIdentity.id,
        content: inputText.trim()
      });

      if (res.data.success) {
        const newMsg = res.data.message;
        setMessages(prev => [...prev, newMsg]);
        setInputText('');

        // If this was a pending conversation, promote it to a live conversation
        if (activeConversation.isPending) {
          const updatedConvo = {
            conversationId: newMsg.conversationId,
            isPending: false,
            otherIdentity: activeConversation.otherIdentity,
            lastMessage: {
              content: newMsg.content,
              createdAt: newMsg.createdAt,
              isSelf: true
            }
          };

          setConversations(prev => [
            updatedConvo,
            ...prev.filter(c => c.conversationId !== activeConversation.conversationId)
          ]);
          setActiveConversationId(newMsg.conversationId);
          if (socket) {
            socket.emit('join:conversation', newMsg.conversationId);
          }
          // Clear URL query param quietly
          setSearchParams({}, { replace: true });
        } else {
          // Update last message in sidebar
          setConversations(prev => prev.map(c => {
            if (c.conversationId === activeConversation.conversationId) {
              return {
                ...c,
                lastMessage: {
                  content: newMsg.content,
                  createdAt: newMsg.createdAt,
                  isSelf: true
                }
              };
            }
            return c;
          }));
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to deliver message.");
    } finally {
      setIsSending(false);
    }
  };

  const activeConversation = conversations.find(c => c.conversationId === activeConversationId);

  return (
    <div className="h-[calc(100vh-8.5rem)] rounded-xl border border-[#E2DED5] flex overflow-hidden shadow-card bg-white">
      {/* Conversations List (Left Pane) */}
      <div className={`w-full sm:w-80 border-r border-[#E2DED5] flex flex-col shrink-0 ${activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
        {/* Header with New Chat Button */}
        <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#F7F5F0]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#C45A3C]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">Personal Chats</span>
            <span className="text-[11px] font-mono text-black font-semibold ml-1">({conversations.length})</span>
          </div>

          <button
            onClick={handleOpenNewChat}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#C45A3C] hover:bg-[#B34F33] text-white shadow-subtle transition-all active:scale-95"
            title="Start new anonymous chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F7F5F0] border border-[#E2DED5] text-[#C45A3C] flex items-center justify-center mx-auto">
                <UserPlus className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-black">Your inbox is quiet</div>
              <p className="text-[11px] text-black leading-relaxed font-sans opacity-85">
                Connect privately with other thinkers. No real identity, email, or profile is ever revealed.
              </p>
              <button
                onClick={handleOpenNewChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#C45A3C] text-white hover:bg-[#B34F33] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start a Chat</span>
              </button>
            </div>
          ) : (
            conversations.map(c => {
              const isSelected = c.conversationId === activeConversationId;
              return (
                <button
                  key={c.conversationId}
                  onClick={() => setActiveConversationId(c.conversationId)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'bg-[#F5E6E1] border border-[#DEACA0] text-black shadow-subtle'
                      : 'hover:bg-[#EFECE4] text-black border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      seed={c.otherIdentity?.avatarSeed || 'anon'}
                      shape={c.otherIdentity?.avatarShape || 'geometric'}
                      color={c.otherIdentity?.avatarColor || '#C45A3C'}
                      size="md"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#68735B] ring-2 ring-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-black truncate">
                        {c.otherIdentity?.displayName}
                      </span>
                      {c.isPending && (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono text-black bg-[#FAF0EC] border border-[#DEACA0] rounded font-semibold">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-black font-normal truncate mt-0.5 opacity-80">
                      {c.lastMessage?.content || "Started conversation"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Chat Pane (Right Pane) */}
      <div className={`flex-1 flex-col justify-between bg-[#FAF9F6] ${activeConversationId ? 'flex' : 'hidden sm:flex'}`}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                {/* Mobile Back button */}
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="sm:hidden p-1.5 rounded-lg text-black hover:bg-[#EFECE4] transition-colors"
                  title="Back to conversations"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <Avatar
                  seed={activeConversation.otherIdentity?.avatarSeed || 'anon'}
                  shape={activeConversation.otherIdentity?.avatarShape || 'geometric'}
                  color={activeConversation.otherIdentity?.avatarColor || '#C45A3C'}
                  size="md"
                />
                <div>
                  <h3 className="text-sm font-bold text-black flex items-center gap-2">
                    <span className="font-serif">{activeConversation.otherIdentity?.displayName}</span>
                    {activeConversation.otherIdentity?.contributionBadge && (
                      <span className="text-[10px] font-medium text-black bg-[#E8ECE4] border border-[#B6C4AC] px-2 py-0.5 rounded-full font-mono">
                        {activeConversation.otherIdentity.contributionBadge}
                      </span>
                    )}
                  </h3>
                  <div className="text-[11px] text-black font-medium flex items-center gap-1 mt-0.5 opacity-85">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#68735B]" />
                    <span>Air-gapped anonymous tunnel • End-to-end privacy</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 text-[11px] text-black font-mono font-medium">
                <Lock className="w-3 h-3 text-black" />
                <span>Zero metadata trace</span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAF9F6]">
              {/* Privacy Banner */}
              <div className="mx-auto max-w-sm p-3 rounded-xl bg-white border border-[#E2DED5] text-center space-y-1 shadow-subtle">
                <div className="text-[11px] font-bold text-black flex items-center justify-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-[#C45A3C]" />
                  <span>Personal Anonymous Chat</span>
                </div>
                <p className="text-[10px] text-black font-normal leading-relaxed font-sans">
                  You are chatting with <strong className="font-bold">{activeConversation.otherIdentity?.displayName}</strong>. No real email, identity, or location is shared.
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-black space-y-2 font-medium">
                  <p>No messages exchanged yet.</p>
                  <p className="text-[11px] text-black opacity-75">Send your first message below to break the ice!</p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isSelf = m.isSelf;
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm border ${
                          isSelf
                            ? 'rounded-br-sm'
                            : 'rounded-bl-sm'
                        }`}
                        style={
                          isSelf
                            ? { backgroundColor: '#F5E6E1', color: '#000000', borderColor: '#DEACA0' }
                            : { backgroundColor: '#FFFFFF', color: '#000000', borderColor: '#D5D0C5' }
                        }
                      >
                        {m.content}
                      </div>
                      <span 
                        className="text-[10px] text-black font-mono font-medium mt-1 px-1"
                        style={{ color: '#000000' }}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#E2DED5] bg-white flex gap-2.5">
              <input
                ref={chatInputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeConversation.otherIdentity?.displayName || 'user'} anonymously...`}
                className="flex-1 bg-[#FAF9F6] border border-[#D5D0C5] rounded-lg px-4 py-2.5 text-xs text-black placeholder:text-black/50 focus:outline-none focus:border-[#C45A3C] transition-colors shadow-inner font-medium"
                style={{ color: '#000000' }}
              />
              <Button 
                type="submit" 
                variant="primary" 
                size="md" 
                icon={Send} 
                isLoading={isSending}
                disabled={!inputText.trim()}
                className="bg-[#C45A3C] hover:bg-[#B34F33] text-white font-bold"
              >
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon={MessageSquare}
              title="No Conversation Selected"
              description="Select an anonymous chat from the sidebar or click 'New Chat' to start talking privately."
              actionText="Start New Chat"
              onAction={handleOpenNewChat}
            />
          </div>
        )}
      </div>

      {/* Start New Chat Modal */}
      <Modal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        title="Start Personal Anonymous Chat"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-black font-medium font-sans">
            Search or pick any community member to start a 1-on-1 private anonymous discussion.
          </p>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-black absolute left-3 top-3" />
            <input
              type="text"
              value={searchRecipient}
              onChange={(e) => handleSearchRecipients(e.target.value)}
              placeholder="Search by anonymous alias..."
              className="w-full bg-[#FAF9F6] border border-[#D5D0C5] rounded-lg pl-9 pr-4 py-2 text-xs text-black placeholder:text-black/50 focus:outline-none focus:border-[#C45A3C] transition-colors font-medium"
              style={{ color: '#000000' }}
            />
          </div>

          {/* Recipient List */}
          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {loadingRecipients ? (
              <div className="py-8 text-center text-xs text-black font-medium">Loading members...</div>
            ) : recipientsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-black font-medium">
                No active anonymous members found matching "{searchRecipient}".
              </div>
            ) : (
              recipientsList.map((recipient) => (
                <button
                  key={recipient.id}
                  onClick={() => handleSelectRecipient(recipient)}
                  className="w-full p-3 rounded-lg flex items-center justify-between gap-3 bg-white hover:bg-[#F5E6E1]/50 border border-[#E2DED5] hover:border-[#DEACA0] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      seed={recipient.avatarSeed}
                      shape={recipient.avatarShape}
                      color={recipient.avatarColor}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-black truncate">
                        {recipient.displayName}
                      </div>
                      <div className="text-[10px] text-black font-mono truncate opacity-80">
                        {recipient.contributionBadge}
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FAF0EC] text-black border border-[#DEACA0] group-hover:bg-[#C45A3C] group-hover:text-white transition-all">
                    Message
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
