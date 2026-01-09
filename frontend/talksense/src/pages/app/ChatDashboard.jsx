import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import chatService from "../../services/chatService";
import { 
  Send, 
  Bot, 
  Loader2, 
  Star, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Edit2,
  CheckCircle2,
  Share2,
  Twitter,
  Linkedin,
  MessageCircle,
  ExternalLink,
  ClipboardCheck,
  Globe
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MessageStatus = {
  LOADING: 'loading',
  STREAMING: 'streaming',
  COMPLETED: 'completed',
  ERROR: 'error'
};

import ShareModal from "../../components/chat/ShareModal";

const MotionDiv = motion.div;

const ChatMessageItem = ({ message, user, handleCopy, handleRate, ratingLoading, onEdit, onShare }) => {
  const onCopyClick = () => {
    handleCopy(message.content);
  };

  const content = typeof message.content === 'string' ? message.content : String(message.content || "");

  return (
    <div 
      className={cn(
        "flex gap-4 p-2 group animate-in fade-in slide-in-from-bottom-2 duration-300",
        message.role === 'assistant' ? "items-start" : "items-start flex-row-reverse"
      )}
    >
      {message.role === 'assistant' ? (
        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0 flex items-center justify-center border border-blue-100 shadow-sm">
          <Bot className="w-6 h-6 text-blue-600" />
        </div>
      ) : (
        <div className="w-10 h-10 flex-shrink-0">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.first_name}
              className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
              <span className="text-slate-600 font-bold text-sm">
                {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className={cn(
        "max-w-[85%] space-y-2 relative",
        "text-left"
      )}>
        <div className={cn(
          "px-6 py-4 rounded-[20px] text-sm md:text-base leading-relaxed relative group-hover:shadow-md transition-shadow",
          message.role === 'assistant' 
            ? "bg-white text-slate-700 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]"
            : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
        )}>
          <div className={cn(
            "prose max-w-none",
            message.role === 'assistant' ? "prose-slate" : "prose-invert"
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}> 
              {content || (message.status === MessageStatus.LOADING ? "" : "_No content_")}
            </ReactMarkdown>
            {(message.status === MessageStatus.STREAMING) && (
              <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse align-middle" />
            )}
          </div>
          {message.status === MessageStatus.LOADING && !content && (
             <div className="flex gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-bounce"></span>
             </div>
          )}


        </div>
        
        <div className={cn(
          "flex flex-col gap-2",
          message.role === 'user' ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "flex items-center gap-4 px-1 opacity-0 group-hover:opacity-100 transition-opacity",
            message.role === 'assistant' ? "flex-row" : "flex-row-reverse"
          )}>
            <button 
              onClick={onCopyClick}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              title="Copy message"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {message.role === 'assistant' && (
              <>
                <button 
                  onClick={() => onShare(message)}
                  className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                  title="Share message"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1 border-l border-slate-100 pl-4 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(message.id, star)}
                      className={cn(
                        "transition-colors",
                        (message.rating >= star) ? "text-yellow-400" : "text-slate-300 hover:text-yellow-200"
                      )}
                      disabled={ratingLoading === message.id}
                    >
                      <Star className={cn("w-3.5 h-3.5", message.rating >= star && "fill-current")} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {message.role === 'user' && (
              <button 
                onClick={() => onEdit(message)}
                className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                title="Edit message"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider px-2">
          {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
        </div>
      </div>
    </div>
  );
};

const ChatDashboard = () => {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);
  
  // Initialize state from location.state if available (for navigation transition)
  const [messages, setMessages] = useState(location.state?.messages || []);
  const [inputText, setInputText] = useState("");
  const [sendingSessionId, setSendingSessionId] = useState(location.state?.sendingSessionId || null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const textareaRef = useRef(null);

  const suggestions = [
    { category: "Learning", items: ["Explain RAG in simple terms", "How does vector search work?", "Deep dive into Transformers"] },
    { category: "Productivity", items: ["Summarize my recent chats", "Create a task list from our discussion", "Draft a technical report"] },
    { category: "Creative", items: ["Write a poem about AI", "Brainstorm feature ideas", "Tell me a geeky joke"] }
  ];

  // Fetch session messages if sessionId is present
  useEffect(() => {
    const fetchSessionDetails = async () => {
      // Don't fetch if we're in the middle of sending/streaming a message in this session
      // or if we have optimistic messages that haven't been persisted yet.
      // This prevents overwriting our local optimistic state with the (initially empty) backend state.
      if (sendingSessionId === sessionId) {
         return;
      }
      
      // Also check if we already have messages loaded that look like they are streaming/loading
      // This is a safety guard against race conditions where sendingSessionId might glitch
      const hasActiveMessages = messages.some(m => m.status === MessageStatus.LOADING || m.status === MessageStatus.STREAMING);
      if (hasActiveMessages && messages.length > 0 && sessionId) {
        return; 
      }

      setIsLoadingSession(true);
      try {
        console.log("Fetching session details for:", sessionId);
        const response = await chatService.getSession(sessionId);
        const fetchedMessages = response.data?.messages || [];
        setMessages(Array.isArray(fetchedMessages) ? fetchedMessages : []);
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setMessages([]);
      } finally {
        setIsLoadingSession(false);
      }
    };

    if (sessionId) {
      if (location.state?.messages && location.state?.sendingSessionId === sessionId) {
          // If we just navigated here with state, don't fetch immediately!
          // We trust the passed state. The streaming process is likely still running 
          // (or will finish) in the background component context or via effect.
          // Note: Since this component effectively "remounts" on route change if the key changes,
          // the streaming closure from the *previous* render might be lost if not carefully handled.
          // However, React Router keeps the same component instance mounted for parameter changes 
          // if it's the same route definition.
          // BUT, if we did a full navigate, we need to be careful. 
          // If the streaming function is running in the *previous* instance closure, it won't update *this* instance's state.
          // The fix implemented here is mainly for the *visuals* not disappearing.
          // Genuine streaming continuity across a full remount would require lifting state up to Context.
          // Assuming <ChatDashboard> stays mounted and only props change, `sendingSessionId` state should stay if we didn't force remount.
          // If `navigate` forces a remount, we are in trouble for the *callback* of the stream.
          
          // FOR NOW: We assume the issue user saw was just the visual "flash" of empty state.
          // We rely on the fact that we set `messages` from `location.state` initially.
          console.log("Using navigation state for initial messages");
      } else {
          fetchSessionDetails();
      }
    } else {
      setMessages([]);
    }
  }, [sessionId]); // Removed sendingSessionId dependency to avoid re-triggering logic unnecessarily

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendingSessionId]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 192)}px`;
    }
  }, [inputText]);

  // Page Title Update
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.substring(0, 30) : "Chat";
      document.title = `TalkSense | ${title}`;
    }
  }, [sessionId, messages]);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleTogglePublic = async () => {
    if (!sessionId) return;
    try {
      const response = await chatService.togglePublic(sessionId);
      setIsPublic(response.data.is_public);
    } catch (error) {
      console.error("Failed to toggle public:", error);
      toast.error("Failed to update sharing settings");
    }
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setInputText(message.content);
    textareaRef.current?.focus();
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sendingSessionId) return;

    const messageContent = inputText;
    setInputText("");

    // 1. Add user message locally IMMEDIATELY
    const tempUserMsg = { id: Date.now(), content: messageContent, role: 'user', created_at: new Date().toISOString() };
    
    // 2. Add placeholder assistant message for streaming IMMEDIATELY
    const assistantMsgId = Date.now() + 1;
    const placeholderAssistantMsg = { 
      id: assistantMsgId, 
      content: "", 
      role: 'assistant', 
      created_at: new Date().toISOString(),
      isStreaming: true,
      // Set to LOADING immediately so the UI shows the typing indicator
      // while backend preprocessing (embeddings / retrieval) runs.
      status: MessageStatus.LOADING
    };
    
    const newMessages = [...messages, tempUserMsg, placeholderAssistantMsg];
    setMessages(newMessages);
    const newSendingSessionId = sessionId || "new";
    setSendingSessionId(newSendingSessionId);

    let currentSessionId = sessionId;

    try {
      if (editingMessage) {
        setMessages(prev => prev.filter(m => m.id !== editingMessage.id));
        setEditingMessage(null);
      }

      // 3. Create session if none exists
      if (!currentSessionId) {
        try {
          const sessionRes = await chatService.createSession({ title: messageContent.substring(0, 30) + "..." });
          currentSessionId = sessionRes.data.id;
          
          // Update local state to reflect the real session ID
          setSendingSessionId(currentSessionId);
          
          // Navigate to the new URL, PASSING THE STATE to avoid blank screen
          navigate(`/chat/${currentSessionId}`, { 
            replace: true,
            state: { 
                messages: newMessages,
                sendingSessionId: currentSessionId
            }
          });
        } catch (sessionError) {
          console.error("Failed to create session:", sessionError);
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId ? { ...m, content: "Sorry, I couldn't start a new conversation. Please try again.", isStreaming: false, status: MessageStatus.ERROR } : m
          ));
          setSendingSessionId(null);
          return; // Stop here if session creation fails
        }
      }

      // 4. Start streaming
      try {
        await chatService.streamMessage(
          {
            session_id: currentSessionId,
            content: messageContent,
            use_rag: true,
            temperature: 0.7
          },
          (chunk) => {
            // Update the specific assistant message content
            setMessages(prev => prev.map(m => 
              m.id === assistantMsgId ? { ...m, content: m.content + chunk, status: MessageStatus.STREAMING } : m
            ));
          },
          async (fullText) => {
            // On complete, mark as not streaming
            setMessages(prev => prev.map(m => 
              m.id === assistantMsgId ? { ...m, content: fullText, isStreaming: false, status: MessageStatus.COMPLETED } : m
            ));
            
            // Refresh messages from backend to get real UUIDs for the new messages
            // This is crucial for actions like 'Rate' to work, which require real UUIDs
            try {
                const refreshedSession = await chatService.getSession(currentSessionId);
                if (refreshedSession.data?.messages) {
                    setMessages(refreshedSession.data.messages);
                }
            } catch (refreshError) {
                console.error("Failed to refresh session after streaming:", refreshError);
            }
            
            setSendingSessionId(null);
          },
          (error) => {
            console.error("Streaming error inside streamMessage:", error);
            setMessages(prev => prev.map(m => 
              m.id === assistantMsgId ? { ...m, content: "Sorry, something went wrong. Please try again in a moment.", isStreaming: false, status: MessageStatus.ERROR } : m
            ));
            setSendingSessionId(null);
          }
        );
      } catch (streamOuterError) {
        console.error("Outer streaming error catch:", streamOuterError);
        setMessages(prev => prev.map(m => 
          m.id === assistantMsgId ? { ...m, content: "Sorry, something went wrong. Please try again in a moment.", isStreaming: false, status: MessageStatus.ERROR } : m
        ));
        setSendingSessionId(null);
      }

    } catch (criticalError) {
      console.error("Critical failure sending message:", criticalError);
      setSendingSessionId(null);
      // Ensure the user message is still there, but update placeholder to show error
      setMessages(prev => {
        const hasAssistantMsg = prev.some(m => m.id === assistantMsgId);
        if (hasAssistantMsg) {
          return prev.map(m => m.id === assistantMsgId ? { ...m, content: "Something went wrong. Check your connection.", isStreaming: false, status: MessageStatus.ERROR } : m);
        }
        return prev;
      });
    }
  };

  const handleRate = async (messageId, rating) => {
    // Prevent rating temporary messages (which have numeric timestamp IDs)
    if (typeof messageId === 'number') {
        toast.error("Please wait a moment for the message to save before rating.");
        return;
    }

    setRatingLoading(messageId);
    try {
      await chatService.rateMessage(messageId, rating);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, rating } : m));
    } catch (error) {
      console.error("Failed to rate message:", error);
      toast.error("Failed to submit rating");
    } finally {
      setRatingLoading(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!", { position: "top-center" });
  };

  return (
    <div className="h-full flex flex-col relative bg-[#F9FAFB]">
      
      {/* Chat Header - Show when session exists */}
      {sessionId && messages.length > 0 && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <h2 className="font-semibold text-slate-800 truncate max-w-xs">
              {messages.find(m => m.role === 'user')?.content.substring(0, 40) || 'Chat'}
            </h2>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      )}
      
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 md:px-8"
      >
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Loading State for Session - Only show if messages are empty */}
          {isLoadingSession && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Loading session...</p>
            </div>
          )}

          {/* Empty State / Suggestions */}
          {!isLoadingSession && !sessionId && messages.length === 0 && (
            <div className="flex flex-col items-center text-center space-y-12 py-12 animate-fade-in">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-200">
                  <Sparkles className="text-white w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                  Hi, {user?.first_name || "there"} 👋
                </h1>
                <p className="text-lg text-slate-500 max-w-lg mx-auto">
                  How can I help you today? I have access to your documents and can answer complex questions.
                </p>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((group) => (
                  <div key={group.category} className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left px-1">
                      {group.category}
                    </h3>
                    {group.items.map((item) => (
                      <button 
                        key={item}
                        className="text-left p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden"
                        onClick={() => setInputText(item)}
                      >
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors relative z-10">
                          {item}
                        </span>
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Send className="w-4 h-4 text-blue-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((message) => (
            <ChatMessageItem 
              key={message.id}
              message={message}
              user={user}
              handleCopy={handleCopy}
              handleRate={handleRate}
              ratingLoading={ratingLoading}
              onEdit={handleEdit}
              onShare={handleShare}
            />
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-transparent">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={handleSendMessage}
            className={cn(
              "relative bg-white rounded-2xl shadow-xl border border-slate-200 focus-within:border-blue-400 transition-all duration-200",
              editingMessage && "ring-2 ring-blue-500/20 border-blue-400"
            )}
          >
            {editingMessage && (
              <div className="flex items-center justify-between px-6 py-2 bg-blue-50/50 border-b border-blue-100 rounded-t-2xl">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Edit2 className="w-3 h-3" />
                  Editing Message
                </span>
                <button 
                  onClick={() => {
                    setEditingMessage(null);
                    setInputText("");
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Loader2 className="w-3.5 h-3.5" /> {/* Close button would be better, but use what's available or default */}
                </button>
              </div>
            )}
            <textarea 
              ref={textareaRef}
              rows="1"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={editingMessage ? "Edit your message..." : "Type your message here..."}
              className="w-full bg-transparent rounded-2xl px-6 py-5 pr-16 text-slate-800 placeholder:text-slate-400 focus:outline-none text-base resize-none overflow-y-auto"
            />
            <div className="absolute right-3 bottom-3">
              <Button 
                type="submit"
                disabled={!inputText.trim() || !!sendingSessionId}
                className="rounded-xl w-10 h-10 p-0 flex items-center justify-center shadow-md bg-blue-600 hover:bg-blue-700"
              >
                {sendingSessionId === (sessionId || "new") ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-semibold uppercase tracking-widest">
            TalkSense AI • Powered by RAG with Gemini
          </p>
        </div>
      </div>

      <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          sessionId={sessionId}
          isPublic={isPublic}
          onTogglePublic={handleTogglePublic}
      />
    </div>
  );
};

export default ChatDashboard;
